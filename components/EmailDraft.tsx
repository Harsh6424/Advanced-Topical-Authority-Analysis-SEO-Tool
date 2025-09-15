import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AiInsights, ChartData, CategorySummary } from '../types';

interface EmailDraftProps {
  insights: AiInsights | null;
  chartData: ChartData[];
  analysisData: CategorySummary[];
}

const InsightCard: React.FC<{title: string; children: React.ReactNode; className?: string}> = ({ title, children, className }) => (
    <div className={`bg-gray-800/70 p-6 rounded-lg border border-gray-700 ${className}`}>
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


const EmailDraft: React.FC<EmailDraftProps> = ({ insights, chartData, analysisData }) => {
  const [partnerName, setPartnerName] = useState('<Partner Name>');
  const [copySuccess, setCopySuccess] = useState<string>('');

  const fullEmailText = () => {
    if (!insights || !analysisData) return '';

    const topPerformers = analysisData.filter(
      (cat) => cat.performanceTier === 'top'
    );
    
    let emailBody = `Hi ${partnerName},\n\n`;

    if (topPerformers.length > 0) {
        const topPerformersList = topPerformers
          .map(
            (cat) =>
              `- ${cat.Category}: Averaging ${cat.averageClicks.toLocaleString()} clicks across ${cat.articleCount} articles.`
          )
          .join('\n');
        
        emailBody += `Following our recent content performance analysis, we've identified our top-performing categories. These topics are proven winners, consistently driving high engagement.\n\nHere are the key top-performing categories:\n${topPerformersList}\n\nOur strategic recommendation is to double down on these themes to capitalize on their proven track record.\n\n`;
    } else {
        emailBody += `We've completed the content performance analysis. While we didn't identify any clear top-performing categories in this batch, we did find other valuable insights.\n\n`;
    }

    if (insights.nextBigTopic) {
        emailBody += `Additionally, our analysis has surfaced a promising new content opportunity:\n\n**Next Big Topic:** ${insights.nextBigTopic.topicName}\n**Reasoning:** ${insights.nextBigTopic.reasoning}\n\nThis could be a great area to explore for future content creation.\n\n`;
    }
    
    emailBody += `The chart below provides a visual overview of the top and high-potential performers. Please include a screenshot of it in your final email.\n\nBest regards,\nThe Content Team`;
    
    const subject = `Subject: Content Performance Insights: Top Categories & Next Big Opportunity`;

    return `${subject}\n\n${emailBody}`;
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(fullEmailText()).then(() => {
        setCopySuccess('Email body copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
        setCopySuccess('Failed to copy.');
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  if (!insights) {
    return (
      <div className="text-center text-gray-400">
        <p>No insight data available to draft an email.</p>
      </div>
    );
  }

  const TIER_COLORS = { top: '#2DD4BF', potential: '#FBBF24' };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white">Draft Email for Partner</h2>
      </div>
      
      <div className="space-y-4">
          <label htmlFor="partnerName" className="block text-sm font-medium text-gray-300">Partner Name:</label>
          <input
            type="text"
            id="partnerName"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            className="w-full sm:w-1/3 bg-gray-700 border border-gray-600 text-white rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
          />
      </div>

      <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 space-y-4">
        <p className="text-gray-300 whitespace-pre-wrap">{fullEmailText()}</p>
      </div>
      
      <button
          onClick={handleCopy}
          className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700"
        >
          {copySuccess || 'Copy Email Body to Clipboard'}
      </button>

      <InsightCard title="Performance Chart" className="mt-8">
        <div className="bg-yellow-900/30 text-yellow-200 border border-yellow-700 p-3 rounded-lg mb-6 text-center">
            <strong>Action Required:</strong> Please screenshot this chart and paste it into your email.
        </div>
        <div className="w-full h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
              <XAxis dataKey="name" stroke="#A0AEC0" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="#A0AEC0" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }}
                labelStyle={{ color: '#E2E8F0' }}
                formatter={(value) => [`${(value as number).toLocaleString()}`, 'Avg. Clicks']}
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
  );
};

export default EmailDraft;
