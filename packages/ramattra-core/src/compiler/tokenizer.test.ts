import { test, expect } from "bun:test";

import { tokenize } from "./tokenizer";

test("basic", () => {
	expect(tokenize("0b011 Hello 0x16 /* hey */ 44")).toEqual([
		{ kind: "number", val: 0b011, span: [0, 5] },
		{ kind: "ident", val: "Hello", span: [6, 11] },
		{ kind: "number", val: 0x16, span: [12, 16] },
		{ kind: "number", val: 44, span: [27, 29] },
	]);
});
