import { render } from "preact";
import { useState } from "preact/hooks";

import { Error, assemble } from "@ramattra/ramattra-core";

import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

import { languageServerWithTransport } from "codemirror-languageserver";
import { PostMessageWorkerTransport } from "./transport";

/** @ts-ignore */
import RamattraWorker from "@ramattra/ramattra-language-server/src/browser?worker";

const worker = new RamattraWorker();

const ls = languageServerWithTransport({
	transport: new PostMessageWorkerTransport(worker),
	rootUri: "file:///",
	workspaceFolders: null,
	documentUri: "file:///tsconfig.json",
	languageId: "json"
});

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

const styling = EditorView.baseTheme({
	"&": {
		fontSize: "19px",
	}
});

const App = () => {
	const [inCode, setInCode] = useState(defaultCode);
	const [outCode, setOutCode] = useState("");

	const [popupVisible, setPopupVisible] = useState("hidden");
	const [popupMessage, setPopupMessage] = useState("");


	function compile() {
		assemble(inCode);

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
				<button>
					<a href="https://github.com/DvvCz/Ramattra">
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

				<CodeMirror
					value={inCode}
					height="85.7dvh"
					indent
					theme={vscodeDark}
					onChange={setInCode}
					extensions={[...ls, styling, javascript({ jsx: true })]}
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