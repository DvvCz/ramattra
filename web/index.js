import { html, render, useState } from "https://unpkg.com/htm/preact/standalone.module.js";

const urlParams = new URLSearchParams(window.location.search);
const defaultCode = urlParams.get("code") ?? "let x = 5;";

const App = () => {
	const [inCode, setInCode] = useState(defaultCode);
	const [outCode, setOutCode] = useState("");

	function compile() {
		console.log("compile", inCode);
		setOutCode("Compiled!");
	}

	function overrideTab(e) {
		if (e.key == "Tab") {
			e.preventDefault();
			const start = e.target.selectionStart;
			const end = e.target.selectionEnd;
			e.target.value = e.target.value.substring(0, start) + "\t" + e.target.value.substring(end	);
			e.target.selectionStart = e.target.selectionEnd = start + 1;
		}
	}

	return html `
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
					<button onclick=${e => navigator.clipboard.writeText(window.location.href)}>Share</button>
				</div>

				<textarea onkeydown=${overrideTab} onchange=${e => setInCode(e.target.value)} class="input">
					${defaultCode}
				</textarea>
			</div>

			<div class="panel">
				<div class="top">
					<div>Workshop Output</div>
				</div>

				<textarea class="output" placeholder="Compile some code!" readonly>
					${outCode}
				</textarea>

				<button onclick=${ e => navigator.clipboard.writeText(outCode) }>
					Copy to Clipboard
				</button>
			</div>
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
						margin-bottom: 8%;
						color: white;
					}

					.output {
						width: 80%;
						min-height: 30%;

						outline: none;

						background-color: var(--color-output);
						color: white;
						font-size: smaller;
						overflow-x: scroll;

						margin-left: 5%;
						margin-right: 5%;

						margin-bottom: 5%;

						scrollbar-color: black, black;
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
		</style>
	`;
};

render(html `<${App} />`, document.body);