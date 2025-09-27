import * as vscode from 'vscode';
import { HelloWorldPanel } from './panels/HelloWorldPanel';

export function activate(context: vscode.ExtensionContext) {

	const reviewSelectionCommand = vscode.commands.registerCommand("refix-ai-partner.reviewSelection", () => {
		const editor = vscode.window.activeTextEditor;
        let selectedText = "";
        if (editor && editor.selection && !editor.selection.isEmpty) {
            selectedText = editor.document.getText(editor.selection);
        }
        
        console.log("extension.ts: Command run. Selected text length:", selectedText.length);
        
        HelloWorldPanel.render(context.extensionUri, selectedText);
	});

	context.subscriptions.push(reviewSelectionCommand);
}

export function deactivate() {}