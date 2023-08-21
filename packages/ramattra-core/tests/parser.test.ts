import { parse, Parser } from "../src/compiler/parser.js";
import { expect, it } from "vitest";
import { dedent } from "../src/util.js";

const exp = (src: string) => Parser.parse(src, { startRule: "Expr" });

it("should parse hexadecimals", () => {
	expect(exp("0x12")).toEqual(["number", 0x12]);
	expect(exp("0xaf")).toEqual(["number", 0xaf]);
	expect(exp("0xDEADBEEF")).toEqual(["number", 0xDEADBEEF]);
});

it("should parse binary numbers", () => {
	expect(exp("0b11111111")).toEqual(["number", 0b11111111]);
	expect(exp("0b00101101")).toEqual(["number", 0b00101101]);
});

it("should parse decimals", () => {
	expect(exp("0.12345")).toEqual(["number", 0.12345]);
	expect(exp("0.0")).toEqual(["number", 0.0]);
	expect(exp("12328131.2")).toEqual(["number", 12328131.2]);
});

it("should parse integers", () => {
	expect(exp("123456789")).toEqual(["number", 123456789]);
	expect(exp("1")).toEqual(["number", 1]);
	expect(exp("0")).toEqual(["number", 0]);
});

// TODO: String escapes
it.skip("should parse strings", () => {
	expect(exp(`"Hello, world"`)).toEqual(["string", "Hello, world"]);
	expect(exp(`"Hello, \\"world"`)).toEqual(["string", "Hello, \"world"]);
});

it("should parse booleans", () => {
	expect(exp("true")).toEqual(["boolean", true]);
	expect(exp("false")).toEqual(["boolean", false]);
});

it("should parse lambdas", () => {
	expect(exp("x => 5")).toEqual(["lambda", ["x"], ["number", 5]]);
});

it("should parse identifiers", () => {
	expect(exp("let")).toEqual(["ident", "let"]);
	expect(exp("_")).toEqual(["ident", "_"]);
	expect(exp("_ABC")).toEqual(["ident", "_ABC"]);
	expect(exp("ABCXYZ_")).toEqual(["ident", "ABCXYZ_"]);
});

it.skip("should parse unicode identifiers", () => {
	expect(exp("Torbjörn")).toEqual(["ident", "Torbjörn"]);
});

it("should give appropriate number errors", () => {
	expect(() => exp("0.")).toThrow(`Expected expression but "0" found.`);
});

it("should parse logical not", () => {
	expect(exp("!5")).toEqual(["!", ["number", 5]]);
	expect(exp("!!5")).toEqual(["!", ["!", ["number", 5]]]);
});

it("should parse typeof", () => {
	expect(exp("typeof 5")).toEqual(["typeof", ["number", 5]]);
	expect(exp("typeof typeof 5")).toEqual(["typeof", ["typeof", ["number", 5]]]);
});

it("should parse arrays", () => {
	expect(exp("[1, 2, 3]")).toEqual(["array", null, [["number", 1], ["number", 2], ["number", 3]]]);
	expect(exp("<number>[1, 2, 3]")).toEqual(["array", "number", [["number", 1], ["number", 2], ["number", 3]]]);
	expect(exp("<string>[]")).toEqual(["array", "string", []]);
});

it("should parse grouped expression", () => {
	expect(exp("(5)")).toEqual(["number", 5]);
	expect(exp("(((((true)))))")).toEqual(["boolean", true]);
});

it("should throw proper errors", () => {
	const src = dedent`
		event hello world() {}
	`;

	expect(() => parse(src)).toThrow(`Expected "(", comment, or whitespace but "w" found.`);
});