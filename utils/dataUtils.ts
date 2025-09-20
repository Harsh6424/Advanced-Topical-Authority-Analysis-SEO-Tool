import * as XLSX from 'xlsx';
import type { CsvRow, CategorizedItem, CategorizedUrlData, CategorySummary, SubcategorySummary, DiscoverCategorySummary, DiscoverSubcategorySummary } from '../types';

export function getDomainFromUrl(url: string): string | null {
  try {
    // Ensure the URL has a protocol, otherwise URL constructor fails
    const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const hostname = new URL(fullUrl).hostname;
    // Remove 'www.' prefix if it exists
    return hostname.replace(/^www\./, '');
  } catch (error) {
    console.warn(`Could not parse domain from URL: ${url}`, error);
    return null;
  }
}

export function parseCsv(csvText: string): CsvRow[] {
  try {
    const workbook = XLSX.read(csvText, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return [];
    }
    
    const worksheet = workbook.Sheets[sheetName];
    // sheet_to_json will handle CSV parsing complexities
    const json: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: true });

    if (json.length === 0) {
      return [];
    }

    // Find headers, case-insensitively and trimming whitespace
    const headers = Object.keys(json[0]);
    const urlHeader = headers.find(h => h.trim().toLowerCase() === 'url');
    const clicksHeader = headers.find(h => h.trim().toLowerCase() === 'clicks');
    const impressionsHeader = headers.find(h => h.trim().toLowerCase() === 'impressions');

    if (!urlHeader || !clicksHeader || !impressionsHeader) {
      throw new Error("CSV must contain 'URL', 'Clicks', and 'Impressions' columns.");
    }

    return json.map(row => ({
      URL: String(row[urlHeader] || '').trim(),
      Clicks: Number(row[clicksHeader] || 0),
      Impressions: Number(row[impressionsHeader] || 0),
    })).filter(row => row.URL && !isNaN(row.Clicks) && !isNaN(row.Impressions));

  } catch (error: any) {
    console.error("Error parsing CSV with xlsx:", error);
    if (error.message.includes("columns")) {
      throw error;
    }
    throw new Error("Failed to parse CSV file. Ensure it is a valid CSV with 'URL', 'Clicks', and 'Impressions' columns.");
  }
}


