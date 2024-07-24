import { dedent } from "@ramattra/ramattra-util";
import { analyze, type TExpr, type TStmt } from "./analyzer";
import type { Type } from "./typing";

export function assemble(tast: TStmt): string {
	const buffer: string[] = [];

	const expr = (e: TExpr): string => {
		switch (e.kind) {
			case "+": {
				if (e.type.kind === "native" && e.type.name === "string") {
					return `Custom String("{0}{1}", ${expr(e.lhs)}, ${expr(e.rhs)})`;
				} else {
					return `Add(${expr(e.lhs)}, ${expr(e.rhs)})`;
				}
			}

			case "-":
				return `Subtract(${expr(e.lhs)}, ${expr(e.rhs)})`;
			case "*":
				return `Multiply(${expr(e.lhs)}, ${expr(e.rhs)})`;
			case "/":
				return `Divide(${expr(e.lhs)}, ${expr(e.rhs)})`;

			case "==":
			case "!=":
			case ">=":
			case ">":
			case "<":
			case "<=":
				return `Compare(${expr(e.lhs)}, ${e.kind}, ${expr(e.rhs)})`;

			case "||":
				return `Or(${expr(e.lhs)}, ${expr(e.rhs)})`;
			case "&&":
				return `And(${expr(e.lhs)}, ${expr(e.rhs)})`;

			case "[]":
				return `Value In Array(${expr(e.obj)}, ${expr(e.index)})`;

			case "call":
				return `${e.fn}(${e.args.map(expr).join(", ")})`;
			case "!":
				return `Not(${expr(e.obj)})`;
			case "ident":
				return `Value In Array(Global Variable(Vars), ${e.val})`;
			case "string":
				return `Custom String("${e.val}")`;
			case "boolean":
				return e.val ? "True" : "False";
			case "array":
				return `Array(${e.val.map(expr).join(", ")})`;
			case "number":
				return `${e.val}`;

			default:
				throw "uh oh";
		}
	};

	const stmt = (s: TStmt): string => {
		switch (s.kind) {
			case "scope":
				return s.stmts.map(stmt).join("\n\t\t");
			case "if":
				return dedent`
					If (${expr(s.cond as TExpr)});
						${stmt(s.block)}
					End;
				`;
			case "while":
				return dedent`
					While(${expr(s.cond as TExpr)});
						${stmt(s.block)}
					End;
				`;
			case "let":
			case "assign":
				return dedent`
					Set Global Variable At Index(Vars, ${s.name}, ${expr(s.val as TExpr)});
				`;
			case "call":
				return dedent`
					${s.fn}(${(s.args as TExpr[]).map(expr).join(", ")});
				`;
			default:
				throw `uh oh: ${s}`;
		}
	};

	if (tast.kind !== "scope") throw "Must assemble at top level.";

	/*for (const obj of tast.stmts) {
		// TODO: Probably want dedent to lazily evaluate template expressions or something as to not need this hack.
		buffer.push(
			dedent`
			rule("${name}") {
				event {
					${ow};
					All;
					All;
				}
				actions {
					%S
				}
			}
		`.replace("%S", stmt(block)),
		);
	}*/

	return dedent`
		variables {
			global:
				0: Vars
		}
		${buffer.join("\n")}
	`;
}
