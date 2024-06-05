import type { Token, Span } from "./tokenizer";
import type { Type } from "./typing";

export type Node = { span: Span } /* Statements */ & (
	| { kind: "scope"; stmts: Node[] }
	| { kind: "if"; cond: Node; block: Node }
	| { kind: "while"; cond: Node; block: Node }
	| { kind: "let"; name: string; ty?: Type; val?: Node }
	| { kind: "const"; name: string; ty?: Type; val: Node }
	| { kind: "assign"; name: string; val: Node }
	| { kind: "iassign"; index: Node; name: string; val: Node }
	| { kind: "return"; val: Node }
	| { kind: "continue" }
	| { kind: "break" }

	/* Expressions */

	/* Operator: Binary */
	| { kind: "+"; lhs: Node; rhs: Node }
	| { kind: "-"; lhs: Node; rhs: Node }
	| { kind: "*"; lhs: Node; rhs: Node }
	| { kind: "/"; lhs: Node; rhs: Node }
	| { kind: "=="; lhs: Node; rhs: Node }
	| { kind: "!="; lhs: Node; rhs: Node }
	| { kind: ">="; lhs: Node; rhs: Node }
	| { kind: "<="; lhs: Node; rhs: Node }
	| { kind: "<"; lhs: Node; rhs: Node }
	| { kind: ">"; lhs: Node; rhs: Node }
	| { kind: "||"; lhs: Node; rhs: Node }
	| { kind: "&&"; lhs: Node; rhs: Node }
	| { kind: "[]"; obj: Node; index: Node }

	/* Operator: Unary */
	| { kind: "!"; obj: Node }
	| { kind: "typeof"; obj: Node }

	/* Atom */
	| { kind: "boolean"; val: boolean }
	| { kind: "string"; val: string }
	| { kind: "number"; val: number }
	| { kind: "ident"; val: string }
	| { kind: "array"; val: Node[] }

	/* Ambiguous */
	| { kind: "call"; name: string; args: Node[] }
);

const spanned = (s1: Span, s2: Span): Span => {
	return [s1[0], s2[1]];
};

export const parse = (tokens: Token[]): Node[] => {
	let index = 0;

	const maybe = <const T extends Token["kind"]>(
		variant: T,
	): Extract<Token, { kind: T }> | undefined => {
		const entry = tokens[index];
		if (entry) {
			if (entry.kind !== variant) {
				return;
			}

			index++;
			return entry as any;
		}
	};

	const expect = <const T extends Token["kind"]>(
		variant: T,
	): Extract<Token, { kind: T }> => {
		const entry = tokens[index];
		if (entry) {
			if (entry.kind !== variant) {
				throw `Expected ${variant}, got ${entry.kind}`;
			}

			index++;
			return entry as any;
		}

		throw `Expected ${variant}, got EOF`;
	};

	const maybeAtom = (): Node | undefined => {
		if (maybe("!")) {
			return expectExpr("for unary not");
		}

		if (maybe("typeof")) {
			return expectExpr("for typeof");
		}

		let d: Token | undefined;

		if ((d = maybe("number"))) {
			return { kind: "number", val: d.val, span: d.span };
		}

		if ((d = maybe("string"))) {
			return { kind: "string", val: d.val, span: d.span };
		}

		if ((d = maybe("boolean"))) {
			return { kind: "boolean", val: d.val, span: d.span };
		}

		if ((d = maybe("ident"))) {
			return { kind: "ident", val: d.val, span: d.span };
		}

		if (maybe("[")) {
			const items = [];
			do {
				if (maybe("]")) {
					break;
				}

				items.push(expectExpr("For array"));
				maybe(",");
			} while (index < tokens.length);

			return { kind: "array", val: items, span: [0, 0] };
		}
	};

	const maybeOneOf = (variants: Token["kind"][]): Token | undefined => {
		for (const variant of variants) {
			const match = maybe(variant);
			if (match) {
				return match;
			}
		}
	};

	const maybeOpInfix = (
		exp: () => Node | undefined,
		ops: Token["kind"][],
	): Node | undefined => {
		let lhs = exp();
		if (!lhs) return;

		while (index < tokens.length) {
			const op = maybeOneOf(ops);
			if (!op) break;

			const rhs = exp();

			lhs = {
				kind: op.kind as any,
				lhs,
				rhs,
				span: spanned(lhs!.span, rhs!.span),
			};
		}

		return lhs;
	};

	const maybeExpr = (): Node | undefined => {
		return maybeOpInfix(() => {
			return maybeOpInfix(() => {
				return maybeOpInfix(() => {
					return maybeOpInfix(() => {
						return maybeOpInfix(() => {
							return maybeOpInfix(maybeAtom, ["*", "/", "%"]);
						}, ["<<", ">>", ">>>", "<<<"]);
					}, ["+", "-"]);
				}, ["|", "&", "^"]);
			}, ["||", "&&"]);
		}, ["==", "!=", ">", "<", ">=", "<="]);
	};

	const expectExpr = (msg: string): Node => {
		const e = maybeExpr();
		if (!e) throw `Expected an expression ${msg}`;
		return e;
	};

	let last_idx = index;
	const stmtSpan = () => {
		return spanned(
			tokens[last_idx].span,
			tokens[(last_idx = index) - 1].span,
		);
	};

	const maybeBlock = (): Node | undefined => {
		if (maybe("{")) {
			const stmts: Node[] = [];

			do {
				if (maybe("}")) {
					break;
				}

				stmts.push(expectStmt("for block"));
			} while (index < tokens.length);

			return { kind: "scope", stmts, span: [0, 0] };
		}
	};

	const expectBlock = (msg: string): Node => {
		const e = maybeBlock();
		if (!e) throw `Expected a block ${msg}`;
		return e;
	};

	const maybeStmt = (): Node | undefined => {
		if (maybe("let")) {
			const name = expect("ident");
			expect("=");
			const val = expectExpr("to follow = for let declaration");

			return {
				kind: "let",
				name: name.val,
				ty: undefined,
				val,
				span: stmtSpan(),
			};
		}

		if (maybe("while")) {
			const cond = expectExpr("for while condition");
			const block = expectBlock("for while loop");

			return {
				kind: "while",
				cond,
				block,
				span: stmtSpan(),
			};
		}
	};

	const expectStmt = (msg: string): Node => {
		const e = maybeStmt();
		if (!e) throw `Expected a statement ${msg}`;
		return e;
	};

	const stmts = [];

	while (index < tokens.length) {
		stmts.push(expectStmt("for code"));
	}

	return stmts;
};
