import * as vscode from 'vscode';
import dotenv from 'dotenv';

dotenv.config();

const generate_host = process.env.OLLAMA_GENERATE_HOST;

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('wingman.explainCode', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			};

			const selectedText = editor.document.getText(editor.selection) || "Continue this code:\n" + editor.document.getText();
			const filePath = editor.document.uri.fsPath;

			vscode.window.showInformationMessage('Wingman is thinking...');

			const projectContext = await getProjectContext();

			const fullPrompt = `You are an AI programming assistant. Here's the context of the current project:\n${projectContext}\nUse the following code (from ${filePath}) as context:\nExplain this code:\n${selectedText}`;

			const suggestion = await queryOllama(fullPrompt);

			editor.edit(editBuilder => {
				editBuilder.insert(editor.selection.end, '\n\n----------------------------------------------------------------------------------------------------------------\n' + suggestion + '\n\n----------------------------------------------------------------------------------------------------------------');
			});
			vscode.window.showInformationMessage('Wingman has finished thinking!');
		}),

		vscode.commands.registerCommand('wingman.openSettings', async () => {
			const panel = vscode.window.createWebviewPanel(
				'wingmanSettings',
				'Wingman Settings',
				vscode.ViewColumn.One,
				{ enableScripts: true }
			);

			const currentSettings = getSavedSettings(context);
			const availableModels = await getAvailableModels();
			const modelDefaults = getModelDefaults();

			panel.webview.html = getSettingsWebviewHtml(currentSettings, availableModels);

			panel.webview.postMessage({
				type: 'init',
				models: availableModels,
				currentSettings: currentSettings,
				defaults: modelDefaults
			});

			panel.webview.onDidReceiveMessage(
				message => {
					switch (message.type) {
						case 'save':
							context.globalState.update('wingmanSettings', message.settings);
							vscode.window.showInformationMessage('Settings saved!');
							break;
						case 'reset':
							const defaults = getModelDefaults()['deepseek-coder:6.7b'];
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
		const response = await fetch(`${generate_host || 'http://localhost:11434'}/api/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: getSavedSettings(vscode.extensions.getExtension('wingman')!.exports.context).model,
				prompt,
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
	const files = await vscode.workspace.findFiles('**/*.{ts,js,py,java,cpp,json,html,css,md}', '**/node_modules/**', 10);
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

function getSettingsWebviewHtml(settings: any, availableModels: string[]): string {
	return `<!DOCTYPE html>
		<html lang="en">
		<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>
		body { font-family: sans-serif; padding: 1rem; }label { display: block; margin-top: 1rem; }input, select, textarea { width: 100%; padding: 0.4rem; margin-top: 0.2rem; }button { margin-top: 1rem; padding: 0.6rem 1rem; }
		</style>
		<title>Wingman Settings</title>
		</head>
		<body>
		<h2>Wingman Settings</h2>
		<label>Model
		<select id="model"></select>
		</label>
		<label>Context Window
		<input type="number" id="context" />
		</label>
		<label>Streaming
		<select id="streaming">
		<option value="true">Enabled</option>
		<option value="false">Disabled</option>
		</select>
		</label>
		<label>Max Tokens
		<input type="number" id="num_predict" />
		</label>
		<label>Temperature
		<input type="number" step="0.1" id="temperature" />
		</label>
		<label>Top-k
		<input type="number" id="top_k" />
		</label>
		<label>Top-p
		<input type="number" step="0.01" id="top_p" />
		</label>
		<label>Min-p
		<input type="number" step="0.01" id="min_p" />
		</label>
		<label>Repeat Penalty
		<input type="number" step="0.01" id="repeat_penalty" />
		</label>
		<label>num_gpu
		<input type="number" id="num_gpu" />
		</label>
		<label>History
		<select id="history">
		<option value="true">Enabled</option>
		<option value="false">Disabled</option>
		</select>
		</label>
		<label>Thinking
		<select id="thinking">
		<option value="true">Enabled</option>
		<option value="false">Disabled</option>
		</select>
		</label>
		<label>Prompt Template
		<textarea id="prompt_template" rows="5"></textarea>
		</label>
		<button onclick="saveSettings()">Save Settings</button>
		<button onclick="resetSettings()">Reset to Defaults</button>
		<script>
		const vscode = acquireVsCodeApi();
		let modelDefaults = {};
		window.addEventListener('message', event => {
		const message = event.data;
		if (message.type === 'init') {
		modelDefaults = message.defaults;
		const modelSelect = document.getElementById('model');
		message.models.forEach(model => {
		const option = document.createElement('option');
		option.value = model;
		option.text = model;
		modelSelect.appendChild(option);
		});
		modelSelect.value = message.currentSettings.model || message.models[0];
		loadDefaults(modelSelect.value);
		}}
		);
		document.getElementById('model').addEventListener('change', (e) => {
		loadDefaults(e.target.value);
		});
		function loadDefaults(modelName) {
		const def = modelDefaults[modelName];
		if (!def) return;
		document.getElementById('context').value = def.context;
		document.getElementById('temperature').value = def.temperature;
		document.getElementById('top_k').value = def.top_k;
		document.getElementById('top_p').value = def.top_p;
		document.getElementById('min_p').value = def.min_p;
		document.getElementById('repeat_penalty').value = def.repeat_penalty || 1.1;
		document.getElementById('num_gpu').value = def.num_gpu;
		document.getElementById('num_predict').value = def.num_predict;
		document.getElementById('history').value = def.history ? "true" : "false";
		document.getElementById('thinking').value = def.thinking ? "true" : "false";
		document.getElementById('prompt_template').value = def.prompt_template || "";
		}
		function saveSettings() {const settings = {
		model: document.getElementById('model').value,
		context: parseInt(document.getElementById('context').value),
		streaming: document.getElementById('streaming').value === 'true',
		num_predict: parseInt(document.getElementById('num_predict').value),
		temperature: parseFloat(document.getElementById('temperature').value),
		top_k: parseInt(document.getElementById('top_k').value),
		top_p: parseFloat(document.getElementById('top_p').value),
		min_p: parseFloat(document.getElementById('min_p').value),
		repeat_penalty: parseFloat(document.getElementById('repeat_penalty').value),
		num_gpu: parseInt(document.getElementById('num_gpu').value),
		history: document.getElementById('history').value === 'true',
		thinking: document.getElementById('thinking').value === 'true',
		prompt_template: document.getElementById('prompt_template').value};
		vscode.postMessage({ type: 'save', settings });
		}
		function resetSettings() {
		loadDefaults(document.getElementById('model').value);
		}
		</script>
		</body>\
		</html>
		`;
	}

function getSavedSettings(context: vscode.ExtensionContext) {
	const defaults = {
		model: 'deepseek-coder:6.7b',
		...getModelDefaults()['deepseek-coder:6.7b']
	};

	const stored = context.globalState.get<typeof defaults>('wingmanSettings');
	return stored ?? defaults;
}


function getModelDefaults() {
	return {
		'deepseek-coder:6.7b': {
			context: 2048,
			temperature: 0.7,
			top_k: 40,
			top_p: 0.9,
			repeat_penalty: 1.1,
			num_predict: 1024,
			min_p: 0.1,
			num_gpu: 1,
			history: false,
			thinking: false,
			prompt_template: ""
		},
		'qwen2.5-coder:1.5b': {
			context: 2048,
			temperature: 0.8,
			top_k: 50,
			top_p: 0.85,
			repeat_penalty: 1.0,
			num_predict: 512,
			min_p: 0.1,
			num_gpu: 1,
			history: false,
			thinking: false,
			prompt_template: ""
		}
	};
}

async function getAvailableModels(): Promise<string[]> {
	try {
		const fetch = (await import('node-fetch')).default;
		const response = await fetch('http://localhost:11434/api/tags');
		const data = await response.json() as { models: { name: string }[] };
		return data.models.map(m => m.name);
	} catch (error) {
		console.error('Failed to fetch Ollama models:', error);
		return [];
	}
}
