import { test, expect, describe } from "bun:test";

import { tokenize } from "./tokenizer";
import { parse } from "./parser";

const ast = (code: string) => parse(tokenize(code));

describe("basic", () => {
	test("let stmt", () => {
		expect(ast("let x = 5")).toEqual({
			kind: "scope",
			stmts: [{
				kind: "let",
				name: "x",
				val: {
					kind: "number",
					val: 5,
					span: [8, 8]
				},
				span: [0, 8]
			}],
			span: [0, 8]
		});
	});

	test("operator precedence", () => {
		expect(ast("let y = 5 + 2 * 3")).toEqual({
			kind: "scope",
			stmts: [{
				kind: "let",
				name: "y",
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
			}],
			span: [0, 16]
		});
	});

	test("arrays", () => {
		expect(ast("let z = [1, 2]")).toEqual({
			kind: "scope",
			stmts: [{
				kind: "let",
				name: "z",
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
			}],
			span: [0, 13]
		});
	});

	test("function call", () => {
		expect(ast("foo()")).toEqual({
			kind: "scope",
			stmts: [{
				kind: "call",
				fn: {
					kind: "ident",
					val: "foo",
					span: [0, 2]
				},
				args: [],
				span: [0, 4],
			}],
			span: [0, 4]
		});
	});

	test("indexing", () => {
		expect(ast("let x = foo[1][2]")).toEqual({
			kind: "scope",
			stmts: [{
				kind: "let",
				name: "x",
				val: {
					kind: "[]",
					obj: {
						kind: "[]",
						obj: {
							kind: "ident",
							val: "foo",
							span: [8, 10]
						},
						index: {
							kind: "number",
							val: 1,
							span: [12, 12]
						},
						span: [8, 13]
					},
					index: {
						kind: "number",
						val: 2,
						span: [15, 15],
					},
					span: [8, 16]
				},
				span: [0, 16]
			}],
			span: [0, 16]
		})
	});
});
