const IDENT_REGEX = /([_a-zA-Z][_a-zA-Z0-9]*)/y;
const BINARY_REGEX = /0b([01_]+)/y;
const HEX_REGEX = /0x([0-9A-Fa-f_]+)/y;
const INTEGER_REGEX = /([0-9_]+)/y;
const DECIMAL_REGEX = /([0-9_]+\.[0-9_]+)/y;
const STRING_REGEX = /"([^"]*)"/y;

const WHITESPACE_REGEX = /\s+/y;
const COMMENT_REGEX = /\/\/([^\n]+)/y;
const MCOMMENT_REGEX = /\/\*(.*?)\*\//y;

export const SPECIAL = [
	/* Keywords */
	"let",
	"while",
	"if",
	"for",
	"const",
	"return",
	"break",
	"continue",

	/* Operators */
	"=",
	"+=",
	"-=",
	"*=",
	"/=",
	"%=",

	"==",
	"!=",
	">=",
	"<=",
	">",
	"<",

	"||",
	"&&",

	"&",
	"|",
	"^",
	">>",
	"<<",
	">>>",
	"<<<",

	"+",
	"-",
	"*",
	"/",
	"%",

	"{",
	"}",
	"(",
	")",
	"[",
	"]",
	",",
	":",
	".",

	"!",
	"typeof",
] as const;

export type Span = [number, number];

export type Token = { span: Span } & (
	| { kind: "ident"; val: string }
	| { kind: "number"; val: number }
	| { kind: "string"; val: string }
	| { kind: "boolean"; val: boolean }
	| { kind: (typeof SPECIAL)[keyof typeof SPECIAL] }
);

export const tokenize = (code: string): Token[] => {
	let ptr = 0;

	const consume = (regex: RegExp) => {
		regex.lastIndex = ptr;

		const out = regex.exec(code);
		if (out) {
			ptr = regex.lastIndex;
			return out[1];
		}
	};

	const tokens: Token[] = [];
	while (ptr < code.length) {
		let d: string | undefined;

		if (
			consume(WHITESPACE_REGEX) ||
			consume(COMMENT_REGEX) ||
			consume(MCOMMENT_REGEX)
		) {
			continue;
		}

		/* Save ptr since `consume` will change it. */
		const start = ptr;

		if ((d = consume(IDENT_REGEX))) {
			if (SPECIAL.includes(d as any)) {
				tokens.push({
					span: [start, ptr],
					kind: d as any,
				});
			} else {
				tokens.push({ span: [start, ptr], kind: "ident", val: d });
			}

			continue;
		}

		if ((d = consume(STRING_REGEX))) {
			tokens.push({ span: [start, ptr], kind: "string", val: d });
			continue;
		}

		if ((d = consume(HEX_REGEX))) {
			tokens.push({
				span: [start, ptr],
				kind: "number",
				val: Number.parseInt(d, 16),
			});

			continue;
		}

		if ((d = consume(BINARY_REGEX))) {
			tokens.push({
				span: [start, ptr],
				kind: "number",
				val: Number.parseInt(d, 2),
			});

			continue;
		}

		if ((d = consume(DECIMAL_REGEX))) {
			tokens.push({
				span: [start, ptr],
				kind: "number",
				val: Number.parseFloat(d),
			});

			continue;
		}

		if ((d = consume(INTEGER_REGEX))) {
			tokens.push({
				span: [start, ptr],
				kind: "number",
				val: Number.parseInt(d, 10),
			});
			continue;
		}

		const op3 = code.slice(ptr, ptr + 2);
		if (SPECIAL.includes(op3 as any)) {
			tokens.push({ span: [start, (ptr += 3)], kind: op3 as any });
			continue;
		}

		const op2 = code.slice(ptr, ptr + 1);
		if (SPECIAL.includes(op2 as any)) {
			tokens.push({ span: [start, (ptr += 2)], kind: op2 as any });
			continue;
		}

		const op1 = code[ptr];
		if (SPECIAL.includes(op1 as any)) {
			tokens.push({ span: [start, ptr++], kind: op1 as any });
			continue;
		}

		throw `Failed to tokenize: What is '${code[ptr]}'?`;
	}

	return tokens;
};
