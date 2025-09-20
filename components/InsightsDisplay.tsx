import React, { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AiInsights, ChartData, CategorySummary, SubcategorySummary, ChatMessage } from '../types';
import { InsightIcon, SaveIcon, PdfIcon } from './Icons';
import ChatBox from './ChatBox';
import PdfReport from './PdfReport';

// Define jsPDF and html2canvas from global scope
declare const jspdf: any;
declare const html2canvas: any;

interface InsightsDisplayProps {
  insights: AiInsights | null;
  chartData: ChartData[];
  analysisData: CategorySummary[];
  subcategoryAnalysisData: SubcategorySummary[];
  websiteDomain: string | null;
  onSaveToHistory: () => void;
  isSaved: boolean;
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (message: string) => void;
}

const InsightCard: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="bg-gray-800/70 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-3 text-cyan-300">{title}</h3>
        {children}
    </div>
);

const CustomLegend = () => (
    <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#2DD4BF' }}></div>
            <span className="text-sm text-gray-300">Top Performer</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#FBBF24' }}></div>
            <span className="text-sm text-gray-300">Potential Performer</span>
        </div>
    </div>
);

const InsightsDisplay: React.FC<InsightsDisplayProps> = (props) => {
  const { insights, chartData, onSaveToHistory, isSaved, websiteDomain } = props;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!insights) return;
    setIsGeneratingPdf(true);
    
    // Allow the PdfReport component to render before capturing
    await new Promise(resolve => setTimeout(resolve, 50));

    if (reportRef.current) {
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                backgroundColor: '#111827' // Match dark background
            });
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = jspdf;
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            
            const sanitizedDomain = websiteDomain ? websiteDomain.replace(/\./g, '_') : 'report';
            const fileName = `Topical_Authority_Report_${sanitizedDomain}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. See console for details.");
        }
    }
    setIsGeneratingPdf(false);
  };

  if (!insights) {
    return (
      <div className="text-center">
        <p>No insights to display.</p>
      </div>
    );
  }
  
  const TIER_COLORS = {
    top: '#2DD4BF', // teal
    potential: '#FBBF24', // amber
  };

  return (
    <div className="space-y-8">
       {isGeneratingPdf && (
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px' }}>
                <PdfReport ref={reportRef} {...props} />
            </div>
        )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-white">Strategic Insights</h2>
        <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <PdfIcon className="w-5 h-5" />
              {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={onSaveToHistory}
              disabled={isSaved}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-800 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <SaveIcon className="w-5 h-5" />
              {isSaved ? 'Saved' : 'Save to History'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2">
            <InsightCard title="Executive Summary">
                <p className="text-gray-300 whitespace-pre-line">{insights.summary}</p>
            </InsightCard>
        </div>

        {insights.nextBigTopic && (
             <div className="md:col-span-2">
                <div className="bg-purple-900/40 p-6 rounded-lg border border-purple-700 ring-2 ring-purple-600/50">
                    <h3 className="text-xl font-semibold mb-3 text-purple-300 flex items-center gap-2">
                        <InsightIcon className="w-6 h-6"/>
                        Next Big Opportunity
                    </h3>
                    <p className="text-2xl font-bold text-white mb-2">{insights.nextBigTopic.topicName}</p>
                    <p className="text-purple-200">{insights.nextBigTopic.reasoning}</p>
                </div>
            </div>
        )}
        
        <InsightCard title="Key Insights">
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            {insights.insights.map((insight, index) => <li key={index}>{insight}</li>)}
          </ul>
        </InsightCard>

        <InsightCard title="Strategic Recommendations">
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            {insights.recommendations.map((rec, index) => <li key={index}>{rec}</li>)}
          </ul>
        </InsightCard>
      </div>

      {insights.discoverInsights && insights.discoverInsights.length > 0 && (
          <InsightCard title="Google Discover Opportunities">
              <div className="space-y-6">
                  {insights.discoverInsights.map((item, index) => (
                      <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                          <h4 className="font-semibold text-lg text-purple-300">{item.entity}</h4>
                          <p className="text-sm text-gray-400 mb-2">Total Clicks (from Top 100): <span className="font-bold text-gray-300">{item.totalClicks.toLocaleString()}</span></p>
                          <p className="text-sm text-gray-300 italic mb-3">
                              <strong className="text-purple-300">AI Reasoning:</strong> {item.reasoning}
                          </p>
                          <div className="overflow-x-auto rounded-md border border-gray-600">
                              <table className="min-w-full text-sm">
                                  <thead className="bg-gray-700/60">
                                      <tr>
                                          <th className="px-4 py-2 text-left font-medium text-gray-300">Hook (Sub Entity)</th>
                                          <th className="px-4 py-2 text-left font-medium text-gray-300">Clicks</th>
                                          <th className="px-4 py-2 text-left font-medium text-gray-300">URL</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-600">
                                      {item.topSubEntities.map((sub, subIndex) => (
                                          <tr key={subIndex} className="hover:bg-gray-700/50">
                                              <td className="px-4 py-2 font-medium text-white">{sub.subEntity}</td>
                                              <td className="px-4 py-2 text-gray-300">{sub.clicks.toLocaleString()}</td>
                                              <td className="px-4 py-2 text-cyan-400 max-w-xs truncate" title={sub.url}>
                                                  <a href={sub.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{sub.url}</a>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  ))}
              </div>
          </InsightCard>
      )}

      <div>
        <InsightCard title="Top & Potential Performers by Average Clicks">
          <div className="w-full h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="name" stroke="#A0AEC0" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="#A0AEC0" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
                  labelStyle={{ color: '#E2E8F0' }}
                  formatter={(value, name, props) => [`${(value as number).toLocaleString()}`, 'Avg. Clicks']}
                />
                <Bar dataKey="averageClicks" name="Average Clicks">
                   {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.performanceTier]} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
             <CustomLegend />
          </div>
        </InsightCard>
      </div>

      <ChatBox 
        history={props.chatHistory}
        isLoading={props.isChatLoading}
        onSendMessage={props.onSendMessage}
      />
    </div>
  );
};

export default InsightsDisplay;