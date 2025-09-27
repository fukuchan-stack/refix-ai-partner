import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

export class HelloWorldPanel {
  public static currentPanel: HelloWorldPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, selectedText: string) {
    this._panel = panel;

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

    this._panel.webview.onDidReceiveMessage(
      message => {
        if (message.command === 'ready') {
          this.sendSelectedCode(selectedText);
        }
      },
      undefined,
      this._disposables
    );
  }

  public static render(extensionUri: vscode.Uri, selectedText: string) {
    if (HelloWorldPanel.currentPanel) {
      HelloWorldPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
      HelloWorldPanel.currentPanel.sendSelectedCode(selectedText);
    } else {
      const panel = vscode.window.createWebviewPanel(
        "showHelloWorld",
        "Refix Panel",
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out'), vscode.Uri.joinPath(extensionUri, 'webview-ui/build')]
        }
      );

      HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri, selectedText);
    }
  }

  public sendSelectedCode(text: string) {
    this._panel.webview.postMessage({ command: 'codeSelected', text: text });
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
    const nonce = getNonce();
    const csp = `default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}' http://localhost:5173;`;

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="${csp}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="http://localhost:5173/src/main.tsx"></script>
        </body>
      </html>
    `;
  }
}