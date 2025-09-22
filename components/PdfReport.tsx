
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import type { AiInsights, ChartData, CategorySummary, SubcategorySummary, EntityAnalysisSummary } from '../types';
import { InsightIcon } from './Icons';

interface PdfReportProps {
  insights: AiInsights | null;
  chartData: ChartData[];
  analysisData: CategorySummary[];
  subcategoryAnalysisData: SubcategorySummary[];
  entityAnalysisData: EntityAnalysisSummary[];
  websiteDomain: string | null;
}

const PdfReport = React.forwardRef<HTMLDivElement, PdfReportProps>(({ insights, chartData, analysisData, subcategoryAnalysisData, entityAnalysisData, websiteDomain }, ref) => {
  if (!insights) return null;

  const TIER_COLORS = { top: '#2DD4BF', potential: '#FBBF24' };
  
  const getTierStyling = (tier: CategorySummary['performanceTier']) => {
    switch (tier) {
      case 'top': return 'bg-green-200 text-green-800';
      case 'potential': return 'bg-yellow-200 text-yellow-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div ref={ref} className="p-8 bg-gray-900 text-gray-100 font-sans" style={{ width: '800px' }}>
      <header className="text-center mb-8 border-b-2 border-cyan-400 pb-4">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          Content Strategy Report
        </h1>
        <p className="mt-2 text-lg text-gray-400">Generated on {new Date().toLocaleDateString()}</p>
        {websiteDomain && <p className="mt-1 text-md text-gray-500">Analysis for: {websiteDomain}</p>}
      </header>

      <main className="space-y-10">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-cyan-300 border-b border-gray-700 pb-2">Executive Summary</h2>
          <p className="text-gray-300 whitespace-pre-line">{insights.summary}</p>
        </section>

        {insights.nextBigTopic && (
          <section className="bg-purple-900/40 p-6 rounded-lg border border-purple-700">
            <h2 className="text-2xl font-semibold mb-3 text-purple-300 flex items-center gap-2">
              <InsightIcon className="w-6 h-6"/>Next Big Opportunity
            </h2>
            <p className="text-2xl font-bold text-white mb-2">{insights.nextBigTopic.topicName}</p>
            <p className="text-purple-200">{insights.nextBigTopic.reasoning}</p>
          </section>
        )}

        <section className="grid grid-cols-2 gap-8">
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-cyan-300 border-b border-gray-700 pb-2">Key Insights</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    {insights.insights.map((insight, index) => <li key={`insight-${index}`}>{insight}</li>)}
                </ul>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-cyan-300 border-b border-gray-700 pb-2">Recommendations</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    {insights.recommendations.map((rec, index) => <li key={`rec-${index}`}>{rec}</li>)}
                </ul>
            </div>
        </section>

        {insights.discoverInsights && insights.discoverInsights.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-purple-300 border-b border-gray-700 pb-2">Google Discover Opportunities</h2>
            <div className="space-y-6">
              {insights.discoverInsights.map((item, index) => (
                <div key={`discover-${index}`} className="p-4 bg-gray-800 rounded-lg border border-gray-700 break-inside-avoid">
                  <h3 className="font-bold text-lg text-purple-300">{item.entity}</h3>
                  <p className="text-sm text-gray-400 mb-2">Total Clicks (Top 100): {item.totalClicks.toLocaleString()}</p>
                  <p className="text-sm text-gray-300 italic mb-3">{item.reasoning}</p>
                  <table className="min-w-full text-xs text-left text-gray-800 bg-white rounded-lg overflow-hidden">
                    <thead className="bg-gray-300">
                      <tr>
                        <th className="px-3 py-2">Hook (Sub Entity)</th>
                        <th className="px-3 py-2">Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.topSubEntities.map((sub, subIndex) => (
                        <tr key={subIndex} className="border-b border-gray-200 bg-gray-100">
                          <td className="px-3 py-2 font-medium">{sub.subEntity}</td>
                          <td className="px-3 py-2">{sub.clicks.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-cyan-300 border-b border-gray-700 pb-2">Performance Chart</h2>
          <div className="w-full h-80 bg-gray-800 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="name" stroke="#A0AEC0" tick={{ fontSize: 10 }} interval={0} />
                <YAxis stroke="#A0AEC0" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
                  labelStyle={{ color: '#E2E8F0' }}
                  formatter={(value) => [`${(value as number).toLocaleString()}`, 'Avg. Clicks']}
                />
                <Legend formatter={(value, entry) => <span className="text-gray-300">{value}</span>}/>
                <Bar dataKey="averageClicks" name="Average Clicks">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.performanceTier]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-cyan-300 border-b border-gray-700 pb-2">Content Theme Summary</h2>
            <table className="min-w-full text-sm text-left text-gray-800 bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-300 text-xs uppercase">
                    <tr>
                        {['Content Theme', '# Articles', 'Total Clicks', 'Avg Clicks', 'Tier'].map(h => <th key={h} className="px-4 py-2">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {analysisData.map((item) => (
                        <tr key={item.ContentTheme} className={`border-b border-gray-200 ${getTierStyling(item.performanceTier)}`}>
                            <td className="px-4 py-2 font-medium">{item.ContentTheme}</td>
                            <td className="px-4 py-2">{item.articleCount}</td>
                            <td className="px-4 py-2">{item.totalClicks.toLocaleString()}</td>
                            <td className="px-4 py-2 font-semibold">{item.averageClicks.toLocaleString()}</td>
                            <td className="px-4 py-2 capitalize">{item.performanceTier}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-cyan-300 border-b border-gray-700 pb-2">Entity Analysis</h2>
            <table className="min-w-full text-sm text-left text-gray-800 bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-300 text-xs uppercase">
                    <tr>
                        {['Entity', '# of Articles', 'Total Clicks', 'Average Clicks/Article', 'Tier'].map(h => <th key={h} className="px-4 py-2">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {entityAnalysisData.map((item) => (
                        <tr key={`${item.Entity}-analysis-pdf`} className={`border-b border-gray-200 ${getTierStyling(item.performanceTier)}`}>
                            <td className="px-4 py-2 font-medium">{item.Entity}</td>
                            <td className="px-4 py-2">{item.articleCount}</td>
                            <td className="px-4 py-2">{item.totalClicks.toLocaleString()}</td>
                            <td className="px-4 py-2 font-semibold">{item.averageClicks.toLocaleString()}</td>
                            <td className="px-4 py-2 capitalize">{item.performanceTier}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-cyan-300 border-b border-gray-700 pb-2">Entity Summary (Detailed)</h2>
            <table className="min-w-full text-sm text-left text-gray-800 bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-300 text-xs uppercase">
                    <tr>
                        {['Entity', 'Parent Theme', '# Articles', 'Avg Clicks', 'Tier'].map(h => <th key={h} className="px-4 py-2">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {subcategoryAnalysisData.map((item) => (
                        <tr key={`${item.ParentTheme}-${item.Entity}`} className={`border-b border-gray-200 ${getTierStyling(item.performanceTier)}`}>
                            <td className="px-4 py-2 font-medium">{item.Entity}</td>
                            <td className="px-4 py-2">{item.ParentTheme}</td>
                            <td className="px-4 py-2">{item.articleCount}</td>
                            <td className="px-4 py-2 font-semibold">{item.averageClicks.toLocaleString()}</td>
                            <td className="px-4 py-2 capitalize">{item.performanceTier}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>

      </main>
      <footer className="text-center mt-8 text-gray-500 text-xs pt-4 border-t border-gray-700">
        <p>Report Powered by Google Gemini</p>
      </footer>
    </div>
  );
});

export default PdfReport;