export function processCategorizedData(
  categorizedResults: CategorizedItem[],
  originalCsvData: CsvRow[]
): { 
  categorizedUrls: CategorizedUrlData[], 
  categorySummaries: CategorySummary[],
  subcategorySummaries: SubcategorySummary[],
  discoverCategorySummaries: DiscoverCategorySummary[],
  discoverSubcategorySummaries: DiscoverSubcategorySummary[],
  discoverTop100Urls: CategorizedUrlData[]
} {
  const categorizedMap = new Map(categorizedResults.map(item => [item.url, { contentTheme: item.contentTheme, entity: item.entity, subEntity: item.subEntity }]));
  
  const mergedData: Omit<CategorizedUrlData, 'Clicks_Contribution_Percentage' | 'Impressions_Contribution_Percentage'>[] = originalCsvData.map(row => {
    const categorization = categorizedMap.get(row.URL) || { contentTheme: 'Uncategorized', entity: 'Uncategorized', subEntity: 'N/A' };
    return { ...row, ContentTheme: categorization.contentTheme, Entity: categorization.entity, SubEntity: categorization.subEntity };
  });

  // --- Standard Topical Authority Analysis (Average Clicks) ---
  const themeTotals: { [key: string]: { clicks: number, impressions: number, count: number } } = {};
  const entityTotals: { [key: string]: { clicks: number, impressions: number, count: number } } = {}; // Key: "Theme::Entity"

  mergedData.forEach(row => {
    if (!themeTotals[row.ContentTheme]) {
      themeTotals[row.ContentTheme] = { clicks: 0, impressions: 0, count: 0 };
    }
    themeTotals[row.ContentTheme].clicks += row.Clicks;
    themeTotals[row.ContentTheme].impressions += row.Impressions;
    themeTotals[row.ContentTheme].count += 1;
    
    const entityKey = `${row.ContentTheme}::${row.Entity}`;
    if (!entityTotals[entityKey]) {
        entityTotals[entityKey] = { clicks: 0, impressions: 0, count: 0 };
    }
    entityTotals[entityKey].clicks += row.Clicks;
    entityTotals[entityKey].impressions += row.Impressions;
    entityTotals[entityKey].count += 1;
  });

  const categorizedUrls: CategorizedUrlData[] = mergedData.map(row => {
    const totalThemeClicks = themeTotals[row.ContentTheme]?.clicks || 0;
    const totalThemeImpressions = themeTotals[row.ContentTheme]?.impressions || 0;
    return {
      ...row,
      Clicks_Contribution_Percentage: totalThemeClicks > 0 ? parseFloat(((row.Clicks / totalThemeClicks) * 100).toFixed(2)) : 0,
      Impressions_Contribution_Percentage: totalThemeImpressions > 0 ? parseFloat(((row.Impressions / totalThemeImpressions) * 100).toFixed(2)) : 0,
    };
  });
  
  const ARTICLE_COUNT_THRESHOLD = 2;
  const TOP_N = 5;

  const allThemeSummaries: Omit<CategorySummary, 'performanceTier'>[] = Object.entries(themeTotals).map(([theme, totals]) => ({
    ContentTheme: theme,
    articleCount: totals.count,
    totalClicks: totals.clicks,
    totalImpressions: totals.impressions,
    averageClicks: totals.count > 0 ? parseFloat((totals.clicks / totals.count).toFixed(2)) : 0,
  }));
  
  const themeTopPerformersSet = new Set(allThemeSummaries
    .filter(s => s.articleCount > ARTICLE_COUNT_THRESHOLD)
    .sort((a, b) => b.averageClicks - a.averageClicks)
    .slice(0, TOP_N)
    .map(s => s.ContentTheme));

  const themePotentialPerformersSet = new Set(allThemeSummaries
    .filter(s => s.articleCount <= ARTICLE_COUNT_THRESHOLD)
    .sort((a, b) => b.averageClicks - a.averageClicks)
    .slice(0, TOP_N)
    .map(s => s.ContentTheme));

  let categorySummaries: CategorySummary[] = allThemeSummaries.map(summary => {
    let tier: CategorySummary['performanceTier'] = 'standard';
    if (themeTopPerformersSet.has(summary.ContentTheme)) tier = 'top';
    else if (themePotentialPerformersSet.has(summary.ContentTheme)) tier = 'potential';
    return { ...summary, performanceTier: tier };
  }).sort((a, b) => b.totalClicks - a.totalClicks);

  const allEntitySummaries: Omit<SubcategorySummary, 'performanceTier'>[] = Object.entries(entityTotals).map(([key, totals]) => {
      const [parentTheme, entity] = key.split('::');
      return {
          Entity: entity,
          ParentTheme: parentTheme,
          articleCount: totals.count,
          totalClicks: totals.clicks,
          totalImpressions: totals.impressions,
          averageClicks: totals.count > 0 ? parseFloat((totals.clicks / totals.count).toFixed(2)) : 0,
      };
  });

  const entityTopPerformersSet = new Set(allEntitySummaries
      .filter(s => s.articleCount > ARTICLE_COUNT_THRESHOLD)
      .sort((a, b) => b.averageClicks - a.averageClicks)
      .slice(0, TOP_N)
      .map(s => s.Entity));

  const entityPotentialPerformersSet = new Set(allEntitySummaries
      .filter(s => s.articleCount <= ARTICLE_COUNT_THRESHOLD)
      .sort((a, b) => b.averageClicks - a.averageClicks)
      .slice(0, TOP_N)
      .map(s => s.Entity));

  let subcategorySummaries: SubcategorySummary[] = allEntitySummaries.map(summary => {
      let tier: SubcategorySummary['performanceTier'] = 'standard';
      if (entityTopPerformersSet.has(summary.Entity)) tier = 'top';
      else if (entityPotentialPerformersSet.has(summary.Entity)) tier = 'potential';
      return { ...summary, performanceTier: tier };
  }).sort((a, b) => b.totalClicks - a.totalClicks);

  // --- Google Discover Analysis (Total Clicks from Top 100) ---
  const discoverTop100Urls = [...categorizedUrls].sort((a, b) => b.Clicks - a.Clicks).slice(0, 100);

  const discoverThemeTotals: { [key: string]: { clicks: number, count: number } } = {};
  const discoverEntityTotals: { [key: string]: { clicks: number, count: number } } = {};

  discoverTop100Urls.forEach(row => {
    // Theme totals for discover
    if (!discoverThemeTotals[row.ContentTheme]) {
      discoverThemeTotals[row.ContentTheme] = { clicks: 0, count: 0 };
    }
    discoverThemeTotals[row.ContentTheme].clicks += row.Clicks;
    discoverThemeTotals[row.ContentTheme].count += 1;

    // Entity totals for discover
    const entityKey = `${row.ContentTheme}::${row.Entity}`;
    if (!discoverEntityTotals[entityKey]) {
      discoverEntityTotals[entityKey] = { clicks: 0, count: 0 };
    }
    discoverEntityTotals[entityKey].clicks += row.Clicks;
    discoverEntityTotals[entityKey].count += 1;
  });

  const DISCOVER_ARTICLE_COUNT_THRESHOLD = 2; // More than 2 articles for "Top"
  const DISCOVER_TOP_N = 5;

  // Process Discover Themes
  const allDiscoverThemeSummaries: Omit<DiscoverCategorySummary, 'performanceTier'>[] = Object.entries(discoverThemeTotals).map(([theme, totals]) => ({
    ContentTheme: theme,
    articleCount: totals.count,
    totalClicks: totals.clicks,
  }));
  
  const discoverThemeTopPerformers = allDiscoverThemeSummaries
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .slice(0, DISCOVER_TOP_N);

  const discoverCategorySummaries: DiscoverCategorySummary[] = allDiscoverThemeSummaries.map(summary => {
    const topPerformerInfo = discoverThemeTopPerformers.find(p => p.ContentTheme === summary.ContentTheme);
    let tier: DiscoverCategorySummary['performanceTier'] = 'standard';
    if (topPerformerInfo) {
      tier = topPerformerInfo.articleCount > DISCOVER_ARTICLE_COUNT_THRESHOLD ? 'top' : 'potential';
    }
    return { ...summary, performanceTier: tier };
  }).sort((a, b) => b.totalClicks - a.totalClicks);


  // Process Discover Entities
  const allDiscoverEntitySummaries: Omit<DiscoverSubcategorySummary, 'performanceTier'>[] = Object.entries(discoverEntityTotals).map(([key, totals]) => {
    const [parentTheme, entity] = key.split('::');
    return {
      Entity: entity,
      ParentTheme: parentTheme,
      articleCount: totals.count,
      totalClicks: totals.clicks,
    };
  });

  const discoverEntityTopPerformers = allDiscoverEntitySummaries
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .slice(0, DISCOVER_TOP_N);

  const discoverSubcategorySummaries: DiscoverSubcategorySummary[] = allDiscoverEntitySummaries.map(summary => {
    const topPerformerInfo = discoverEntityTopPerformers.find(p => p.Entity === summary.Entity && p.ParentTheme === summary.ParentTheme);
    let tier: DiscoverSubcategorySummary['performanceTier'] = 'standard';
    if (topPerformerInfo) {
        tier = topPerformerInfo.articleCount > DISCOVER_ARTICLE_COUNT_THRESHOLD ? 'top' : 'potential';
    }
    return { ...summary, performanceTier: tier };
  }).sort((a, b) => b.totalClicks - a.totalClicks);

  return { 
    categorizedUrls, 
    categorySummaries, 
    subcategorySummaries,
    discoverCategorySummaries,
    discoverSubcategorySummaries,
    discoverTop100Urls
  };
}

