export type AppStep = 'upload' | 'results' | 'insights' | 'email' | 'history';

export interface CsvRow {
  URL: string;
  Clicks: number;
  Impressions: number;
}

export interface CategorizedItem {
  url: string;
  contentTheme: string;
  entity: string;
  subEntity: string;
}

export interface CategorizedUrlData extends CsvRow {
  ContentTheme: string;
  Entity: string;
  SubEntity: string;
  Clicks_Contribution_Percentage: number;
  Impressions_Contribution_Percentage: number;
}

export interface CategorySummary {
  ContentTheme: string;
  articleCount: number;
  totalClicks: number;
  totalImpressions: number;
  averageClicks: number;
  performanceTier: 'top' | 'potential' | 'standard';
}

export interface SubcategorySummary {
  Entity: string;
  ParentTheme: string;
  articleCount: number;
  totalClicks: number;
  totalImpressions: number;
  averageClicks: number;
  performanceTier: 'top' | 'potential' | 'standard';
}

export interface DiscoverCategorySummary {
  ContentTheme: string;
  articleCount: number; // in top 100
  totalClicks: number; // from top 100
  performanceTier: 'top' | 'potential' | 'standard';
}

export interface DiscoverSubcategorySummary {
  Entity: string;
  ParentTheme: string;
  articleCount: number; // in top 100
  totalClicks: number; // from top 100
  performanceTier: 'top' | 'potential' | 'standard';
}

export interface DiscoverInsight {
    entity: string;
    totalClicks: number;
    reasoning: string;
    topSubEntities: {
        subEntity: string;
        url: string;
        clicks: number;
    }[];
}

export interface AiInsights {
  summary: string;
  insights: string[];
  recommendations: string[];
  nextBigTopic: {
    topicName: string;
    reasoning: string;
  };
  discoverInsights?: DiscoverInsight[];
}

export interface ChartData {
  name: string;
  averageClicks: number;
  performanceTier: 'top' | 'potential';
}

export interface HistoryEntry {
  id: number; // Using timestamp for simplicity
  date: string;
  fileName: string;
  websiteDomain: string | null;
  categorizedData: CategorizedUrlData[];
  analysisData: CategorySummary[];
  subcategoryAnalysisData: SubcategorySummary[];
  insights: AiInsights;
  chartData: ChartData[];
  discoverCategorySummaries: DiscoverCategorySummary[];
  discoverSubcategorySummaries: DiscoverSubcategorySummary[];
  discoverTop100Data: CategorizedUrlData[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}