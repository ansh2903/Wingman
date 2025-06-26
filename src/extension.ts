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
		}),

		// Settings menu
		vscode.commands.registerCommand('wingman.openSettings', async () => {
			const panel = vscode.window.createWebviewPanel(
				'wingmanSettings',
				'Wingman Settings',
				vscode.ViewColumn.One,
				{
					enableScripts: true
				}
			);

			const currentSettings: {
				model: string;
				context: number;
				streaming: boolean;
				memory: number;
			} = context.globalState.get('wingmanSettings') as any || {
				model: 'qwen2.5-coder:1.5b',
				context: 2048,
				streaming: false,
				memory: 1024
			};

			panel.webview.html = getSettingsWebviewHtml(currentSettings);  // a function to return HTML

			// 🔽 Place your message handler code here
			panel.webview.onDidReceiveMessage(
				message => {
				switch (message.type) {
					case 'save':
						context.globalState.update('wingmanSettings', message.settings);
						vscode.window.showInformationMessage('Settings saved!');
						break;
					case 'reset':
						const defaults = {
							model: 'deepseek-coder:6.7b',
							context: 2048,
							streaming: false,
							memory: 1024
						};
						context.globalState.update('wingmanSettings', defaults);
						vscode.window.showInformationMessage('Settings reset to default.');
						break;
					}
				},
				undefined,
				context.subscriptions
			);
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
				model: 'qwen2.5-coder:1.5b',
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

function getSettingsWebviewHtml(settings: {
			model: string;
			context: number;
			streaming: boolean;
			memory: number;
		}
	): string {
		return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>
			body { font-family: sans-serif; padding: 1rem; }
			label { display: block; margin-top: 1rem; }
			input, select { width: 100%; padding: 0.4rem; margin-top: 0.2rem; }
			button { margin-top: 1rem; padding: 0.6rem 1rem; }
		</style>
		<title>Wingman Settings</title>
		</head>
		<body>
		<h2>Wingman Settings</h2>

		<label>Model
			<input type="text" id="model" value="deepseek-coder:6.7b" />
		</label>

		<label>Context Window
			<input type="number" id="context" value="2048" />
		</label>

		<label>Streaming
			<select id="streaming">
			<option value="true">Enabled</option>
			<option value="false" selected>Disabled</option>
			</select>
		</label>

		<label>Memory (MB)
			<input type="number" id="memory" value="1024" />
		</label>

		<button onclick="saveSettings()">Save Settings</button>
		<button onclick="resetSettings()">Reset to Defaults</button>

		<script>
			const vscode = acquireVsCodeApi();

			function saveSettings() {
			const settings = {
				model: document.getElementById('model').value,
				context: document.getElementById('context').value,
				streaming: document.getElementById('streaming').value === 'true',
				memory: document.getElementById('memory').value
			};
			vscode.postMessage({ type: 'save', settings });
			}

			function resetSettings() {
			vscode.postMessage({ type: 'reset' });
			}
		</script>
		</body>
		</html>
	`;
}