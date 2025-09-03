export type AppStep = 'upload' | 'results' | 'insights' | 'email';

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

export interface AiInsights {
  summary: string;
  insights: string[];
  recommendations: string[];
}

export interface ChartData {
  name: string;
  averageClicks: number;
  performanceTier: 'top' | 'potential';
}