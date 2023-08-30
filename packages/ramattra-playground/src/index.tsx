import { render } from "preact";
import { useEffect, useState } from "preact/hooks";

import { Error, assemble } from "@ramattra/ramattra-core";

const urlParams = new URLSearchParams(window.location.search);
const codeParam = urlParams.get("code");
const defaultCode = codeParam ? decodeURIComponent(codeParam) : `event playerDied(victim, attacker, damage, crit, ability, dir) {
	let players = [victim, attacker]

	players.setInvisible()
	players.createHUDText("Header")

	let numbers = [1, 2, 3, 4, 5]

	for i in 0..5 {
		let num = numbers[i]
	}
}`;

import { Editor, useMonaco } from "@monaco-editor/react";
import monarch from "./lib/monarch";

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
				<button aria-label="GitHub Logo">
					<a aria-label="GitHub Repository" href="https://github.com/DvvCz/Ramattra">
						<i class="fa-brands fa-github"></i>
					</a>
				</button>

				<div class="text">
					Ramattra Playground
				</div>
			</div>

			<div class="nav">
				<button>
					<a href="https://github.com/DvvCz/Ramattra/wiki">
						<i class="fas fa-book"></i>
						Documentation
					</a>
				</button>
			</div>
		</div>

		<div class="main">
			<div class="editor">
				<div class="toolbar">
					<button onClick={compile}>Compile</button>
					<button onClick={share}>Share</button>
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

				<button onClick={_ => navigator.clipboard.writeText(outCode)}>
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