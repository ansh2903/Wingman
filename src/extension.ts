import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		// Command to explain code
		vscode.commands.registerCommand('wingman.explainCode', async () => {
			
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			};

			const selectedText = editor.document.getText(editor.selection) || "Continue this code:\n" + editor.document.getText();
			const filePath = editor.document.uri.fsPath;

			vscode.window.showInformationMessage('Wingman is thinking...');

			const projectContext = await getProjectContext();

			const fullPrompt = `You are an AI programming assistant. Here's the context of the current project:
				${projectContext}
				Use the following code (from ${filePath}) as context:
				Explain this code :\n${selectedText}`;

			const suggestion = await queryOllama(fullPrompt);

			editor.edit(editBuilder => {
				editBuilder.insert(editor.selection.end, '\n\n' 
					+ '----------------------------------------------------------------------------------------------------------------\n'
					+suggestion + '\n\n' 
					+ '----------------------------------------------------------------------------------------------------------------');
				}
			);
			vscode.window.showInformationMessage('Wingman has finished thinking!');
		}),

		// Command to fix code
		vscode.commands.registerCommand('wingman.fixCode', async () =>{
			try{
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					return;
				}

				const selectedText = editor.document.getText(editor.selection) || "Continue this code:\n" + editor.document.getText();
				const filePath = editor.document.uri.fsPath;

				vscode.window.showInformationMessage('Wingman is fixing your code...');

				const projectContext = await getProjectContext();

				const fullPrompt = 'You are an AI programming assistant. Here\'s the context of the current project:\n' +
					projectContext + 
					'\nUse the following code (from ' + filePath + ') as context:\n' +
					'Fix this code:\n' + selectedText;

				const suggestion = await queryOllama(fullPrompt);

				editor.edit(editBuilder => {
					editBuilder.insert(editor.selection.end, '\n\n' 
						+ '----------------------------------------------------------------------------------------------------------------\n'
						+ suggestion + '\n\n' 
						+ '----------------------------------------------------------------------------------------------------------------');
					}
				);
				vscode.window.showInformationMessage('Wingman has finished fixing your code!');
			}
			catch (error) {
				console.error('Error while fixing code: ' + error);
			}
		}),

		// Command to Review code
		vscode.commands.registerCommand('wingman.reviewCode', async () =>{
			try{
				const editor = vscode.window.activeTextEditor;
				if (!editor){
					return;
				}

				const selectedText = editor.document.getText(editor.selection) || "Continue this code:\n" + editor.document.getText();
				const filePath = editor.document.uri.fsPath;

				vscode.window.showInformationMessage('Wingman is reviewing your code...');

				const projectContext = await getProjectContext();

				const fullPrompt = 'You are an AI programming assistant. Here\'s the context of the current project:\n' +
					projectContext + 
					'\nUse the following code (from ' + filePath + ') as context:\n' +
					'Review this code:\n' + selectedText;

				const suggestion = await queryOllama(fullPrompt);

				editor.edit(editBuilder => {
					editBuilder.insert(editor.selection.end, '\n\n' 
						+ '----------------------------------------------------------------------------------------------------------------\n'
						+ suggestion + '\n\n' 
						+ '----------------------------------------------------------------------------------------------------------------');
					}
				);
				vscode.window.showInformationMessage('Wingman has finished reviewing your code!');
			}
			catch (error) {
				console.error('Error while reviewing code: ' + error);
			}
		}),

		// Command to generate Documentation
		vscode.commands.registerCommand('wingman.generateDocs', async () => {
			try{
				const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			const selectedText = editor.document.getText(editor.selection) || "Continue this code:\n" + editor.document.getText();
			const filePath = editor.document.uri.fsPath;

			vscode.window.showInformationMessage('Wingman is generating documentation...');
			const projectContext = await getProjectContext();

			const fullPrompt = 'You are an AI programming assistant. Here\'s the context of the current project:\n' +
				projectContext + 
				'\nUse the following code (from ' + filePath + ') as context:\n' +
				'Generate documentation for this code:\n' + selectedText;

			const suggestion = await queryOllama(fullPrompt);

			editor.edit(editBuilder => {
				editBuilder.insert(editor.selection.end, '\n\n' 
					+ '----------------------------------------------------------------------------------------------------------------\n'
					+ suggestion + '\n\n' 
					+ '----------------------------------------------------------------------------------------------------------------');
				}
			);
			vscode.window.showInformationMessage('Wingman has finished generating documentation!');

			}catch (error) {
				console.error('Error while generating documentation: ' + error);	
			}

			}
		),

		// Command to generate Tests
		vscode.commands.registerCommand('wingman.generateTests', async () => {
			try {
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					return;
				}

				const selectedText = editor.document.getText(editor.selection) || "Continue this code:\n" + editor.document.getText();
				const filePath = editor.document.uri.fsPath;

				vscode.window.showInformationMessage('Wingman is generating tests...');

				const projectContext = await getProjectContext();

				const fullPrompt = 'You are an AI programming assistant. Here\'s the context of the current project:\n' +
					projectContext + 
					'\nUse the following code (from ' + filePath + ') as context:\n' +
					'Generate tests for this code:\n' + selectedText;

				const suggestion = await queryOllama(fullPrompt);

				editor.edit(editBuilder => {
					editBuilder.insert(editor.selection.end, '\n\n' 
						+ '----------------------------------------------------------------------------------------------------------------\n'
						+ suggestion + '\n\n' 
						+ '----------------------------------------------------------------------------------------------------------------');
					}
				);
				vscode.window.showInformationMessage('Wingman has finished generating tests!');
			}catch (error) {
				console.error('Error while generating tests: ' + error);
			}
		})
	);
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
		'**/*.{ts,js,py,java,cpp,json,html,css,md}',
		'**/node_modules/**',
		10 
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