export function exportToExcel(
  categorizedData: CategorizedUrlData[],
  summaryData: CategorySummary[],
  subcategorySummaryData: SubcategorySummary[],
  discoverCategoryData: DiscoverCategorySummary[],
  discoverSubcategoryData: DiscoverSubcategorySummary[],
  discoverTop100Data: CategorizedUrlData[],
  domainName: string | null
): void {
  const sanitizedDomain = domainName ? domainName.replace(/\./g, '_') : 'report';
  const fileName = `Topical_Authority_Analysis_${sanitizedDomain}.xlsx`;

  const detailedWs = XLSX.utils.json_to_sheet(categorizedData.map(d => ({
    URL: d.URL,
    'Content Theme': d.ContentTheme,
    'Entity': d.Entity,
    'Sub Entity': d.SubEntity,
    Clicks: d.Clicks,
    Impressions: d.Impressions,
    'Clicks Contribution %': d.Clicks_Contribution_Percentage,
    'Impressions Contribution %': d.Impressions_Contribution_Percentage,
  })));
  
  const themeSummaryWs = XLSX.utils.json_to_sheet(summaryData.map(s => ({
    'Content Theme': s.ContentTheme,
    '# of Articles': s.articleCount,
    'Total Clicks': s.totalClicks,
    'Total Impressions': s.totalImpressions,
    'Average Clicks': s.averageClicks,
    'Performance Tier': s.performanceTier.charAt(0).toUpperCase() + s.performanceTier.slice(1),
  })));
  
  const entitySummaryWs = XLSX.utils.json_to_sheet(subcategorySummaryData.map(s => ({
    'Entity': s.Entity,
    'Parent Theme': s.ParentTheme,
    '# of Articles': s.articleCount,
    'Total Clicks': s.totalClicks,
    'Total Impressions': s.totalImpressions,
    'Average Clicks': s.averageClicks,
    'Performance Tier': s.performanceTier.charAt(0).toUpperCase() + s.performanceTier.slice(1),
  })));

  const discoverThemeWs = XLSX.utils.json_to_sheet(discoverCategoryData.map(s => ({
    'Content Theme': s.ContentTheme,
    '# Articles (in Top 100)': s.articleCount,
    'Total Clicks (from Top 100)': s.totalClicks,
    'Discover Tier': s.performanceTier.charAt(0).toUpperCase() + s.performanceTier.slice(1),
  })));

  const discoverEntityWs = XLSX.utils.json_to_sheet(discoverSubcategoryData.map(s => ({
    'Entity': s.Entity,
    'Parent Theme': s.ParentTheme,
    '# Articles (in Top 100)': s.articleCount,
    'Total Clicks (from Top 100)': s.totalClicks,
    'Discover Tier': s.performanceTier.charAt(0).toUpperCase() + s.performanceTier.slice(1),
  })));

  const discoverDetailedWs = XLSX.utils.json_to_sheet(discoverTop100Data.map(d => ({
    URL: d.URL,
    Entity: d.Entity,
    'Sub Entity': d.SubEntity,
    Clicks: d.Clicks,
  })));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, detailedWs, 'Detailed URL Report');
  XLSX.utils.book_append_sheet(wb, themeSummaryWs, 'Topical Authority - Theme');
  XLSX.utils.book_append_sheet(wb, entitySummaryWs, 'Topical Authority - Entity');
  XLSX.utils.book_append_sheet(wb, discoverThemeWs, 'Discover Perf - Theme');
  XLSX.utils.book_append_sheet(wb, discoverEntityWs, 'Discover Perf - Entity');
  XLSX.utils.book_append_sheet(wb, discoverDetailedWs, 'Discover Top 100 Details');

  XLSX.writeFile(wb, fileName);
}
