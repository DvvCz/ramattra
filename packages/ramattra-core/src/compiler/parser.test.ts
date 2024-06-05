import { test, expect } from "bun:test";

import { tokenize } from "./tokenizer";
import { parse } from "./parser";

const single = (code: string) => parse(tokenize(code));

test("basic", () => {
	expect(single("let x = 5")).toEqual([
		{
			kind: "let",
			name: "x",
			ty: undefined,
			val: { kind: "number", val: 5, span: [8, 9] },
			span: [0, 9],
		},
	]);

	expect(single("let y = 5 + 2 * 3")).toEqual([
		{
			kind: "let",
			name: "y",
			ty: undefined,
			val: {
				kind: "+",
				lhs: { kind: "number", val: 5, span: [8, 9] },
				rhs: {
					kind: "*",
					lhs: { kind: "number", val: 2, span: [12, 13] },
					rhs: { kind: "number", val: 3, span: [16, 17] },
					span: [12, 17],
				},
				span: [8, 17],
			},
			span: [0, 17],
		},
	]);
});
