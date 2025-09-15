import React, { useState, useCallback, useEffect } from 'react';
import type { AppStep, CategorizedUrlData, CategorySummary, SubcategorySummary, AiInsights, ChartData, CsvRow, HistoryEntry, ChatMessage } from './types';
import { categorizeUrlsFromCsv, fetchInsights, fetchChatResponse } from './services/geminiService';
import { parseCsv, processCategorizedData, getDomainFromUrl } from './utils/dataUtils';
import { useLocalStorage } from './hooks/useLocalStorage';
import ApiKeyInput from './components/ApiKeyInput';
import FileUpload from './components/FileUpload';
import ResultsTable from './components/ResultsTable';
import InsightsDisplay from './components/InsightsDisplay';
import EmailDraft from './components/EmailDraft';
import Loader from './components/Loader';
import StepIndicator from './components/StepIndicator';
import History from './components/History';
import { HistoryIcon } from './components/Icons';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useLocalStorage<string | null>('gemini-api-key', null);
  const [step, setStep] = useState<AppStep>('upload');
  const [completedSteps, setCompletedSteps] = useState<Set<AppStep>>(new Set(['upload']));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [websiteDomain, setWebsiteDomain] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<CsvRow[]>([]);
  const [categorizedData, setCategorizedData] = useState<CategorizedUrlData[]>([]);
  const [analysisData, setAnalysisData] = useState<CategorySummary[]>([]);
  const [subcategoryAnalysisData, setSubcategoryAnalysisData] = useState<SubcategorySummary[]>([]);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('analysisHistory', []);

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
    handleReset(true); // Soft reset, keeps API key
    setCurrentFile(file);
    setIsLoading(true);
    setError(null);
    setProgressMessage('Reading file...');
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
            setProgressMessage('Parsing CSV data...');
            const parsedData = parseCsv(csvText);
            if (parsedData.length === 0) {
                setError("CSV has no data or is improperly formatted. Ensure it has URL, Clicks, Impressions headers.");
                setIsLoading(false);
                return;
            }
            setOriginalData(parsedData);
            
            // Extract domain from the first URL
            if (parsedData[0]?.URL) {
              setWebsiteDomain(getDomainFromUrl(parsedData[0].URL));
            }
            
            const onProgress = ({ current, total }: { current: number; total: number }) => {
                setProgressMessage(`Categorizing URLs: Batch ${current} of ${total}...`);
            };
            
            const categorizedResults = await categorizeUrlsFromCsv(parsedData, apiKey, onProgress);
            
            setProgressMessage('Finalizing analysis...');
            const { categorizedUrls, categorySummaries, subcategorySummaries } = processCategorizedData(categorizedResults, parsedData);

            setCategorizedData(categorizedUrls);
            setAnalysisData(categorySummaries);
            setSubcategoryAnalysisData(subcategorySummaries);
            setStep('results');
            setCompletedSteps(prev => new Set(prev).add('results'));
        } catch (err: any) {
            console.error("Processing Error:", err);
            setError(`Failed to process data. ${err.message}`);
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        setIsLoading(false);
      };
      reader.readAsText(file);
    } catch (err: any)      {
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
    setProgressMessage('Generating strategic insights...');
    try {
      const { insights, chartData } = await fetchInsights(analysisData, subcategoryAnalysisData, apiKey);
      setInsights(insights);
      setChartData(chartData);
      setStep('insights');
      setCompletedSteps(prev => new Set(prev).add('insights').add('email'));
    } catch (err: any) {
      console.error("Insight Generation Error:", err);
      setError(`Failed to generate insights. ${err.message}`);
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  }, [analysisData, subcategoryAnalysisData, apiKey]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!apiKey || !insights) return;
    
    const newUserMessage: ChatMessage = { role: 'user', content: message };
    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    setIsChatLoading(true);
    setError(null);

    try {
        const response = await fetchChatResponse(analysisData, subcategoryAnalysisData, insights, updatedHistory, message, apiKey);
        const modelMessage: ChatMessage = { role: 'model', content: response };
        setChatHistory([...updatedHistory, modelMessage]);
    } catch (err: any) {
        console.error("Chat Error:", err);
        setError(`AI chat failed. ${err.message}`);
        setChatHistory(chatHistory); // Revert history on error
    } finally {
        setIsChatLoading(false);
    }
  }, [apiKey, insights, chatHistory, analysisData, subcategoryAnalysisData]);


  const handleSaveToHistory = () => {
    if (!insights || !currentFile) return;
    const newEntry: HistoryEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      fileName: currentFile.name,
      websiteDomain,
      categorizedData,
      analysisData,
      subcategoryAnalysisData,
      insights,
      chartData,
    };
    setHistory([newEntry, ...history]);
    alert("Analysis saved to history!");
  };

  const handleLoadFromHistory = (entry: HistoryEntry) => {
    setCategorizedData(entry.categorizedData);
    setAnalysisData(entry.analysisData);
    setSubcategoryAnalysisData(entry.subcategoryAnalysisData);
    setInsights(entry.insights);
    setChartData(entry.chartData);
    setCurrentFile(new File([], entry.fileName)); // Mock file for display
    setWebsiteDomain(entry.websiteDomain);
    setCompletedSteps(new Set(['upload', 'results', 'insights', 'email']));
    setStep('insights');
    setError(null);
    setChatHistory([]);
  };
  
  const handleDeleteFromHistory = (id: number) => {
    setHistory(history.filter(entry => entry.id !== id));
  };
  
  const handleReset = (soft = false) => {
    setStep('upload');
    setCompletedSteps(new Set(['upload']));
    setCategorizedData([]);
    setAnalysisData([]);
    setSubcategoryAnalysisData([]);
    setInsights(null);
    setChartData([]);
    setError(null);
    setOriginalData([]);
    setCurrentFile(null);
    setWebsiteDomain(null);
    setChatHistory([]);
    if (!soft) {
        setApiKey(null);
    }
  };
  
  const handleStepClick = (clickedStep: AppStep) => {
    if (completedSteps.has(clickedStep) || clickedStep === 'history') {
      setStep(clickedStep);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loader message={progressMessage} />;
    }

    switch (step) {
      case 'upload':
        return <FileUpload onFileAnalysis={handleFileAnalysis} />;
      case 'results':
        return (
          <ResultsTable
            categorizedData={categorizedData}
            summaryData={analysisData}
            subcategorySummaryData={subcategoryAnalysisData}
            onGetInsights={handleGetInsights}
            websiteDomain={websiteDomain}
          />
        );
      case 'insights':
        return (
          <InsightsDisplay
            insights={insights}
            chartData={chartData}
            analysisData={analysisData}
            subcategoryAnalysisData={subcategoryAnalysisData}
            websiteDomain={websiteDomain}
            onSaveToHistory={handleSaveToHistory}
            isSaved={history.some(h => h.insights === insights)}
            chatHistory={chatHistory}
            isChatLoading={isChatLoading}
            onSendMessage={handleSendMessage}
          />
        );
      case 'email':
        return (
            <EmailDraft
                insights={insights}
                chartData={chartData}
                analysisData={analysisData}
            />
        );
      case 'history':
        return (
            <History
              history={history}
              onLoad={handleLoadFromHistory}
              onDelete={handleDeleteFromHistory}
            />
        );
      default:
        return <FileUpload onFileAnalysis={handleFileAnalysis} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Advanced Topical Authority Analysis AI Agent
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Unlock content strategy insights from your website data.
          </p>
        </header>
        
        {apiKey ? (
          <>
            <div className="sticky top-4 z-10 bg-gray-800/60 backdrop-blur-md p-3 rounded-xl border border-gray-700 shadow-lg mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <StepIndicator 
                      currentStep={step} 
                      completedSteps={completedSteps} 
                      onStepClick={handleStepClick}
                  />
                  <div className="flex items-center gap-2">
                      <button 
                          onClick={() => handleStepClick('history')}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 transition-colors border border-gray-600"
                          aria-label="View analysis history"
                      >
                          <HistoryIcon/> History
                      </button>
                      <button 
                          onClick={() => handleReset(false)}
                          className="px-4 py-2 text-sm font-medium rounded-md text-gray-200 bg-gray-700 hover:bg-gray-600 transition-colors border border-gray-600"
                      >
                          Start Over
                      </button>
                  </div>
              </div>
            </div>
            
            <main className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 w-full">
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