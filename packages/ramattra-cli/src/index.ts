#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
	.command("parse")
	.description("Parses a given source file into an AST")
	.argument("<string>", "Input file")
	.argument("<string>", "Output file")
	.action((input, output, opts) => {
		console.log(input, output);
	});

program.parse();