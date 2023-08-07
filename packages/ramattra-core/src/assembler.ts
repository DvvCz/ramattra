import parse, { Statement } from "./parser";

import * as _events from "./events.json";
const Events = _events as any as Record<string, { ow: string, args: [ string, string ][] }>;

import * as _constants from "./constants.json";
const Constants = _constants as any as Record<string, { ow: string, type: string }>;

import * as _functions from "./functions.json";
const Functions = _functions as any as Record<string, { ow: string, args: { type: string, default?: string }[] }>;

export default function assemble(src: string): string {
	const ast = parse(src);
	const buffer = [];

	function statement(statement: Statement): string {
		return "statement";
	}

	for (const obj of ast) {
		if (obj[0] == "function") {
			const [_, name, params, block] = obj;
		} else {
			const [_, name, args, block] = obj;

			const event = Events[name];
			if (!event) {
				throw `Event ${name} does not exist.`;
			}

			if (event.args.length != args.length) {
				throw `Event ${name} has ${event.args.length} arguments.`;
			}

			buffer.push(
				`rule("${name}") {
					event {
						${event.ow};
						All;
						All;
					}
					actions {
						${ block.map(statement).join("\n") }
					}
				}`
			);
		}
	}

	return buffer.join("\n");
}