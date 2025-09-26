// src/extension.ts

import * as vscode from 'vscode';
import { HelloWorldPanel } from './panels/HelloWorldPanel';

export function activate(context: vscode.ExtensionContext) {
	const reviewSelectionCommand = vscode.commands.registerCommand("refix-ai-partner.reviewSelection", () => {
		HelloWorldPanel.render(context.extensionUri);
	});

	context.subscriptions.push(reviewSelectionCommand);
}

export function deactivate() {}