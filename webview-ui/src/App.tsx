import { useState, useMemo, useEffect } from 'react';
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { CodeEditor } from './components/CodeEditor';
import { ControlSidebar } from './components/ControlSidebar';
import { ResultsPanel } from './components/ResultsPanel';
import ConsolidatedView from './components/ConsolidatedView';
import SnykResults from './components/SnykResults';
import SnykScanModal from './components/SnykScanModal';
import type { Suggestion, FilterType, InspectionResult } from './types';
import { vscode } from './utilities/vscode';
import hljs from "highlight.js/lib/core";
import { FiMenu, FiTrash2 } from 'react-icons/fi';

// highlight.jsに言語を登録 (初回のみ)
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);


function App() {
  const [theme, setTheme] = useState('dark');
  const [inputText, setInputText] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<InspectionResult[]>([]);
  const [activeAiTab, setActiveAiTab] = useState<string>("AI集約表示");
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [consolidatedIssues, setConsolidatedIssues] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInspecting, setIsInspecting] = useState(false);
  const [showClearButton, setShowClearButton] = useState(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case 'codeSelected':
          setInputText(message.text);
          if (message.text) {
            const detectedLang = hljs.highlightAuto(message.text).language || 'plaintext';
            setLanguage(detectedLang);
          }
          setAnalysisResults([]);
          setConsolidatedIssues([]);
          setSelectedSuggestion(null);
          break;
        case 'reviewResult':
          if (message.error) {
            console.error("Review failed:", message.error);
          } else {
            setAnalysisResults(message.results.rawResults);
            setConsolidatedIssues(message.results.consolidatedIssues);
            setActiveAiTab('AI集約表示');
          }
          setIsInspecting(false);
          break;
      }
    };
    window.addEventListener('message', handleMessage);
    vscode.postMessage({ command: 'ready' });
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleInspect = () => {
    if (!inputText.trim()) return;
    setIsInspecting(true);
    setSelectedSuggestion(null);
    vscode.postMessage({
      command: 'inspectCode',
      code: inputText,
      language: language,
    });
  };

  const handleApplySuggestion = (suggestionText: string) => {
    vscode.postMessage({ command: 'applySuggestion', text: suggestionText });
  };
  
  const handleClear = () => {
    setInputText('');
    setLanguage('');
    setAnalysisResults([]);
    setConsolidatedIssues([]);
    setSelectedSuggestion(null);
  };

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

  const currentTheme = document.body.classList.contains('vscode-dark') ? 'dark' : 'light';

  return (
    <main className="flex h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-200 text-sm">
      {isSidebarOpen && (
        <ControlSidebar
            activeAiTab={activeAiTab}
            setActiveAiTab={setActiveAiTab}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            suggestions={allSuggestions}
            showClearButton={showClearButton}
            setShowClearButton={setShowClearButton}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-2 border-b border-gray-700 dark:border-gray-800">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Toggle Sidebar">
                <FiMenu />
             </button>
             <div className="flex items-center space-x-2">
                {showClearButton && (
                    <button title="Clear" onClick={handleClear} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                        <FiTrash2 />
                    </button>
                )}
                <button 
                    onClick={handleInspect} 
                    disabled={isInspecting || !inputText} 
                    className="text-sm font-bold py-1 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {isInspecting ? '実行中...' : '実行'}
                </button>
             </div>
        </header>

        <div className="p-2 flex-grow flex overflow-hidden">
          <Allotment vertical>
            <Allotment.Pane>
              <CodeEditor 
                code={inputText} 
                onCodeChange={setInputText} 
                language={language} 
                selectedLine={selectedLine}
                onLanguageChange={setLanguage}
              />
            </Allotment.Pane>
            <Allotment.Pane>
              <div className="flex flex-col h-full overflow-y-auto bg-white dark:bg-black pl-2">
                {selectedSuggestion ? (
                    <ResultsPanel 
                        selectedSuggestion={selectedSuggestion}
                        setSelectedSuggestion={setSelectedSuggestion}
                        setSelectedLine={setSelectedLine}
                        inputText={inputText}
                        handleApplySuggestion={() => handleApplySuggestion(selectedSuggestion.suggestion)}
                        language={language}
                        theme={currentTheme}
                    />
                ) : activeAiTab === 'AI集約表示' ? (
                    <ConsolidatedView 
                        issues={consolidatedIssues}
                        onSuggestionSelect={setSelectedSuggestion}
                    />
                ) : (
                    <ResultsPanel 
                        filteredSuggestions={filteredSuggestions}
                        selectedSuggestion={null}
                        setSelectedSuggestion={setSelectedSuggestion}
                        setSelectedLine={setSelectedLine}
                        inputText={inputText}
                        handleApplySuggestion={() => {}}
                        language={language}
                        theme={currentTheme}
                    />
                )}
              </div>
            </Allotment.Pane>
          </Allotment>
        </div>
      </div>
    </main>
  );
}

export default App;