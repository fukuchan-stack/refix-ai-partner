import * as vscode from 'vscode';
import { HelloWorldPanel } from './panels/HelloWorldPanel';

export function activate(context: vscode.ExtensionContext) {

	const reviewSelectionCommand = vscode.commands.registerCommand("refix-ai-partner.reviewSelection", () => {
		const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selectedText = editor.document.getText(editor.selection);
            HelloWorldPanel.render(context.extensionUri, selectedText);
        } else {
            vscode.window.showInformationMessage("Refix: No active editor or text selection found.");
        }
	});

	context.subscriptions.push(reviewSelectionCommand);
}

export function deactivate() {}