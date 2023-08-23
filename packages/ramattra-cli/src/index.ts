#!/usr/bin/env node
import { Command } from "commander";
import { assemble, parse } from "@ramattra/ramattra-core";
import * as fs from "node:fs/promises";

const program = new Command();

program
	.command("parse")
	.description("Parses a given source file into an AST")
	.argument("<input-file>")
	.argument("[output-file]")
	.action(async (input, output, opts) => {
		try {
			const src = await fs.readFile(input);
			try {
				const ast = parse(src.toString())
				if (output) {
					await fs.writeFile(output, ast.toString());
				} else {
					console.log(ast);
				}
			} catch (err) {
				console.error(`Failed to parse: ${err}`);
			}
		} catch (err) {
			console.error(`Failed to read file ${input}: ${err}`);
		}
	});

program
	.command("compile")
	.description("Compiles a Ramattra script to a workshop script.")
	.argument("<input-file>")
	.argument("[output-file]")
	.action(async (input, output, opts) => {
		try {
			const src = await fs.readFile(input);
			try {
				const compiled = assemble(src.toString())
				if (output) {
					await fs.writeFile(output, compiled);
				} else {
					console.log(compiled);
				}
			} catch (err) {
				console.error(`Failed to parse: ${err}`);
			}
		} catch (err) {
			console.error(`Failed to read file ${input}: ${err}`);
		}
	});

program.parse();