import { useState, useMemo, useEffect } from 'react';
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { CodeEditor } from './components/CodeEditor';
import { ControlSidebar } from './components/ControlSidebar';
import { ResultsPanel } from './components/ResultsPanel';
import ConsolidatedView from './components/ConsolidatedView';
import { SnykResults } from './components/SnykResults';
import { SnykScanModal } from './components/SnykScanModal';
import { Suggestion, FilterType, InspectionResult } from './types';

function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') || 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const t = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', t);
    setTheme(t);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // UIを表示するための仮のstate（状態）
  const [inputText, setInputText] = useState<string>('// Select code in your editor and run "Refix: Review"');
  const [language, setLanguage] = useState<string>('typescript');
  const [analysisResults, setAnalysisResults] = useState<InspectionResult[]>([]);
  const [activeAiTab, setActiveAiTab] = useState<string>("AI集約表示");
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [consolidatedIssues, setConsolidatedIssues] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSampleButton, setShowSampleButton] = useState(false);
  const [showClearButton, setShowClearButton] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showSnykButton, setShowSnykButton] = useState(false);
  const [snykResults, setSnykResults] = useState<any | null>(null);
  const [isSnykLoading, setIsSnykLoading] = useState<boolean>(false);
  const [snykError, setSnykError] = useState<string | null>(null);
  const [isSnykModalOpen, setIsSnykModalOpen] = useState(false);

  // 仮のハンドラ関数（まだ機能しません）
  const handleApplySuggestion = () => alert("Apply suggestion clicked!");
  const handleTriggerSnykScan = () => alert("Snyk scan clicked!");
  const handleCloseSnykResults = () => setSnykResults(null);
  
  const allSuggestions = useMemo((): Suggestion[] => {
    const suggestions: Suggestion[] = [];
    analysisResults.forEach((result) => {
        if (result.review?.details) {
            result.review.details.forEach((detail, detailIndex) => {
                suggestions.push({
                    id: `${result.model_name}-${detailIndex}`,
                    model_name: result.model_name,
                    ...detail
                });
            });
        }
    });
    return suggestions;
  }, [analysisResults]);

  const filteredSuggestions = useMemo(() => {
    if (activeAiTab === 'AI集約表示') return [];

    let suggestions = allSuggestions.filter(s => s.model_name === activeAiTab);
    if (activeFilter !== 'All') {
        const mapping: Record<FilterType, string[]> = {
            All: [], 'Repair': ['Security', 'Bug', 'Bug Risk'], 'Performance': ['Performance'],
            'Advance': ['Quality', 'Readability', 'Best Practice', 'Design', 'Style'],
        };
        const targetCategories = mapping[activeFilter];
        suggestions = suggestions.filter(s => targetCategories.includes(s.category));
    }
    return suggestions;
  }, [activeAiTab, activeFilter, allSuggestions]);


  return (
    <main className="flex h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-200">
      {isSidebarOpen && (
        <ControlSidebar
            activeAiTab={activeAiTab}
            setActiveAiTab={setActiveAiTab}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            suggestions={allSuggestions}
            showSampleButton={showSampleButton}
            setShowSampleButton={setShowSampleButton}
            showClearButton={showClearButton}
            setShowClearButton={setShowClearButton}
            showSearchBar={showSearchBar}
            setShowSearchBar={setShowSearchBar}
            showSnykButton={showSnykButton}
            setShowSnykButton={setShowSnykButton}
            theme={theme}
            toggleTheme={toggleTheme}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 flex-grow flex overflow-hidden">
          <Allotment>
            <Allotment.Pane preferredSize={"60%"}>
              <CodeEditor 
                code={inputText} 
                onCodeChange={setInputText} 
                language={language} 
                selectedLine={selectedLine}
                onLanguageChange={setLanguage}
              />
            </Allotment.Pane>
            <Allotment.Pane>
              <div className="flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-black">
                {selectedSuggestion ? (
                    <ResultsPanel 
                        filteredSuggestions={filteredSuggestions}
                        selectedSuggestion={selectedSuggestion}
                        setSelectedSuggestion={setSelectedSuggestion}
                        setSelectedLine={setSelectedLine}
                        inputText={inputText}
                        handleApplySuggestion={handleApplySuggestion}
                        language={language}
                        rateLimitError={false}
                        accessToken={null}
                        theme={theme}
                    />
                ) : activeAiTab === 'AI集約表示' ? (
                    <ConsolidatedView 
                        issues={consolidatedIssues}
                        onSuggestionSelect={setSelectedSuggestion}
                        onAiSelect={setActiveAiTab}
                    />
                ) : (
                    <ResultsPanel 
                        filteredSuggestions={filteredSuggestions}
                        selectedSuggestion={null}
                        setSelectedSuggestion={setSelectedSuggestion}
                        setSelectedLine={setSelectedLine}
                        inputText={inputText}
                        handleApplySuggestion={handleApplySuggestion}
                        language={language}
                        rateLimitError={false}
                        accessToken={null}
                        theme={theme}
                    />
                )}
                <SnykResults
                    results={snykResults}
                    isLoading={isSnykLoading}
                    error={snykError}
                    onClose={handleCloseSnykResults}
                />
              </div>
            </Allotment.Pane>
          </Allotment>
        </div>
      </div>
       <SnykScanModal
          isOpen={isSnykModalOpen}
          onClose={() => setIsSnykModalOpen(false)}
          onScan={handleTriggerSnykScan}
          language={language}
      />
    </main>
  );
}

export default App;