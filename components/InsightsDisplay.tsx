import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AiInsights, ChartData } from '../types';
import { RestartIcon, BackIcon, EmailIcon } from './Icons';

interface InsightsDisplayProps {
  insights: AiInsights | null;
  chartData: ChartData[];
  onReset: () => void;
  onGoBack: () => void;
  onGoToEmail: () => void;
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


const InsightsDisplay: React.FC<InsightsDisplayProps> = ({ insights, chartData, onReset, onGoBack, onGoToEmail }) => {
  if (!insights) {
    return (
      <div className="text-center">
        <p>No insights to display.</p>
        <button
          onClick={onReset}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600"
        >
          <RestartIcon className="w-5 h-5 mr-2"/>
          Start Over
        </button>
      </div>
    );
  }
  
  const TIER_COLORS = {
    top: '#2DD4BF', // teal
    potential: '#FBBF24', // amber
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Step 3: Strategic Insights</h2>
      </div>

       <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onGoToEmail}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 transition-transform transform hover:scale-105"
            >
              <EmailIcon className="w-5 h-5 mr-2" />
              Next: Draft Email
            </button>
           <button
             onClick={onGoBack}
             className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800 transition-colors"
           >
              <BackIcon className="w-5 h-5 mr-2"/>
              Back to Analysis
           </button>
           <button
             onClick={onReset}
             className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-gray-600 text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800 transition-colors"
           >
              <RestartIcon className="w-5 h-5 mr-2"/>
              Start Over
           </button>
        </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2">
            <InsightCard title="Executive Summary">
                <p className="text-gray-300 whitespace-pre-line">{insights.summary}</p>
            </InsightCard>
        </div>
        
        <InsightCard title="Key Insights">
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            {insights.insights.map((insight, index) => <li key={index}>{insight}</li>)}
          </ul>
        </InsightCard>

        {/* FIX: Corrected closing tag for InsightCard below. It was </Card> and has been changed to </InsightCard>. */}
        <InsightCard title="Strategic Recommendations">
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            {insights.recommendations.map((rec, index) => <li key={index}>{rec}</li>)}
          </ul>
        </InsightCard>
      </div>

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
    </div>
  );
};

export default InsightsDisplay;