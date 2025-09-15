import React from 'react';
import type { CategorizedUrlData, CategorySummary, SubcategorySummary } from '../types';
import { exportToExcel } from '../utils/dataUtils';
import { DownloadIcon, InsightIcon } from './Icons';

interface ResultsTableProps {
  categorizedData: CategorizedUrlData[];
  summaryData: CategorySummary[];
  subcategorySummaryData: SubcategorySummary[];
  onGetInsights: () => void;
  websiteDomain: string | null;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ categorizedData, summaryData, subcategorySummaryData, onGetInsights, websiteDomain }) => {

  const handleDownload = () => {
    exportToExcel(categorizedData, summaryData, subcategorySummaryData, websiteDomain);
  };
  
  const getTierStyling = (tier: CategorySummary['performanceTier']) => {
    switch (tier) {
      case 'top':
        return {
          row: 'bg-green-900/30',
          text: 'text-green-300',
        };
      case 'potential':
        return {
          row: 'bg-amber-900/30',
          text: 'text-amber-300',
        };
      default:
        return {
          row: '',
          text: 'text-white',
        };
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-white">Analysis & Review</h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={onGetInsights}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
            >
              <InsightIcon className="w-5 h-5 mr-2" />
              Next: Generate Insights
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800 transition-colors"
            >
              <DownloadIcon className="w-5 h-5 mr-2" />
              Download Excel
            </button>
        </div>

        {/* Category Summary Table */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-3 text-cyan-300">Category Performance Summary</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
              <thead className="bg-gray-700/50">
                <tr>
                  {['Category', '# of Articles', 'Total Clicks', 'Total Impressions', 'Average Clicks'].map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {summaryData.map((item) => {
                  const styling = getTierStyling(item.performanceTier);
                  return (
                    <tr key={item.Category} className={`${styling.row} hover:bg-gray-700/50`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${styling.text}`}>{item.Category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.articleCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.totalClicks.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.totalImpressions.toLocaleString()}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${styling.text}`}>{item.averageClicks.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Subcategory Summary Table */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-cyan-300">Subcategory Performance Summary</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
              <thead className="bg-gray-700/50">
                <tr>
                  {['Subcategory', 'Parent Category', '# of Articles', 'Total Clicks', 'Total Impressions', 'Average Clicks'].map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {subcategorySummaryData.map((item) => {
                  const styling = getTierStyling(item.performanceTier);
                  return (
                    <tr key={`${item.ParentCategory}-${item.Subcategory}`} className={`${styling.row} hover:bg-gray-700/50`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${styling.text}`}>{item.Subcategory}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.ParentCategory}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.articleCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.totalClicks.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.totalImpressions.toLocaleString()}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${styling.text}`}>{item.averageClicks.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>


        {/* Detailed URL Data Table */}
        <div>
          <h3 className="text-xl font-semibold mb-3 text-cyan-300">Detailed URL Report</h3>
          <div className="overflow-x-auto max-h-96 rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
              <thead className="bg-gray-700/50 sticky top-0">
                 <tr>
                    {['URL', 'Category', 'Subcategory', 'Clicks', 'Impressions', 'Clicks %', 'Impressions %'].map(header => (
                        <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                    ))}
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {categorizedData.map((item) => (
                  <tr key={item.URL} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 max-w-xs truncate" title={item.URL}>{item.URL}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.Category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.Subcategory}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.Clicks.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.Impressions.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.Clicks_Contribution_Percentage}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.Impressions_Contribution_Percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;