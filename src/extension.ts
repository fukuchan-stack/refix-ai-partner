import * as vscode from 'vscode';
import { HelloWorldPanel } from './panels/HelloWorldPanel';

export function activate(context: vscode.ExtensionContext) {

	// "Refixでレビュー"コマンド
	const reviewSelectionCommand = vscode.commands.registerCommand("refix-ai-partner.reviewSelection", () => {
		const editor = vscode.window.activeTextEditor;
        let selectedText = "";
        if (editor && editor.selection && !editor.selection.isEmpty) {
            selectedText = editor.document.getText(editor.selection);
        }
        HelloWorldPanel.render(context.extensionUri, selectedText);
	});
	context.subscriptions.push(reviewSelectionCommand);

	// APIキー設定用のコマンド
	const setApiKeyCommand = vscode.commands.registerCommand("refix-ai-partner.setApiKey", async () => {
		const apiKey = await vscode.window.showInputBox({
			prompt: "RefixのAPIキー（Auth0のアクセストークン）を入力してください",
			placeHolder: "ey...",
			ignoreFocusOut: true,
		});
		if (apiKey) {
			await vscode.workspace.getConfiguration('refixAiPartner').update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage("Refix: APIキーを設定しました。");
		}
	});
	context.subscriptions.push(setApiKeyCommand);

	// プロジェクトID設定用のコマンド
	const setProjectIdCommand = vscode.commands.registerCommand("refix-ai-partner.setProjectId", async () => {
		const projectId = await vscode.window.showInputBox({
			prompt: "RefixのプロジェクトIDを入力してください",
			placeHolder: "例: 1",
			ignoreFocusOut: true,
		});
		if (projectId) {
			await vscode.workspace.getConfiguration('refixAiPartner').update('projectId', projectId, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage("Refix: プロジェクトIDを設定しました。");
		}
	});
	context.subscriptions.push(setProjectIdCommand);
}

export function deactivate() {}