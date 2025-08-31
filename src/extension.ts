import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "refix-ai-partner" is now active!');

	let disposable = vscode.commands.registerCommand('refix-ai-partner.reviewSelection', async () => {
		// Webviewパネルを作成または表示
		RefixPanel.createOrShow(context.extensionUri);

		// エディタや選択範囲がなければ、ウェルカムメッセージを表示して終了
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.selection.isEmpty) {
			RefixPanel.currentPanel?.postMessage({ command: 'showWelcome' });
			return;
		}

		// --- ここからがAPI通信のロジック ---
		const selectedText = editor.document.getText(editor.selection);
		const configuration = vscode.workspace.getConfiguration('refixAiPartner');
		const projectId = configuration.get<string>('projectId');
		const apiKey = configuration.get<string>('apiKey');

		if (!projectId || !apiKey) {
			const errorMessage = 'Refixの設定（プロジェクトIDとAPIキー）が完了していません。設定を確認してください。';
			vscode.window.showErrorMessage(errorMessage);
			RefixPanel.currentPanel?.postMessage({ command: 'showError', payload: errorMessage });
			return;
		}
		
		// Webviewに「ローディング中」だと伝える
		RefixPanel.currentPanel?.postMessage({ command: 'showLoading' });

		try {
			const response = await fetch(`http://localhost:8000/projects/${projectId}/generate-review`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-API-KEY': apiKey
				},
				body: JSON.stringify({
					code: selectedText,
					language: editor.document.languageId,
					mode: 'balanced' // 今はまだbalancedモードで固定
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.detail || 'APIリクエストに失敗しました。');
			}

			const reviewResult = await response.json();

			// 成功した結果をWebviewに送信
			RefixPanel.currentPanel?.postMessage({ command: 'showReview', payload: reviewResult });

		} catch (error: any) {
			vscode.window.showErrorMessage(`レビュー生成中にエラー: ${error.message}`);
			// エラー結果をWebviewに送信
			RefixPanel.currentPanel?.postMessage({ command: 'showError', payload: error.message });
		}
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
		const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.Beside;
		if (RefixPanel.currentPanel) {
			RefixPanel.currentPanel._panel.reveal(column);
			return;
		}
		const panel = vscode.window.createWebviewPanel(
			RefixPanel.viewType, 'Refix AI Review', column,
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

	public postMessage(message: any) {
		this._panel.webview.postMessage(message);
	}

	public dispose() {
		RefixPanel.currentPanel = undefined;
		this._panel.dispose();
		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) { x.dispose(); }
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist', 'bundle.js'));
        const nonce = getNonce();
        return `<!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
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