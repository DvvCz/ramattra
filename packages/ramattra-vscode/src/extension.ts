import * as path from "node:path";
import type { ExtensionContext } from "vscode";

import { LanguageClient } from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	const module = context.asAbsolutePath(path.join("..", "ramattra-language-server", "dist", "node.js"));

	client = new LanguageClient(
		"ramattra-language-server",
		"Ramattra Language Server",
		{
			run: { module },
			debug: { module }
		},
		{
			documentSelector: [
				{ scheme: "file", language: "ramattra" }
			]
		}
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	return client?.stop();
}