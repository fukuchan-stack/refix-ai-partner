import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "refix-ai-partner" is now active!');

	let disposable = vscode.commands.registerCommand('refix-ai-partner.reviewSelection', () => {
		RefixPanel.createOrShow(context.extensionUri);
	});

	context.subscriptions.push(disposable);
}

class RefixPanel {
	public static currentPanel: RefixPanel | undefined;
	public static readonly viewType = 'refix';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (RefixPanel.currentPanel) {
			RefixPanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			RefixPanel.viewType,
			'Refix AI Review',
			column || vscode.ViewColumn.Beside,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist')]
			}
		);

		RefixPanel.currentPanel = new RefixPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
	}

	public dispose() {
		RefixPanel.currentPanel = undefined;
		this._panel.dispose();
		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist', 'bundle.js');
        const scriptUri = webview.asWebviewUri(scriptPath);

        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <title>Refix Review</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export function deactivate() {}