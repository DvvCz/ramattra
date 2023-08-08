import parse, { Statement } from "./parser";

import { EVENTS, CONSTANTS, FUNCTIONS } from "./std";

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

			const event = EVENTS[name];
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
						${ block.map(statement).join("\n\t") }
					}
				}`
			);
		}
	}

	return buffer.join("\n");
}