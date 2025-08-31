import * as vscode from 'vscode';
// node-fetchはまだ使いませんが、後で必要なので残しておきます
import fetch from 'node-fetch';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "refix-ai-partner" is now active!');

	let disposable = vscode.commands.registerCommand('refix-ai-partner.reviewSelection', () => {
		// 現在アクティブなパネルがあればそれを表示し、なければ新規作成
		if (RefixPanel.currentPanel) {
			RefixPanel.currentPanel.reveal(vscode.ViewColumn.Beside);
		} else {
			RefixPanel.createOrShow(context.extensionUri);
		}
	});

	context.subscriptions.push(disposable);
}

// Webviewパネルを管理するためのクラス
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

		// すでにパネルが存在する場合は、それを表示
		if (RefixPanel.currentPanel) {
			RefixPanel.currentPanel._panel.reveal(column);
			return;
		}

		// パネルが存在しない場合は、新規作成
		const panel = vscode.window.createWebviewPanel(
			RefixPanel.viewType,
			'Refix AI Review',
			column || vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		RefixPanel.currentPanel = new RefixPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// パネルのコンテンツを設定
		this._panel.webview.html = this._getHtmlForWebview();

		// パネルが閉じられたときの処理
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

	private _getHtmlForWebview() {
		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Refix AI Review</title>
			</head>
			<body>
				<h1>Hello from Refix Webview!</h1>
				<p>ここに、APIから取得したレビュー結果が表示される予定です。</p>
			</body>
			</html>`;
	}

  public reveal(column?: vscode.ViewColumn) {
    this._panel.reveal(column);
  }
}

export function deactivate() {}