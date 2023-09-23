import { expect, it, test } from "vitest";
import { TypeSolver, any, never, number, string, boolean, array, fn, variadic, generic } from "../src/typing";

test("all types should satisfy any", () => {
	const solver = new TypeSolver();

	expect(solver.satisfies(any, number)).toBeTruthy();
	expect(solver.satisfies(any, string)).toBeTruthy();
	expect(solver.satisfies(any, boolean)).toBeTruthy();
	expect(solver.satisfies(any, any)).toBeTruthy();
	expect(solver.satisfies(any, never)).toBeTruthy();
	expect(solver.satisfies(any, generic("T"))).toBeTruthy();
	expect(solver.satisfies(any, fn())).toBeTruthy();
	expect(solver.satisfies(any, array(any))).toBeTruthy();
});

test("base types should satisfy themselves", () => {
	const solver = new TypeSolver();

	expect(solver.satisfies(number, number)).toBeTruthy();
	expect(solver.satisfies(string, string)).toBeTruthy();
	expect(solver.satisfies(boolean, boolean)).toBeTruthy();
	expect(solver.satisfies(never, never)).toBeTruthy();
	expect(solver.satisfies(any, any)).toBeTruthy();
});

test("base types should not satisfy each other", () => {
	const solver = new TypeSolver();

	expect(solver.satisfies(number, any)).toBeFalsy();
	expect(solver.satisfies(string, any)).toBeFalsy();
	expect(solver.satisfies(boolean, any)).toBeFalsy();
	expect(solver.satisfies(never, any)).toBeFalsy();

	expect(solver.satisfies(number, string)).toBeFalsy();
	expect(solver.satisfies(boolean, string)).toBeFalsy();
	expect(solver.satisfies(never, string)).toBeFalsy();

	expect(solver.satisfies(number, boolean)).toBeFalsy();
	expect(solver.satisfies(string, boolean)).toBeFalsy();
	expect(solver.satisfies(never, boolean)).toBeFalsy();

	expect(solver.satisfies(number, never)).toBeFalsy();
	expect(solver.satisfies(boolean, never)).toBeFalsy();
	expect(solver.satisfies(string, never)).toBeFalsy();
});

test("generics should satisfy themselves", () => {
	const solver = new TypeSolver();

	expect(solver.satisfies(generic("T"), generic("T"))).toBeTruthy();
	expect(solver.satisfies(generic("K"), generic("V"))).toBeFalsy();
});

test("generics should work", () => {
	const solver = new TypeSolver();

	// set `T` to `number`.
	expect(solver.satisfies(generic("T"), number)).toBeTruthy();

	expect(solver.getGeneric("T")).toBe(number);

	// `string` does not satisfy `number`
	expect(solver.satisfies(generic("T"), string)).toBeFalsy();
});

test("generic bounds should work", () => {
	const solver = new TypeSolver();

	// `number` does not satisfy `array<any>`
	expect(solver.satisfies(generic("T", array(any)), number)).toBeFalsy();

	// `array<string>` does satisfy `array<any>`
	expect(solver.satisfies(generic("T", array(any)), array(string))).toBeTruthy();
});

test("generics should throw on nonexistant generic solving with bound", () => {
	const solver = new TypeSolver();

	expect(() => solver.satisfies(generic("T", array(number)), generic("T"))).toThrow("Undefined generic T while solving");
	expect(() => solver.satisfies(generic("K", string), generic("K"))).toThrow("Undefined generic K while solving");

	expect(() => solver.satisfies(generic("T"), generic("T", array(number)))).toThrow("Undefined generic T while solving");
	expect(() => solver.satisfies(generic("K"), generic("K", string))).toThrow("Undefined generic K while solving");
});

test("generics should handle self satisfying with single bound", () => {
	const solver = new TypeSolver();
	solver.setGeneric("T", number);

	expect(solver.satisfies(generic("T", number), generic("T"))).toBeTruthy();
	expect(solver.satisfies(generic("T"), generic("T", number))).toBeTruthy();
});

test("arrays should satisfy each other based on item type", () => {
	const solver = new TypeSolver();

	expect(solver.satisfies(array(number), array(number))).toBeTruthy();
	expect(solver.satisfies(array(number), array(string))).toBeFalsy();
});

test("functions should satisfy each other based on parameters", () => {
	const solver = new TypeSolver();

	expect(solver.satisfies(fn([number]), fn([number]))).toBeTruthy();
	expect(solver.satisfies(fn([]), fn([]))).toBeTruthy();
	expect(solver.satisfies(fn([string]), fn([number]))).toBeFalsy();
	expect(solver.satisfies(fn([any]), fn([number]))).toBeTruthy();
	expect(solver.satisfies(fn([any, string]), fn([number]))).toBeFalsy();
	expect(solver.satisfies(fn([string]), fn([string, any]))).toBeFalsy();
});

test("functions should satisfy each other based on return type", () => {
	const solver = new TypeSolver();

	expect(solver.satisfies(fn([], number), fn([], any))).toBeFalsy();
	expect(solver.satisfies(fn([], any), fn([], number))).toBeTruthy();
	expect(solver.satisfies(fn([]), fn([], number))).toBeFalsy();
	expect(solver.satisfies(fn([], number), fn([]))).toBeFalsy();
});

test("variadics should satisfy each other based on item", () => {
	const solver = new TypeSolver();

	expect(solver.satisfies(variadic(number), variadic(string))).toBeFalsy();
	expect(solver.satisfies(variadic(any), variadic(string))).toBeTruthy();
	expect(solver.satisfies(variadic(string), variadic(any))).toBeFalsy();
});

test("setGeneric should work", () => {
	const solver = new TypeSolver();
	solver.setGeneric("T", number);

	expect(solver.getGeneric("T")).toBe(number);
});