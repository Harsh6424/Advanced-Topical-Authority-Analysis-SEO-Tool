export type AppStep = 'upload' | 'results' | 'insights' | 'email' | 'history';

export interface CsvRow {
  URL: string;
  Clicks: number;
  Impressions: number;
}

export interface CategorizedItem {
  url: string;
  category: string;
  subcategory: string;
}

export interface CategorizedUrlData extends CsvRow {
  Category: string;
  Subcategory: string;
  Clicks_Contribution_Percentage: number;
  Impressions_Contribution_Percentage: number;
}

export interface CategorySummary {
  Category: string;
  articleCount: number;
  totalClicks: number;
  totalImpressions: number;
  averageClicks: number;
  performanceTier: 'top' | 'potential' | 'standard';
}

export interface SubcategorySummary {
  Subcategory: string;
  ParentCategory: string;
  articleCount: number;
  totalClicks: number;
  totalImpressions: number;
  averageClicks: number;
  performanceTier: 'top' | 'potential' | 'standard';
}

export interface AiInsights {
  summary: string;
  insights: string[];
  recommendations: string[];
  nextBigTopic: {
    topicName: string;
    reasoning: string;
  };
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
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}