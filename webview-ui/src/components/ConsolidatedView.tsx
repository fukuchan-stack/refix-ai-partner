import { useState } from 'react';
import { FiChevronDown, FiCode } from 'react-icons/fi';
import type { Suggestion } from '../types';

// 各AIモデルに対応するシンプルなアイコン
const AILogo = ({ modelName, onClick }: { modelName: string, onClick?: (name: string) => void }) => {
  const isClickable = !!onClick;
  const baseClasses = "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white";
  const clickableClasses = isClickable ? "cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-gray-800" : "";

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick(modelName);
    }
  };

  if (modelName.includes('Gemini')) return <div onClick={handleClick} className={`${baseClasses} ${clickableClasses} bg-blue-500 hover:ring-blue-500`} title={modelName ? `'${modelName}'の個別表示に切り替え` : undefined}>G</div>;
  if (modelName.includes('Claude')) return <div onClick={handleClick} className={`${baseClasses} ${clickableClasses} bg-orange-500 hover:ring-orange-500`} title={modelName ? `'${modelName}'の個別表示に切り替え` : undefined}>C</div>;
  if (modelName.includes('GPT-4o')) return <div onClick={handleClick} className={`${baseClasses} ${clickableClasses} bg-green-500 hover:ring-green-500`} title={modelName ? `'${modelName}'の個別表示に切り替え` : undefined}>G</div>;
  return null;
};

interface ConsolidatedViewProps {
  issues: any[];
  onSuggestionSelect: (suggestion: Suggestion) => void;
  onAiSelect: (aiName: string) => void;
}

const ConsolidatedView: React.FC<ConsolidatedViewProps> = ({ issues, onSuggestionSelect, onAiSelect }) => {
  const [openIssueId, setOpenIssueId] = useState<string | null>(null);

  if (!issues || issues.length === 0) {
    return <div className="p-4 text-gray-400 text-sm">指摘事項はありません。</div>;
  }

  const toggleIssue = (issueId: string) => {
    setOpenIssueId(openIssueId === issueId ? null : issueId);
  };

  return (
    <div className="py-4 h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-3 px-4">AI集約表示 ({issues.length}件)</h3>
      <div className="space-y-2 px-2">
        {issues.map((issue) => (
          <div key={issue.issue_id} className="bg-gray-800/50 rounded-lg">
            <button
              onClick={() => toggleIssue(issue.issue_id)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="flex items-center flex-shrink-0 space-x-1.5" title="この指摘に合意したAI（クリックで表示切替）">
                  {issue.participating_ais.map((ai: string) => (
                    <AILogo key={ai} modelName={ai} onClick={onAiSelect} />
                  ))}
                </div>
                <div className="flex items-center text-sm min-w-0">
                  <FiCode className="mr-2 text-gray-500 flex-shrink-0" />
                  <span className="font-mono text-gray-400">L{issue.line_number}</span>
                  <span className="ml-3 text-white truncate">{issue.title}</span>
                </div>
              </div>
              <FiChevronDown className={`transition-transform flex-shrink-0 ${openIssueId === issue.issue_id ? 'rotate-180' : ''}`} />
            </button>
            {openIssueId === issue.issue_id && (
              <div className="p-3 border-t border-gray-700 space-y-2">
                {issue.suggestions.map((sugg: Suggestion, index: number) => (
                  <button 
                    key={index} 
                    onClick={() => onSuggestionSelect(sugg)}
                    className="w-full text-left p-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <AILogo modelName={sugg.model_name} />
                      <span className="text-sm font-semibold text-gray-300">{sugg.model_name}</span>
                    </div>
                    <p className="text-sm text-gray-400 pl-6">{sugg.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsolidatedView;