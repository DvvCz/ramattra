import { FUNCTIONS, analyze, type Error, CONSTANTS, EVENTS } from "@ramattra/ramattra-core";
import { dedent } from "@ramattra/ramattra-util";
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
					start: { character: error.location.start.column, line: error.location.start.line },
					end: { character: error.location.end.column, line: error.location.end.line },
				},
				message: error.message,
				source: "Ramattra Language Server"
			});
		}

		connection.sendDiagnostics({ uri: e.document.uri, diagnostics })
	});

	documents.listen(connection);

	connection.onCompletion(p => {
		const doc = documents.get(p.textDocument.uri);

		if (!doc)
			return [];

		const funcs = Object.keys(FUNCTIONS).map(name => {
			return {
				label: name,
				kind: CompletionItemKind.Function,
				data: [CompletionItemKind.Function, name]
			}
		});

		const constants = Object.keys(CONSTANTS).map(name => {
			return {
				label: name,
				kind: CompletionItemKind.Constant,
				data: [CompletionItemKind.Constant, name]
			}
		});

		const events = Object.keys(EVENTS).map(name => {
			return {
				label: name,
				kind: CompletionItemKind.Event,
				data: [CompletionItemKind.Event, name]
			}
		});

		return [...funcs, ...constants, ...events];
	});

	const WORKSHOP_CODES_HREF = "https://workshop.codes/wiki/articles/";

	connection.onCompletionResolve(item => {
		const data = item.data as [CompletionItemKind, string];
		if (data[0] == CompletionItemKind.Function) {
			const fn = FUNCTIONS[data[1]]!;
			item.detail = `${data[1]}(${fn?.args.map(x => x.default ? `${x.type} = ${x.default}` : x.type).join(", ")})`
			item.documentation = {
				kind: "markdown",
				value: dedent`
					**Overwatch Function**: \`${fn.ow}\`
					[workshop.codes](${WORKSHOP_CODES_HREF}${fn.ow.replaceAll(" ", "+").toLowerCase()})
				`
			}
		} else if (data[0] == CompletionItemKind.Constant) {
			const constant = CONSTANTS[data[1]]!;
			item.detail = `${data[1]}: ${constant.type}`;
			item.documentation = {
				kind: "markdown",
				value: dedent`
					**Overwatch Value**: \`${constant.ow}\`
				`
			}
		} else if (data[0] == CompletionItemKind.Event) {
			const event = EVENTS[data[1]]!;
			item.detail = `event ${data[1]}(${event.args.map(a => a.type).join(", ")})`
			item.documentation = {
				kind: "markdown",
				value: dedent`
					**Overwatch Event**: \`${event.ow}\`
					[workshop.codes](${WORKSHOP_CODES_HREF}${event.ow.replaceAll(" ", "+").toLowerCase()})

					### Arguments
					%S
				`.replace("%S", event.args.map(a => `* **${a.ow}**: \`${a.type}\``).join("\n"))
			}
		}

		return item;
	});

	connection.listen();
};