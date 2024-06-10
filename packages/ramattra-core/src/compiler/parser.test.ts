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
			val: { kind: "number", val: 5, span: [8, 8] },
			span: [0, 8],
		},
	]);

	expect(single("let y = 5 + 2 * 3")).toEqual([
		{
			kind: "let",
			name: "y",
			ty: undefined,
			val: {
				kind: "+",
				lhs: { kind: "number", val: 5, span: [8, 8] },
				rhs: {
					kind: "*",
					lhs: { kind: "number", val: 2, span: [12, 12] },
					rhs: { kind: "number", val: 3, span: [16, 16] },
					span: [12, 16],
				},
				span: [8, 16],
			},
			span: [0, 16],
		},
	]);

	expect(single("let z = [1, 2]")).toEqual([
		{
			kind: "let",
			name: "z",
			ty: undefined,
			val: {
				kind: "array",
				val: [
					{
						kind: "number",
						val: 1,
						span: [9, 9],
					},
					{
						kind: "number",
						val: 2,
						span: [12, 12],
					},
				],
				span: [8, 13],
			},
			span: [0, 13],
		},
	]);
});
