import { parse, Parser } from "../src/compiler/parser.js";
import { expect, it } from "bun:test";
import { dedent } from "@ramattra/ramattra-util";

const exp = (src: string) => Parser.parse(src, { startRule: "Expr" });

it("should parse hexadecimals", () => {
	expect(exp("0x12")).toMatchObject({ data: ["number", 0x12] });
	expect(exp("0xaf")).toMatchObject({ data: ["number", 0xaf] });
	expect(exp("0xDEADBEEF")).toMatchObject({ data: ["number", 0xDEADBEEF] });
});

it("should parse binary numbers", () => {
	expect(exp("0b11111111")).toMatchObject({ data: ["number", 0b11111111] });
	expect(exp("0b00101101")).toMatchObject({ data: ["number", 0b00101101] });
});

it("should parse decimals", () => {
	expect(exp("0.12345")).toMatchObject({ data: ["number", 0.12345] });
	expect(exp("0.0")).toMatchObject({ data: ["number", 0.0] });
	expect(exp("12328131.2")).toMatchObject({ data: ["number", 12328131.2] });
});

it("should parse integers", () => {
	expect(exp("123456789")).toMatchObject({ data: ["number", 123456789] });
	expect(exp("1")).toMatchObject({ data: ["number", 1] });
	expect(exp("0")).toMatchObject({ data: ["number", 0] });
});

// TODO: String escapes
it.skip("should parse strings", () => {
	expect(exp(`"Hello, world"`)).toMatchObject({ data: ["string", "Hello, world"] });
	expect(exp(`"Hello, \\"world"`)).toMatchObject({ data: ["string", "Hello, \"world"] });
});

it("should parse booleans", () => {
	expect(exp("true")).toMatchObject({ data: ["boolean", true] });
	expect(exp("false")).toMatchObject({ data: ["boolean", false] });
});

it("should parse lambdas", () => {
	expect(exp("x => 5")).toMatchObject({ data: ["lambda", ["x"], { data: ["number", 5] }] });
});

it("should parse identifiers", () => {
	expect(exp("let")).toMatchObject({ data: ["ident", "let"] });
	expect(exp("_")).toMatchObject({ data: ["ident", "_"] });
	expect(exp("_ABC")).toMatchObject({ data: ["ident", "_ABC"] });
	expect(exp("ABCXYZ_")).toMatchObject({ data: ["ident", "ABCXYZ_"] });
});

it.skip("should parse unicode identifiers", () => {
	expect(exp("Torbjörn")).toMatchObject({ data: ["ident", "Torbjörn"] });
});

it("should parse logical not", () => {
	expect(exp("!5")).toMatchObject({ data: ["!", { data: ["number", 5] }] });
	expect(exp("!!5")).toMatchObject({ data: ["!", { data: ["!", { data: ["number", 5] }] }] });
});

it("should parse typeof", () => {
	expect(exp("typeof 5")).toMatchObject({ data: ["typeof", { data: ["number", 5] }] });
	expect(exp("typeof typeof 5")).toMatchObject({ data: ["typeof", { data: ["typeof", { data: ["number", 5] }] }] });
});

it("should parse arrays", () => {
	expect(exp("[1, 2, 3]")).toMatchObject({ data: ["array", null, [{ data: ["number", 1] }, { data: ["number", 2] }, { data: ["number", 3] }]] });
	expect(exp("<number>[1, 2, 3]")).toMatchObject({ data: ["array", { kind: "native", name: "number" }, [{ data: ["number", 1] }, { data: ["number", 2] }, { data: ["number", 3] }]] });
	expect(exp("<string>[]")).toMatchObject({ data: ["array", { kind: "native", name: "string" }, []] });
});

it("should parse grouped expression", () => {
	expect(exp("(5)")).toMatchObject({ data: ["number", 5] });
	expect(exp("(((((true)))))")).toMatchObject({ data: ["boolean", true] });
});

it("should throw proper errors", () => {
	const src = dedent`
		event hello world() {}
	`;

	expect(() => parse(src)).toThrow(`Expected "(", comment, or whitespace but "w" found.`);
});