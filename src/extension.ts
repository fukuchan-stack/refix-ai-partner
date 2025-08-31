import * as vscode from 'vscode';

// 拡張機能が有効化されたときに、このメソッドが呼び出されます
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "refix-ai-partner" is now active!');

	// package.jsonで定義したコマンドをここで実装します
	let disposable = vscode.commands.registerCommand('refix-ai-partner.reviewSelection', () => {
		// 現在アクティブなテキストエディタを取得
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			// 現在選択されている部分を取得
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);

			if (selectedText) {
				// テキストが選択されていれば、それを情報メッセージとして表示する
				// (API連携が成功したかどうかの最初のテストに最適です)
				vscode.window.showInformationMessage(`レビュー対象のコード： ${selectedText}`);
				
				// --- 次のステップ ---
				// ここで、selectedTextをRefixバックエンドAPIに送信する処理を実装します。
				
			} else {
				// テキストが選択されていなければ、警告メッセージを表示
				vscode.window.showWarningMessage('Refixでレビューするコードを選択してください。');
			}
		} else {
			// アクティブなエディタがなければ、エラーメッセージを表示
			vscode.window.showErrorMessage('レビュー対象となるアクティブなエディタがありません。');
		}
	});

	context.subscriptions.push(disposable);
}

// 拡張機能が無効化されたときに、このメソッドが呼び出されます
export function deactivate() {}