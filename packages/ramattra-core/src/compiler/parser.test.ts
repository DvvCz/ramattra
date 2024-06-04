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
});
