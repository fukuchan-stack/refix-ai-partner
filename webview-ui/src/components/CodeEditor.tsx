import React, { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import hljs from "highlight.js/lib/core";
import toast, { Toaster } from "react-hot-toast";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";

// highlight.jsに言語を登録
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  selectedLine: number | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onCodeChange,
  language,
  onLanguageChange,
  selectedLine,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: any // Monacoの型をanyにすることで、インポート問題を回避
  ) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || "";
    onCodeChange(newCode);

    // Debounce language detection
    const handler = setTimeout(() => {
      if (newCode.trim().length > 10) {
        const result = hljs.highlightAuto(newCode);
        console.log(`Debounced content detected as: ${result.language} with relevance ${result.relevance}`);
        if (result.relevance > 10 && result.language) {
          const detectedLang = result.language === 'javascript' ? 'typescript' : result.language;
          if (detectedLang !== language) {
            onLanguageChange(detectedLang);
            toast.success(`Language detected: ${detectedLang.toUpperCase()}`);
          }
        }
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  };

  useEffect(() => {
    if (editorRef.current && selectedLine) {
      editorRef.current.revealLineInCenter(selectedLine, 1);
      editorRef.current.setSelection({
        startLineNumber: selectedLine,
        startColumn: 1,
        endLineNumber: selectedLine,
        endColumn: 1000,
      });
    }
  }, [selectedLine]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-grow relative">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            scrollBeyondLastLine: false,
          }}
        />
        <Toaster position="bottom-right" />
      </div>
      <div className="bg-gray-800 px-3 py-1 text-xs text-gray-400">
        Language: {language || "plaintext"}
      </div>
    </div>
  );
};