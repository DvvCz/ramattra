export default {
	defaultToken: "invalid",

	keywords: ["event", "function", "type", "typeof", "return", "if", "else", "let", "while", "for", "in"],
	typeKeywords: ["number", "string", "boolean", "never", "void", "any"],
	valueKeywords: ["true", "false", "null"],
	operators: ["=", ">", "<", "!", ":", "==", "<=", ">=", "!=", "&&", "||", "+", "-", "*", "/", "%", "+=", "-=", "*=", "/="],

	symbols: /[=><!:&|+\-*\/\^%]+/,
	escapes: /\\(?:[abfnrtv\\""])/, // Strings don"t actually support escapes for now but here's this.

	// The main tokenizer for our languages
	tokenizer: {
		root: [
			// identifiers and keywords
			[/[a-zA-Z_]\w*/, {
				cases: {
					"@typeKeywords": "keyword",
					"@valueKeywords": "constant",
					"@keywords": "keyword",
					"@default": "identifier"
				}
			}],

			{ include: "@whitespace" },

			// delimiters and operators
			[/[{}()\[\]]/, "@brackets"],
			[/[<>](?!@symbols)/, "@brackets"],
			[/@symbols/, {
				cases: { "@operators": "operator", "@default": "" }
			}],

			[/\d+\.\d+/, "number.float"],
			[/0[xX][0-9a-fA-F]+/, "number.hex"],
			[/0[bB][0-1]+/, "number.binary"],
			[/\d+/, "number"],

			[/[;,.]/, "delimiter"],

			[/"([^"\\]|\\.)*$/, "string.invalid"],  // non-teminated string
			[/"/, { token: "string.quote", bracket: "@open", next: "@string" }],

			[/"[^\\"]"/, "string"],
			[/(")(@escapes)(")/, ["string", "string.escape", "string"]],
			[/"/, "string.invalid"]
		],

		comment: [
			[/[^\/*]+/, "comment"],
			[/\/\*/, "comment", "@push"], // nested comment
			["\\*/", "comment", "@pop"],
			[/[\/*]/, "comment"]
		],

		string: [
			[/[^\\"]+/, "string"],
			[/@escapes/, "string.escape"],
			[/\\./, "string.escape.invalid"],
			[/"/, { token: "string.quote", bracket: "@close", next: "@pop" }]
		],

		whitespace: [
			[/[ \t\r\n]+/, "white"],
			[/\/\*/, "comment", "@comment"],
			[/\/\/.*$/, "comment"],
		],
	},
};
