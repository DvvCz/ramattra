import { expect, it } from "bun:test";
import { dedent } from "../src/index.js";

it("should dedent simple string", () => {
	const got = dedent`
		Hello, world!
	`;

	expect(got).toBe("Hello, world!");
});

it("should dedent complex string", () => {
	const got = dedent`
			Hello, world!
		Test
	`;

	expect(got).toBe("\tHello, world!\nTest");
});

it("should dedent empty string", () => {
	const got = dedent``;

	expect(got).toBe("");
});