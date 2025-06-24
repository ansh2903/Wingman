import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('wingman.suggestCode', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const selectedText = editor.document.getText(editor.selection) || "Continue this code:\n" + editor.document.getText();
		const filePath = editor.document.uri.fsPath;

		vscode.window.showInformationMessage('Wingman is thinking...');

		// Gather full project context
		const projectContext = await getProjectContext();

		const fullPrompt = `You are an AI programming assistant. Here's the context of the current project:
			${projectContext}
			Now assist with the following code (from ${filePath}):
			${selectedText}`;

		const suggestion = await queryOllama(fullPrompt);

		editor.edit(editBuilder => {
			editBuilder.insert(editor.selection.end, '\n\n' 
				+ '----------------------------------------------------------------------------------------------------------------\n'
				+suggestion + '\n\n' 
				+ '----------------------------------------------------------------------------------------------------------------');
		});

		vscode.window.showInformationMessage('Wingman has finished thinking!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

async function queryOllama(prompt: string): Promise<string> {
	try {
		const fetch = (await import('node-fetch')).default;

		const response = await fetch('http://localhost:11434/api/generate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'deepseek-coder:6.7b',
				prompt: prompt,
				stream: false
			})
		});

		const json = await response.json() as { response?: string };
		return json.response || "// No response from model.";
	} catch (error) {
		console.error('Ollama API error: ', error);
		return "// Failed to connect to Ollama";
	}
}

async function getProjectContext(): Promise<string> {
	const files = await vscode.workspace.findFiles(
		'**/*.{ts,js,py,java,cpp,json,html,css,md}',  // Include only meaningful code files
		'**/node_modules/**', // Exclude node_modules
		10 // limit to 10 files for now
	);

	const contents: string[] = [];

	for (const file of files) {
		try {
			const doc = await vscode.workspace.openTextDocument(file);
			contents.push(`// File: ${file.fsPath}\n${doc.getText()}`);
		} catch (err) {
			console.warn(`Skipping unreadable file: ${file.fsPath}`);
		}
	}

	return contents.join('\n\n');
}
