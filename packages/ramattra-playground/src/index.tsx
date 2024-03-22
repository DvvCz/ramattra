import { render } from "preact";
import { useEffect, useState } from "preact/hooks";

import { type Error, assemble } from "@ramattra/ramattra-core";

const urlParams = new URLSearchParams(window.location.search);
const codeParam = urlParams.get("code");
const defaultCode = codeParam ? decodeURIComponent(codeParam) : `function join(strings: string[]) -> string {
	let buf = "";

	for i in 0 .. strings.count() {
		buf += strings[i]
	}

	return buf;
}

event playerDied(victim, attacker, damage, crit, ability, dir) {
	victim.createHUDText( ["Hello", "Ramattra", "!"].join() );
}`;

import { Editor, useMonaco } from "@monaco-editor/react";
import monarch from "./monarch";

const App = () => {
	const [inCode, setInCode] = useState(defaultCode);
	const [outCode, setOutCode] = useState("");

	const [popupVisible, setPopupVisible] = useState("hidden");
	const [popupMessage, setPopupMessage] = useState("");

	const monaco = useMonaco();

	useEffect(() => {
		monaco?.languages.register({ id: "ramattra" });
		monaco?.languages.setMonarchTokensProvider("ramattra", monarch as any);
	}, [monaco]);

	function compile() {
		try {
			setOutCode(assemble(inCode));
			setPopupMessage("Successfully compiled code");
		} catch (err) {
			const error = err as Error;
			setOutCode(`Failed: ${error.message}`);
			setPopupMessage("Failed to compile code");
		}

		setPopupVisible("visible");
		setTimeout(() => {
			setPopupVisible("hidden");
		}, 900);
	}

	function share() {
		const baseUrl = window.location.href.split('?')[0];
		const encoded = encodeURIComponent(inCode);
		navigator.clipboard.writeText(`${baseUrl}?code=${encoded}`);

		setPopupMessage("URL copied to clipboard");
		setPopupVisible("visible");
		setTimeout(() => {
			setPopupVisible("hidden");
		}, 900);
	}

	return <>
		<div class="top">
			<div class="logo">
				<button type="button" aria-label="GitHub Logo">
					<a aria-label="GitHub Repository" href="https://github.com/DvvCz/Ramattra">
						<i class="fa-brands fa-github" />
					</a>
				</button>

				<div class="text">
					Ramattra Playground
				</div>
			</div>

			<div class="nav">
				<button type="button">
					<a href="https://github.com/DvvCz/Ramattra/wiki">
						<i class="fas fa-book" />
						Documentation
					</a>
				</button>
			</div>
		</div>

		<div class="main">
			<div class="editor">
				<div class="toolbar">
					<button type="button" onClick={compile}>Compile</button>
					<button type="button" onClick={share}>Share</button>
				</div>

				<Editor
					value={inCode}
					options={{ fontSize: 20, insertSpaces: false, detectIndentation: false, tabSize: 4, renderWhitespace: "all", lineNumbersMinChars: 4 }}
					height="94%"
					indentWithTab={true}
					theme={"vs-dark"}
					language={"ramattra"}
					onChange={setInCode}
				/>
			</div>

			<div class="panel">
				<div class="top">
					<div>Workshop Output</div>
				</div>

				<textarea class="output" placeholder="Compile some code!" wrap="soft" readonly>
					{outCode}
				</textarea>

				<button type="button" onClick={_ => navigator.clipboard.writeText(outCode)}>
					Copy to Clipboard
				</button>
			</div>
		</div>

		<div class="popup" style={`visibility: ${popupVisible}`}>
			{popupMessage}
		</div>
	</>;
};

render(<App />, document.body);