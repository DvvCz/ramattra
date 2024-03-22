import { FUNCTIONS, analyze, type Error, CONSTANTS, EVENTS, reprType } from "@ramattra/ramattra-core";
import { dedent } from "@ramattra/ramattra-util";
import { CompletionItemKind, type Connection, type Diagnostic, DiagnosticSeverity, TextDocuments, TextDocumentSyncKind } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

export const onInit = (connection: Connection) => {
	connection.onInitialize(_params => {
		connection.console.log("[Server] Started and initialize received");

		return {
			capabilities: {
				textDocumentSync: {
					openClose: true,
					change: TextDocumentSyncKind.Incremental
				},
				completionProvider: {
					resolveProvider: true
				},
				hoverProvider: true
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

	connection.onHover(p => {
		const doc = documents.get(p.textDocument.uri);

		if (!doc)
			return;

		const text = doc.getText();
		const offset = doc.offsetAt(p.position);

		if (text.charAt(offset).match(/[^\w]/))
			return null;

		let start = 0;
		for (let i = offset; i > 0; i--) {
			const char = text.charAt(i);
			if (char.match(/[^\w]/)) {
				start = i + 1;
				break;
			}
		}

		let end = text.length;
		for (let i = offset; i < end; i++) {
			const char = text.charAt(i);
			if (char.match(/[^\w]/)) {
				end = i;
				break;
			}
		}

		const word = text.slice(start, end);

		if (FUNCTIONS[word]) {
			const fn = FUNCTIONS[word];

			return {
				contents: {
					kind: "markdown",
					value: dedent`
						${word}(${fn?.args.map(x => x.default ? `${reprType(x.type)} = ${x.default}` : reprType(x.type)).join(", ")})

						**Overwatch Function**: \`${fn.ow}\`
						[workshop.codes](${WORKSHOP_CODES_HREF}${fn.ow.replaceAll(" ", "+").toLowerCase()})
					`
				},
			}
		}

		if (CONSTANTS[word]) {
			const constant = CONSTANTS[word];
			return {
				contents: {
					kind: "markdown",
					value: dedent`
						${word}: ${reprType(constant.type)}

						**Overwatch Value**: \`${constant.ow}\`
					`
				},
			}
		}
		
		if (EVENTS[word]) {
			const event = EVENTS[word];
			return {
				contents: {
					kind: "markdown",
					value: dedent`
						event ${word}(${event.args.map(a => reprType(a.type)).join(", ")})

						**Overwatch Event**: \`${event.ow}\`
						[workshop.codes](${WORKSHOP_CODES_HREF}${event.ow.replaceAll(" ", "+").toLowerCase()})

						### Arguments
						%S
					`.replace("%S", event.args.map(a => `* **${a.ow}**: \`${reprType(a.type)}\``).join("\n"))
				},
			}
		}
	});

	connection.onCompletion(_p => {
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
		if (data[0] === CompletionItemKind.Function) {
			const fn = FUNCTIONS[data[1]];
			item.detail = `${data[1]}(${fn?.args.map(x => x.default ? `${reprType(x.type)} = ${x.default}` : reprType(x.type)).join(", ")})`
			item.documentation = {
				kind: "markdown",
				value: dedent`
					**Overwatch Function**: \`${fn.ow}\`
					[workshop.codes](${WORKSHOP_CODES_HREF}${fn.ow.replaceAll(" ", "+").toLowerCase()})
				`
			}
		} else if (data[0] === CompletionItemKind.Constant) {
			const constant = CONSTANTS[data[1]];
			item.detail = `${data[1]}: ${reprType(constant.type)}`;
			item.documentation = {
				kind: "markdown",
				value: dedent`
					**Overwatch Value**: \`${constant.ow}\`
				`
			}
		} else if (data[0] === CompletionItemKind.Event) {
			const event = EVENTS[data[1]];
			item.detail = `event ${data[1]}(${event.args.map(a => reprType(a.type)).join(", ")})`
			item.documentation = {
				kind: "markdown",
				value: dedent`
					**Overwatch Event**: \`${event.ow}\`
					[workshop.codes](${WORKSHOP_CODES_HREF}${event.ow.replaceAll(" ", "+").toLowerCase()})

					### Arguments
					%S
				`.replace("%S", event.args.map(a => `* **${a.ow}**: \`${reprType(a.type)}\``).join("\n"))
			}
		}

		return item;
	});

	connection.listen();
};