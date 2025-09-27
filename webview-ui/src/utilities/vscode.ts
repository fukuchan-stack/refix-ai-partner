import type { WebviewApi } from "vscode-webview";

interface VsCodeApi {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (newState: any) => void;
}

let vscode: VsCodeApi;

// 'acquireVsCodeApi'関数が存在するかチェック
if (typeof acquireVsCodeApi === "function") {
  // VS CodeのWebview環境で実行されている場合、本物のAPIを取得
  vscode = acquireVsCodeApi();
} else {
  // 通常のWebブラウザで実行されている場合、コンソールに出力するダミーのAPIを作成
  vscode = {
    postMessage: (message) => {
      console.log("--- Message posted to mock VS Code API ---");
      console.log(message);
    },
    getState: () => {
      console.log("getState called on mock");
      return {};
    },
    setState: (newState) => {
      console.log("setState called on mock with:", newState);
    },
  };
}

export { vscode };