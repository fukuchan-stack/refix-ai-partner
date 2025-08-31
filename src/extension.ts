import * as vscode from 'vscode';
import fetch from 'node-fetch';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "refix-ai-partner" is now active!');

	let disposable = vscode.commands.registerCommand('refix-ai-partner.reviewSelection', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('レビュー対象となるアクティブなエディタがありません。');
			return;
		}

		const selectedText = editor.document.getText(editor.selection);
		if (!selectedText) {
			vscode.window.showWarningMessage('Refixでレビューするコードを選択してください。');
			return;
		}

		// VS Codeの設定から情報を取得
		const configuration = vscode.workspace.getConfiguration('refixAiPartner');
		const projectId = configuration.get<string>('projectId');
		const apiKey = configuration.get<string>('apiKey');

		if (!projectId || !apiKey) {
			vscode.window.showErrorMessage('Refixの設定（プロジェクトIDとAPIキー）が完了していません。設定を確認してください。');
			return;
		}

		const languageId = editor.document.languageId;

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Refix AIがレビューを生成中...",
			cancellable: false
		}, async (progress) => {
			try {
				const response = await fetch(`http://localhost:8000/projects/${projectId}/generate-review`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-API-KEY': apiKey
					},
					body: JSON.stringify({
						code: selectedText,
						language: languageId,
						mode: 'balanced' // まずはbalancedモードで固定
					})
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.detail || 'APIリクエストに失敗しました。');
				}

				const reviewResult = await response.json();
				const reviewContent = JSON.parse(reviewResult.review_content);

				vscode.window.showInformationMessage(`AIレビューが完了しました。スコア: ${reviewContent.overall_score}`);
				
			} catch (error: any) {
				vscode.window.showErrorMessage(`レビュー生成中にエラーが発生しました: ${error.message}`);
			}
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}