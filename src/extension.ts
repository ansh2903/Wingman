import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext){
	const disposable = vscode.commands.registerCommand('wingman.suggestCode', async()=>{
		const editor = vscode.window.activeTextEditor;
		if(!editor) return;

		const selectedText = editor.document.getText(editor.selection) || "Continue this code \n" + editor.document.getText();

		vscode.window.showInformationMessage('Wingman is thinking...');

		const suggestion = await queryOllama(selectedText);

		editor.edit(editBuilder =>{
			editBuilder.insert(editor.selection.end, '\n' + suggestion);
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