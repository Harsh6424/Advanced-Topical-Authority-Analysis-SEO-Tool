import React from 'react';
import type { CategorizedUrlData, CategorySummary, SubcategorySummary, DiscoverCategorySummary, DiscoverSubcategorySummary, AuthorSummary, EntityAnalysisSummary } from '../types';
import { exportToExcel } from '../utils/dataUtils';
import { DownloadIcon, InsightIcon } from './Icons';

interface ResultsTableProps {
  categorizedData: CategorizedUrlData[];
  summaryData: CategorySummary[];
  subcategorySummaryData: SubcategorySummary[];
  entitySummaryData: EntityAnalysisSummary[];
  authorSummaryData: AuthorSummary[];
  discoverCategorySummaryData: DiscoverCategorySummary[];
  discoverSubcategorySummaryData: DiscoverSubcategorySummary[];
  discoverTop100Data: CategorizedUrlData[];
  onGetInsights: () => void;
  websiteDomain: string | null;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ 
    categorizedData, 
    summaryData, 
    subcategorySummaryData,
    entitySummaryData, 
    authorSummaryData,
    discoverCategorySummaryData,
    discoverSubcategorySummaryData,
    discoverTop100Data,
    onGetInsights, 
    websiteDomain 
}) => {

  const handleDownload = () => {
    exportToExcel(
        categorizedData, 
        summaryData, 
        subcategorySummaryData,
        entitySummaryData, 
        authorSummaryData,
        discoverCategorySummaryData,
        discoverSubcategorySummaryData,
        discoverTop100Data,
        websiteDomain
    );
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
          <h3 className="text-xl font-semibold mb-3 text-cyan-300">Topical Authority: Content Theme Performance</h3>
          <p className="text-sm text-gray-400 mb-3 -mt-2">Based on Average Clicks across all articles.</p>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
              <thead className="bg-gray-700/50">
                <tr>
                  {['Content Theme', '# of Articles', 'Total Clicks', 'Total Impressions', 'Average Clicks'].map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {summaryData.map((item) => {
                  const styling = getTierStyling(item.performanceTier);
                  return (
                    <tr key={item.ContentTheme} className={`${styling.row} hover:bg-gray-700/50`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${styling.text}`}>{item.ContentTheme}</td>
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
        
        {/* NEW Entity Analysis Table */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-3 text-cyan-300">Entity Analysis</h3>
           <p className="text-sm text-gray-400 mb-3 -mt-2">A focused view of entity performance based on Average Clicks.</p>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
              <thead className="bg-gray-700/50">
                <tr>
                  {['Entity', '# of articles', 'Total Clicks', 'Average clicks/article'].map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {entitySummaryData.map((item) => {
                  const styling = getTierStyling(item.performanceTier);
                  return (
                    <tr key={`${item.Entity}-analysis`} className={`${styling.row} hover:bg-gray-700/50`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${styling.text}`}>{item.Entity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.articleCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.totalClicks.toLocaleString()}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${styling.text}`}>{item.averageClicks.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* OLD Subcategory Summary Table */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-3 text-cyan-300">Topical Authority: Entity Performance (Detailed)</h3>
           <p className="text-sm text-gray-400 mb-3 -mt-2">Based on Average Clicks across all articles, including parent theme context.</p>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
              <thead className="bg-gray-700/50">
                <tr>
                  {['Entity', 'Parent Theme', '# of Articles', 'Total Clicks', 'Total Impressions', 'Average Clicks'].map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {subcategorySummaryData.map((item) => {
                  const styling = getTierStyling(item.performanceTier);
                  return (
                    <tr key={`${item.ParentTheme}-${item.Entity}`} className={`${styling.row} hover:bg-gray-700/50`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${styling.text}`}>{item.Entity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.ParentTheme}</td>
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

        {/* Author Summary Table */}
        {authorSummaryData && authorSummaryData.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-3 text-cyan-300">Author Performance</h3>
            <p className="text-sm text-gray-400 mb-3 -mt-2">Based on Total Clicks across all articles by each author.</p>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
                <thead className="bg-gray-700/50">
                  <tr>
                    {['Author Name', '# of Articles', 'Total Clicks', 'Total Impressions', 'Average Clicks'].map(header => (
                      <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {authorSummaryData.map((item) => (
                    <tr key={item.authorName} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.authorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.articleCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.totalClicks.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.totalImpressions.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{item.averageClicks.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Discover Category Summary Table */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-3 text-purple-300">Google Discover: Content Theme Performance</h3>
          <p className="text-sm text-gray-400 mb-3 -mt-2">Based on Total Clicks from the Top 100 performing URLs.</p>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
              <thead className="bg-gray-700/50">
                <tr>
                  {['Content Theme', '# Articles (in Top 100)', 'Total Clicks (from Top 100)'].map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {discoverCategorySummaryData.map((item) => {
                  const styling = getTierStyling(item.performanceTier);
                  return (
                    <tr key={item.ContentTheme} className={`${styling.row} hover:bg-gray-700/50`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${styling.text}`}>{item.ContentTheme}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.articleCount}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${styling.text}`}>{item.totalClicks.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discover Subcategory Summary Table */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-3 text-purple-300">Google Discover: Entity Performance</h3>
          <p className="text-sm text-gray-400 mb-3 -mt-2">Based on Total Clicks from the Top 100 performing URLs.</p>
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
              <thead className="bg-gray-700/50">
                <tr>
                  {['Entity', 'Parent Theme', '# Articles (in Top 100)', 'Total Clicks (from Top 100)'].map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {discoverSubcategorySummaryData.map((item) => {
                  const styling = getTierStyling(item.performanceTier);
                  return (
                    <tr key={`${item.ParentTheme}-${item.Entity}`} className={`${styling.row} hover:bg-gray-700/50`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${styling.text}`}>{item.Entity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.ParentTheme}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.articleCount}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${styling.text}`}>{item.totalClicks.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Discover Top 100 Detailed Table */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-3 text-purple-300">Google Discover: Top 100 URLs Analysis</h3>
          <p className="text-sm text-gray-400 mb-3 -mt-2">Detailed breakdown of the top performing URLs on Discover.</p>
          <div className="overflow-x-auto max-h-96 rounded-lg border border-gray-700">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
              <thead className="bg-gray-700/50 sticky top-0">
                <tr>
                  {['URL', 'Entity', 'Sub Entity (Hook)', 'Clicks'].map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {discoverTop100Data.map((item) => (
                  <tr key={item.URL} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 max-w-xs truncate" title={item.URL}>{item.URL}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.Entity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.SubEntity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">{item.Clicks.toLocaleString()}</td>
                  </tr>
                ))}
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
                    {['URL', 'Content Theme', 'Entity', 'Sub Entity', 'Clicks', 'Impressions', 'Clicks %', 'Impressions %'].map(header => (
                        <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{header}</th>
                    ))}
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {categorizedData.map((item) => (
                  <tr key={item.URL} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 max-w-xs truncate" title={item.URL}>{item.URL}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.ContentTheme}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.Entity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.SubEntity}</td>
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