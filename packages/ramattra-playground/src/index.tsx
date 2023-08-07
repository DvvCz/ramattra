import { render } from "preact";
import { useState } from "preact/hooks";

import { assemble } from "@ramattra/ramattra-core";

const urlParams = new URLSearchParams(window.location.search);
const codeParam = urlParams.get("code");
const defaultCode = codeParam ? decodeURIComponent(codeParam) : `function killThemAll() {
	let players = TEAM_ALL.allPlayers()
	players.setHealth(0)
}

event playerDied(victim, attacker, damage, crit, ability, dir) { // Input variables from events
	let players = [victim, attacker]

	players.setInvisible(INVISIBLE_TO_ALL) // Enums as constants
	players.createHUDText(
		"Header",
		"Subheader",
		"Text",

		HUD_LEFT,
		2,

		COLOR_RED,
		COLOR_WHITE,
		COLOR_BLUE,

		HUDEVAL_NONE,
		SPECTATOR_VISIBLE_DEFAULT
	)

	let numbers = <number>[1, 2, 3, 4, 5] // Can annotate array type

	for i in 0..5 { // For loop
		let num = numbers[i]
	}

	killThemAll()
}`;

const App = () => {
	const [inCode, setInCode] = useState(defaultCode);
	const [outCode, setOutCode] = useState("");

	const [popupVisible, setPopupVisible] = useState("hidden");
	const [popupMessage, setPopupMessage] = useState("");


	function compile() {
		try {
			setOutCode(assemble(inCode));
			setPopupMessage("Successfully compiled code");
		} catch (err) {
			setOutCode(`Failed: ${err}`);
			setPopupMessage("Failed to compile code");
		}

		setPopupVisible("visible");
		setTimeout(() => {
			setPopupVisible("hidden");
		}, 900);
	}

	function overrideTab(e: any) {
		if (e.key == "Tab") {
			e.preventDefault();
			const start = e.target.selectionStart;
			const end = e.target.selectionEnd;
			e.target.value = e.target.value.substring(0, start) + "\t" + e.target.value.substring(end);
			e.target.selectionStart = e.target.selectionEnd = start + 1;
		}
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

				<textarea onKeyDown={overrideTab} onChange={e => setInCode((e as any).target.value)} spellcheck={false} class="input">
					{inCode}
				</textarea>
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

render(<App/>, document.body);