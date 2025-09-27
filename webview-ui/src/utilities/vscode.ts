// webview-ui/src/utilities/vscode.ts

import type { WebviewApi } from "vscode-webview";

interface VsCodeApi {
  postMessage: (message: any) => void;
}

// @ts-ignore
export const vscode: WebviewApi<unknown> | VsCodeApi = acquireVsCodeApi();