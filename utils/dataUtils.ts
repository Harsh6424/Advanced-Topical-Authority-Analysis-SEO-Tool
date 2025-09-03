import * as XLSX from 'xlsx';
import type { CsvRow, CategorizedItem, CategorizedUrlData, CategorySummary } from '../types';

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
): { categorizedUrls: CategorizedUrlData[], categorySummaries: CategorySummary[] } {
  const categorizedMap = new Map(categorizedResults.map(item => [item.url, { category: item.category, subcategory: item.subcategory }]));
  const categoryTotals: { [key: string]: { clicks: number, impressions: number, count: number } } = {};

  const mergedData = originalCsvData.map(row => {
    const categorization = categorizedMap.get(row.URL) || { category: 'Uncategorized', subcategory: 'Uncategorized' };
    const { category, subcategory } = categorization;

    if (!categoryTotals[category]) {
      categoryTotals[category] = { clicks: 0, impressions: 0, count: 0 };
    }
    categoryTotals[category].clicks += row.Clicks;
    categoryTotals[category].impressions += row.Impressions;
    categoryTotals[category].count += 1;
    return { ...row, Category: category, Subcategory: subcategory };
  });

  const categorizedUrls: CategorizedUrlData[] = mergedData.map(row => {
    const totalCatClicks = categoryTotals[row.Category].clicks;
    const totalCatImpressions = categoryTotals[row.Category].impressions;
    return {
      ...row,
      Clicks_Contribution_Percentage: totalCatClicks > 0 ? parseFloat(((row.Clicks / totalCatClicks) * 100).toFixed(2)) : 0,
      Impressions_Contribution_Percentage: totalCatImpressions > 0 ? parseFloat(((row.Impressions / totalCatImpressions) * 100).toFixed(2)) : 0,
    };
  });
  
  const allSummaries: Omit<CategorySummary, 'performanceTier'>[] = Object.entries(categoryTotals).map(([category, totals]) => ({
    Category: category,
    articleCount: totals.count,
    totalClicks: totals.clicks,
    totalImpressions: totals.impressions,
    averageClicks: totals.count > 0 ? parseFloat((totals.clicks / totals.count).toFixed(2)) : 0,
  }));
  
  const ARTICLE_COUNT_THRESHOLD = 2;
  const TOP_N = 5;

  // Identify top performers (green) from categories with enough articles
  const topPerformers = allSummaries
    .filter(s => s.articleCount > ARTICLE_COUNT_THRESHOLD)
    .sort((a, b) => b.averageClicks - a.averageClicks)
    .slice(0, TOP_N)
    .map(s => s.Category);
  const topPerformersSet = new Set(topPerformers);

  // Identify potential performers (orange) from categories with few articles
  const potentialPerformers = allSummaries
    .filter(s => s.articleCount <= ARTICLE_COUNT_THRESHOLD)
    .sort((a, b) => b.averageClicks - a.averageClicks)
    .slice(0, TOP_N)
    .map(s => s.Category);
  const potentialPerformersSet = new Set(potentialPerformers);

  let finalSummaries: CategorySummary[] = allSummaries.map(summary => {
    let tier: CategorySummary['performanceTier'] = 'standard';
    if (topPerformersSet.has(summary.Category)) {
        tier = 'top';
    } else if (potentialPerformersSet.has(summary.Category)) {
        tier = 'potential';
    }
    return { ...summary, performanceTier: tier };
  });

  // Sort the final list for display purposes, keeping high-performers at the top
  finalSummaries.sort((a, b) => b.averageClicks - a.averageClicks);


  return { categorizedUrls, categorySummaries: finalSummaries };
}

export function exportToExcel(
  categorizedData: CategorizedUrlData[],
  summaryData: CategorySummary[],
  fileName: string = 'Topical_Authority_Analysis.xlsx'
): void {
  const detailedWs = XLSX.utils.json_to_sheet(categorizedData.map(d => ({
    URL: d.URL,
    Category: d.Category,
    Subcategory: d.Subcategory,
    Clicks: d.Clicks,
    Impressions: d.Impressions,
    'Clicks Contribution %': d.Clicks_Contribution_Percentage,
    'Impressions Contribution %': d.Impressions_Contribution_Percentage,
  })));
  const summaryWs = XLSX.utils.json_to_sheet(summaryData.map(s => ({
    Category: s.Category,
    '# of Articles': s.articleCount,
    'Total Clicks': s.totalClicks,
    'Total Impressions': s.totalImpressions,
    'Average Clicks': s.averageClicks,
    'Performance Tier': s.performanceTier.charAt(0).toUpperCase() + s.performanceTier.slice(1),
  })));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, detailedWs, 'Detailed Report');
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Category Summary');

  XLSX.writeFile(wb, fileName);
}