import * as vscode from "vscode";
import { getNonce } from "../utilities/getNonce";
import { getUri } from "../utilities/getUri";
import fetch from "node-fetch";

export class HelloWorldPanel {
  public static currentPanel: HelloWorldPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _extensionUri: vscode.Uri;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, selectedText: string) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

    this._setWebviewMessageListener(this._panel.webview, selectedText);
  }

  public static render(extensionUri: vscode.Uri, selectedText: string) {
    if (HelloWorldPanel.currentPanel) {
      HelloWorldPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
      HelloWorldPanel.currentPanel._panel.webview.postMessage({ command: 'codeSelected', text: selectedText });
    } else {
      const panel = vscode.window.createWebviewPanel(
        "showHelloWorld",
        "Refix Panel",
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, "out"),
            vscode.Uri.joinPath(extensionUri, "webview-ui/build"),
          ],
        }
      );
      HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri, selectedText);
    }
  }

  public dispose() {
    HelloWorldPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    const nonce = getNonce();

    const cspSource = webview.cspSource;
    const csp = `
        default-src 'none'; 
        style-src ${cspSource} 'unsafe-inline' https://cdn.jsdelivr.net; 
        script-src 'nonce-${nonce}' https://cdn.jsdelivr.net;
        worker-src blob:;
        font-src ${cspSource} https://cdn.jsdelivr.net;
        img-src ${cspSource};
    `;

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="${csp}">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Refix Panel</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webview: vscode.Webview, initialSelectedText: string) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;
        const configuration = vscode.workspace.getConfiguration('refixAiPartner');
        const accessToken = configuration.get('apiKey');
        const projectId = configuration.get('projectId');
        const apiBaseUrl = "http://localhost:8000/api";

        switch (command) {
          case 'ready':
            console.log("HelloWorldPanel: 'ready' message received from UI.");
            if (initialSelectedText) {
              console.log("HelloWorldPanel: Sending initial code to UI.");
              webview.postMessage({ command: 'codeSelected', text: initialSelectedText });
            }
            return;

          case 'inspectCode':
            if (!projectId || !accessToken) {
                vscode.window.showErrorMessage("RefixのAPIキーまたはプロジェクトIDが設定されていません。");
                webview.postMessage({ command: 'reviewResult', results: { rawResults: [], consolidatedIssues: [] }});
                return;
            }

            try {
              const headers = { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
              };
              const body = JSON.stringify({ code: message.code, language: message.language });

              const rawPromise = fetch(`${apiBaseUrl}/projects/${projectId}/inspect`, {
                  method: 'POST', headers, body
              });
              const consolidatedPromise = fetch(`${apiBaseUrl}/projects/${projectId}/inspect/consolidated`, {
                  method: 'POST', headers, body
              });
              
              const [rawRes, consolidatedRes] = await Promise.all([rawPromise, consolidatedPromise]);
              
              if (!rawRes.ok || !consolidatedRes.ok) {
                  throw new Error(`API Error: Raw(${rawRes.status}), Consolidated(${consolidatedRes.status})`);
              }

              const rawResults = await rawRes.json();
              const consolidatedIssues = (await consolidatedRes.json()).consolidated_issues;

              webview.postMessage({ command: 'reviewResult', results: { rawResults, consolidatedIssues } });
            } catch(e) {
                vscode.window.showErrorMessage(`API呼び出し中にエラーが発生しました: ${e}`);
                webview.postMessage({ command: 'reviewResult', results: { rawResults: [], consolidatedIssues: [] }});
            }
            return;
            
          case 'applySuggestion':
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && message.text) {
                const edit = new vscode.WorkspaceEdit();
                const entireRange = new vscode.Range(
                    activeEditor.document.positionAt(0),
                    activeEditor.document.positionAt(activeEditor.document.getText().length)
                );
                edit.replace(activeEditor.document.uri, entireRange, message.text);
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage("修正案を適用しました。");
            }
            return;
        }
      },
      undefined,
      this._disposables
    );
  }
}