import { test, expect } from "bun:test";

import { tokenize } from "./tokenizer";

test("basic", () => {
	expect(tokenize("0b011 Hello 0x16 /* hey */ 44")).toEqual([
		{ kind: "number", val: 0b011, span: [0, 4] },
		{ kind: "ident", val: "Hello", span: [6, 10] },
		{ kind: "number", val: 0x16, span: [12, 15] },
		{ kind: "number", val: 44, span: [27, 28] },
	]);
});
