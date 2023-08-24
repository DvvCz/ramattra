import { analyze, type Error } from "@ramattra/ramattra-core";
import { CompletionItemKind, Connection, Diagnostic, DiagnosticSeverity, TextDocuments, TextDocumentSyncKind } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

export const onInit = (connection: Connection) => {
	connection.onInitialize(_params => {
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


	const documents = new TextDocuments(TextDocument);

	documents.onDidChangeContent(e => {
		const text = e.document.getText();

		const diagnostics: Diagnostic[] = [];

		try {
			analyze(text);
		} catch (err) {
			const error = err as Error;

			diagnostics.push({
				severity: DiagnosticSeverity.Error,
				range: {
					start: e.document.positionAt(0), //{ character: error.location.start.column, line: error.location.start.line },
					end: e.document.positionAt(5), // { character: error.location.end.column, line: error.location.end.line },
				},
				message: error.message,
				source: "Ramattra Language Server"
			});
		}

		connection.sendDiagnostics({ uri: e.document.uri, diagnostics })
	});

	documents.listen(connection);

	connection.onCompletion(_p => {
		return [
			{
				label: "TestingCompletion",
				kind: CompletionItemKind.Text,
				data: 1
			}
		];
	});

	connection.onCompletionResolve(item => {
		if (item.data == 1) {
			item.detail = "TypeScript details";
			item.documentation = "TypeScript documentation";
		}

		return item;
	});

	connection.listen();
};