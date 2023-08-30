import { analyze } from "../src/compiler/analyzer.js";
import { expect, it } from "vitest";

it("should allow indexing arrays", () => {
	expect(() => analyze(`
		event client(ply) {
			let arr = [1, 2, 3];
			let element = arr[1];
		}
	`)).not.toThrowError("Cannot index type of");
});