import {
	createConnection, TextDocuments, TextDocumentSyncKind, Diagnostic, DiagnosticSeverity, CompletionItem, CompletionItemKind
} from "vscode-languageserver/node";

import {
	TextDocument
} from "vscode-languageserver-textdocument";

import { analyze } from "@ramattra/ramattra-core";

// Creates the LSP connection
const connection = createConnection();
const documents = new TextDocuments(TextDocument);

documents.onDidOpen((event) => {
	connection.console.log(`[Server] Document opened: ${event.document.uri}`);
});

connection.onCompletion((_pos): CompletionItem[] => {
	return [
		{
			label: "TestingCompletion",
			kind: CompletionItemKind.Text,
			data: 1
		}
	];
});

connection.onCompletionResolve(
	(item): CompletionItem => {
		if (item.data == 1) {
			item.detail = "TypeScript details";
			item.documentation = "TypeScript documentation";
		}

		return item;
	}
);

async function validateDocument(document: TextDocument) {
	const text = document.getText();

	const diagnostics: Diagnostic[] = [];

	try {
		analyze(text);
	} catch (err) {
		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			range: {
				start: document.positionAt(0),
				end: document.positionAt(0)
			},
			message: `${err}`,
			source: "Ramattra Language Server"
		});
	}

	await connection.sendDiagnostics({ uri: document.uri, diagnostics })
}

documents.onDidChangeContent(async e => {
	await validateDocument(e.document);
});

documents.listen(connection);

connection.onInitialize((_params) => {
	connection.console.log(`[Server] Started and initialize received`);

	return {
		capabilities: {
			textDocumentSync: {
				openClose: true,
				change: TextDocumentSyncKind.Incremental
			},
			completionProvider: {
				resolveProvider: true
			}
		}
	};
});
connection.listen();
