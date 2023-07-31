import { html, render, useState } from "https://unpkg.com/htm/preact/standalone.module.js";

const urlParams = new URLSearchParams(window.location.search);
const defaultCode = urlParams.has("code") ? decodeURIComponent(urlParams.get("code")) : `function killThemAll() {
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

	const lua = fengari.lua;
	const lauxlib  = fengari.lauxlib;
	const lualib   = fengari.lualib;

	const L = lauxlib.luaL_newstate();
	lualib.luaL_openlibs(L);

	if (lauxlib.luaL_dofile(L, fengari.to_luastring("ramattra.lua")) != 0) {
		const msg = fengari.to_jsstring( lua.lua_tostring(L, -1) );
		lua.lua_pop(L, 1);

		console.error(`Failed to load main ramattra lua file: ${ msg }`);
	}

	function compile() {

		lua.lua_pushstring(L, fengari.to_luastring(inCode));
		if (lua.lua_pcall(L, 1, -1, 0) == 0) {
			setOutCode(fengari.to_jsstring(lua.lua_tostring(L, -1)));
			lua.lua_pop(L, 1);

			setPopupMessage("Successfully compiled code");
			setPopupVisible("visible");
		} else {
			const msg = lua.lua_tostring(L, -1);
			lua.lua_pop(L, 1);

			setOutCode(`Failed: ${ fengari.to_jsstring(msg) }`);

			setPopupMessage("Failed to compile code");
			setPopupVisible("visible");
		}

		setTimeout(() => {
			setPopupVisible("hidden");
		}, 900);
	}

	function overrideTab(e) {
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

	return html`
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
					<button onclick=${compile}>Compile</button>
					<button onclick=${share}>Share</button>
				</div>

				<textarea onkeydown=${overrideTab} onchange=${e => setInCode(e.target.value)} spellcheck=false class="input">
					${defaultCode}
				</textarea>
			</div>

			<div class="panel">
				<div class="top">
					<div>Workshop Output</div>
				</div>

				<textarea class="output" placeholder="Compile some code!" wrap="soft" readonly>
					${outCode}
				</textarea>

				<button onclick=${e => navigator.clipboard.writeText(outCode)}>
					Copy to Clipboard
				</button>
			</div>
		</div>

		<div class="popup">
			${popupMessage}
		</div>

		<style>
			@import url("https://fonts.googleapis.com/css2?family=Inter:wght@700;800&display=swap");

			/* First reset default body CSS */
			body {
				margin: 0;
				background-color: #313131;

				width: 100dvw;
				height: 100dvh;

				font-family: 'Inter', sans-serif;

				--color-ram: #713dc5;
				--color-toolbar: #313131;
				--color-output: #111111;
				--color-input: #1e1e1e;
			}

			.top {
				display: flex;
				flex-direction: row;
				align-items: center;

				background-color: var(--color-ram);
				height: 7%;

				.logo {
					color: white;
					display: flex;
					flex-direction: row;
					width: 25%;
					min-width: 400px;

					& button {
						color: white;
						font-size: 30px;
						background-color: transparent;
						border: none;
						cursor: pointer;

						margin-right: 2%;
						width: 15%;

						& a {
							color: white;
							text-decoration: none;

							&:hover {
								filter: opacity(70%);
							}
						}
					}

					.text {
						margin-top: 5px;
						margin-left: 1%;
						margin-right: 3%;
						font-size: 24px;
						width: 75%;
					}
				}

				.nav {
					margin-top: 5px;

					& button {
						color: white;
						min-width: 6%;

						border: none;
						font-size: 20px;
						font-weight: bold;
						background-color: transparent;

						cursor: pointer;

						& a {
							display: flex;
							flex-direction: row;

							color: white;
							text-decoration: none;

							& i {
								margin-right: 10%;
							}

							&:hover {
								filter: opacity(70%);
							}
						}
					}
				}
			}

			.main {
				height: 93%;

				display: flex;
				flex-direction: row;

				.editor {
					width: 70%;

					display: flex;
					flex-direction: column;
					border-right: 1px solid white;

					.toolbar {
						display: flex;
						flex-direction: row;

						margin-bottom: 1%;

						background-color: var(--color-toolbar);
						border-bottom: 1px solid white;

						height: 6%;

						& button {
							background-color: transparent;

							border: none;
							color: white;

							padding-left: 2%;
							padding-top: 1%;
							padding-bottom: 1%;
							padding-right: 2%;

							cursor: pointer;

							&:first-child {
								margin-left: 1%;
							}

							&:hover {
								backdrop-filter: brightness(120%);
								border-bottom: 2px solid white;
							}
						}
					}

					.input {
						height: 94%;
						outline: none;
						background-color: var(--color-input);
						color: white;
						border: none;
						resize: none;
					}
				}

				.panel {
					display: flex;
					flex-direction: column;
					align-items: center;

					width: 30%;

					.top {
						height: 6%;
						background-color: var(--color-toolbar);
						margin-top: 2%;
						margin-bottom: 6%;
						color: white;
					}

					.output {
						width: 90%;
						min-height: 60%;

						outline: none;

						background-color: var(--color-output);
						color: white;
						font-size: smaller;
						overflow-x: scroll;
						overflow-y: clip;

						margin-left: 3%;
						margin-right: 3%;

						margin-bottom: 5%;

						resize: none;
					}

					& button {
						border: none;
						border-radius: 3px;
						background-color: var(--color-ram);
						color: white;

						padding: 10px 10px 10px 10px;

						cursor: pointer;

						&:active {
							filter: brightness(85%);
						}
					}
				}
			}

			.popup {
				visibility: ${ popupVisible };

				position: absolute;
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 30px;

				left: 0;
				right: 0;
				top: 0;
				bottom: 0;

				background-color: rgba(0, 0, 0, 0.6);
				color: white;
				font-size: 30px;

				margin-left: auto;
				margin-right: auto;
				margin-top: auto;
				margin-bottom: auto;

				width: 30%;
				overflow: auto;
				height: 10%;
			}
		</style>
	`;
};

render(html`<${App} />`, document.body);