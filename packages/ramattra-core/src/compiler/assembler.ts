import { dedent } from "@ramattra/ramattra-util";
import { analyze, IRExpr, IRStmt } from "./analyzer.js";
import optimize from "./optimizer.js";

export function assemble(src: string): string {
	const ast = optimize(analyze(src));
	const buffer = [];

	const expression = (expr: IRExpr): string => {
		const kind = expr.data[0];
		if (kind == "+") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])];
			if (expr.type.kind == "native" && expr.type.name == "string") {
				return `Custom String("{0}{1}", ${lhs}, ${rhs})`;
			} else {
				return `Add(${lhs}, ${rhs})`;
			}
		} else if (kind == "-") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])];
			return `Subtract(${lhs}, ${rhs})`;
		} else if (kind == "*") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])];
			return `Multiply(${lhs}, ${rhs})`;
		} else if (kind == "/") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])];
			return `Divide(${lhs}, ${rhs})`;
		} else if (kind == "==" || kind == "!=" || kind == ">=" || kind == ">" || kind == "<" || kind == "<=") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])];
			return `Compare(${lhs}, ${kind}, ${rhs})`;
		} else if (kind == "||") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])];
			return `Or(${lhs}, ${rhs})`;
		} else if (kind == "&&") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])];
			return `And(${lhs}, ${rhs})`;
		} else if (kind == "index") {
			const [obj, idx] = [expression(expr.data[1]), expression(expr.data[2])];
			return `Value In Array(${obj}, ${idx})`;
		} else if (kind == "call") {
			return `${expr.data[1]}(${expr.data[2].map(expression).join(", ")})`;
		} else if (kind == "!") {
			return `Not(${expression(expr.data[1])})`;
		} else if (kind == "constant") {
			return expr.data[1];
		} else if (kind == "ident") {
			const [, id] = expr.data;
			return `Value In Array(Global Variable(Vars), ${id})`;
		} else if (kind == "string") {
			return `Custom String("${expr.data[1]}")`;
		} else if (kind == "boolean") {
			return expr.data[1] ? "True" : "False";
		} else if (kind == "array") {
			return `Array(${expr.data[2].map(expression).join(", ")})`;
		} else if (kind == "number") {
			return expr.data[1].toString();
		}

		return kind;
	}

	const statement = (stmt: IRStmt): string => {
		const kind = stmt[0];
		if (kind == "block") {
			return stmt[1].map(statement).join("\n\t\t");
		} else if (kind == "if") {
			const [, condition, block] = stmt;

			return dedent`
				If (${expression(condition)});
					%S
				End;
			`.replace("%S", statement(block));
		} else if (kind == "while") {
			const [, condition, block] = stmt;

			return dedent`
				While(${expression(condition)});
					%S
				End;
			`.replace("%S", statement(block));
		} else if (kind == "let") {
			const [, id, _type, value] = stmt;

			return dedent`
				Set Global Variable At Index(Vars, ${id}, ${expression(value)});
			`;
		} else if (kind == "assign") {
			const [, id, expr] = stmt;

			return dedent`
				Set Global Variable At Index(Vars, ${id}, ${expression(expr)});
			`;
		} else if (kind == "iassign") {
			const [, obj, index, value] = stmt;
			return dedent`
				Set Player Variable(${obj}, ${index}, ${value});
			`;
		} else if (kind == "call") {
			const [, name, args] = stmt;
			return dedent`
				${name}(${args.map(expression).join(", ")});
			`;
		} else if (kind == "noop") {
			return "";
		} else if (kind == "break") {
			return "Break;"
		} else if (kind == "continue") {
			return "Continue;"
		}

		return kind;
	}

	for (const obj of ast) {
		const [, name, ow, block] = obj;

		// TODO: Probably want dedent to lazily evaluate template expressions or something as to not need this hack.
		buffer.push(dedent`
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
		`.replace("%S", statement(block)));
	}

	return dedent`
		variables {
			global:
				0: Vars
		}
		%S
	`.replace("%S", buffer.join("\n"));
}