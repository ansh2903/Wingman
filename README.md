# Wingman - Open source Copilot alternative for VS code (Halted development)

Wingman is an open-source, offline-first AI coding assistant for Visual Studio Code that integrates with locally running LLMs (such as via Ollama). It helps developers by providing context-aware code assistance like explanation, fixing, reviewing, documentation, and test generation — all directly from the context menu.

## Features

- Context-aware code suggestions using your entire project
- Right-click menu integration for selected code:
  - Explain code
  - Fix code
  - Review code
  - Generate documentation
  - Generate tests
- Works entirely offline with a local Ollama model
- Supports multiple file types (TS, JS, Python, C++, etc.)
- Automatically includes project-wide context

### Screenshots

Coming soon.

## Requirements

- [Ollama](https://ollama.com) installed and running locally
- A supported LLM model (e.g. `deepseek-coder:6.7b`)
- Visual Studio Code (v1.101.0 or later)
- Internet access only for initial model download (if needed)

## Installation

1. Clone or download this repository.
2. Open the folder in Visual Studio Code.
3. Run the extension using the **Run & Debug > Launch Extension** option.
4. Right-click on any code selection and choose an action from the **"Ask Wingman"** submenu.

## Usage

1. Select a block of code in your editor.
2. Right-click and choose one of the following from "Ask Wingman":
   - **Explain**
   - **Fix**
   - **Review**
   - **Generate Docs**
   - **Generate Tests**
3. Wait for the model to respond. The result is inserted inline, annotated with separators.

## Extension Settings

Currently, Wingman does not expose any user-configurable settings. Future versions may allow model selection, context depth control, and toggle options for response formatting.

## Known Issues

- Project context is limited to the first 10 matching source files.
- Long responses may cause lag in large files.
- File types outside the specified list are not yet included in context.
- Ollama must be running locally on port `11434`.

## Release Notes

### 0.3.0

- Added right-click submenu
- Separated handlers for explain, fix, review, docs, and tests
- Improved project context inclusion

### 0.2.0

- Integrated Ollama API
- Basic prompt structure added

### 0.1.0

- Initial extension structure and VS Code integration

## Contributing

PRs are welcome. Please open an issue first for major feature proposals.

## License

This project is open source and available under the [MIT License](LICENSE).

## Resources

- [Ollama Documentation](https://ollama.com/library)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [DeepSeek Coder Model](https://huggingface.co/deepseek-ai/deepseek-coder)

