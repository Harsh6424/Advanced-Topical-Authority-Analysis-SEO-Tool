import React, { useState, useCallback } from 'react';
import type { AppStep, CategorizedUrlData, CategorySummary, AiInsights, ChartData, CsvRow } from './types';
import { categorizeUrlsFromCsv, fetchInsights } from './services/geminiService';
import { parseCsv, processCategorizedData } from './utils/dataUtils';
import ApiKeyInput from './components/ApiKeyInput';
import FileUpload from './components/FileUpload';
import ResultsTable from './components/ResultsTable';
import InsightsDisplay from './components/InsightsDisplay';
import EmailDraft from './components/EmailDraft';
import Loader from './components/Loader';
import StepIndicator from './components/StepIndicator';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>('upload');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [originalData, setOriginalData] = useState<CsvRow[]>([]);
  const [categorizedData, setCategorizedData] = useState<CategorizedUrlData[]>([]);
  const [analysisData, setAnalysisData] = useState<CategorySummary[]>([]);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const handleApiKeySubmit = (key: string) => {
    if (key.trim()) {
      setApiKey(key.trim());
    } else {
      setError("API Key cannot be empty.");
    }
  };

  const handleFileAnalysis = useCallback(async (file: File) => {
    if (!apiKey) {
      setError("API Key is not set. Please refresh and enter your key.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;
        if (!csvText) {
            setError("File is empty or could not be read.");
            setIsLoading(false);
            return;
        }
        
        try {
            const parsedData = parseCsv(csvText);
            if (parsedData.length === 0) {
                setError("CSV has no data or is improperly formatted. Ensure it has URL, Clicks, Impressions headers.");
                setIsLoading(false);
                return;
            }
            setOriginalData(parsedData);
            
            const categorizedResults = await categorizeUrlsFromCsv(parsedData, apiKey);
            const { categorizedUrls, categorySummaries } = processCategorizedData(categorizedResults, parsedData);

            setCategorizedData(categorizedUrls);
            setAnalysisData(categorySummaries);
            setStep('results');
        } catch (err: any) {
            console.error("Processing Error:", err);
            setError(`Failed to process data. ${err.message}`);
        } finally {
            setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        setIsLoading(false);
      };
      reader.readAsText(file);
    } catch (err: any) {
      console.error("File Analysis Error:", err);
      setError(`An unexpected error occurred. ${err.message}`);
      setIsLoading(false);
    }
  }, [apiKey]);

  const handleGetInsights = useCallback(async () => {
    if (!apiKey) {
      setError("API Key is not set. Please refresh and enter your key.");
      return;
    }
    if (analysisData.length === 0) {
      setError("No analysis data available to generate insights.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { insights, chartData } = await fetchInsights(analysisData, apiKey);
      setInsights(insights);
      setChartData(chartData);
      setStep('insights');
    } catch (err: any) {
      console.error("Insight Generation Error:", err);
      setError(`Failed to generate insights. ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [analysisData, apiKey]);

  const handleReset = () => {
    setStep('upload');
    setCategorizedData([]);
    setAnalysisData([]);
    setInsights(null);
    setChartData([]);
    setError(null);
    setOriginalData([]);
  };
  
  const handleGoToEmail = () => {
    setStep('email');
  };

  const handleGoBack = () => {
    if (step === 'results') {
      setStep('upload');
    } else if (step === 'insights') {
      setStep('results');
    } else if (step === 'email') {
      setStep('insights');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loader />;
    }

    switch (step) {
      case 'upload':
        return <FileUpload onFileAnalysis={handleFileAnalysis} />;
      case 'results':
        return (
          <ResultsTable
            categorizedData={categorizedData}
            summaryData={analysisData}
            onGetInsights={handleGetInsights}
            onReset={handleReset}
            onGoBack={handleGoBack}
          />
        );
      case 'insights':
        return (
          <InsightsDisplay
            insights={insights}
            chartData={chartData}
            onReset={handleReset}
            onGoBack={handleGoBack}
            onGoToEmail={handleGoToEmail}
          />
        );
      case 'email':
        return (
            <EmailDraft
                insights={insights}
                chartData={chartData}
                analysisData={analysisData}
                onReset={handleReset}
                onGoBack={handleGoBack}
            />
        );
      default:
        return <FileUpload onFileAnalysis={handleFileAnalysis} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Advanced Topical Authority Analysis AI Agent
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Unlock content strategy insights from your website data.
          </p>
        </header>
        
        {apiKey ? (
          <>
            <StepIndicator currentStep={step} />
            <main className="mt-8 bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 w-full">
              {error && (
                <div className="bg-red-900/50 text-red-200 border border-red-700 p-4 rounded-lg mb-6" role="alert">
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline ml-2">{error}</span>
                </div>
              )}
              {renderContent()}
            </main>
          </>
        ) : (
           <main className="mt-8 bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-xl">
             {error && (
                <div className="bg-red-900/50 text-red-200 border border-red-700 p-4 rounded-lg mb-6" role="alert">
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline ml-2">{error}</span>
                </div>
              )}
             <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} />
           </main>
        )}
      </div>
       <footer className="w-full max-w-7xl mx-auto text-center mt-8 text-gray-500 text-sm">
          <p>Powered by Google Gemini</p>
        </footer>
    </div>
  );
};

export default App;