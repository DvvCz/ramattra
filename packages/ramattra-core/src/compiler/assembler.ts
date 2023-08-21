import { dedent } from "../util.js";
import analyze, { IRExpr, IRStmt } from "./analyzer.js";

export default function assemble(src: string): string {
	const ast = analyze(src);
	const buffer = [];

	const expression = (expr: IRExpr): string => {
		const kind = expr.data[0];
		if (kind == "+") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])];
			if (expr.type == "string") {
				return `Custom String("{0}{1}", ${lhs} ${rhs})`;
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
			const [, name, depth] = expr.data;
			return `Value In Array(Global Variable(Vars), ${name}${depth})`;
		} else if (kind == "string") {
			return `Custom String("${expr.data[1]}")`;
		} else if (kind == "boolean") {
			return expr.data[1] ? "True" : "False";
		} else if (kind == "array") {
			return `Array(${expr.data[2].map(expression).join(", ")})`;
		} else if (kind == "number") {
			return expr.data[1].toString();
		}

		throw `Unreachable`;
	}

	const statement = (stmt: IRStmt): string => {
		const kind = stmt[0];
		if (kind == "block") {
			return stmt[1].map(statement).join("\n\t\t");
		} else if (kind == "if") {
			const [, condition, block] = stmt;

			return dedent`
				If (${condition});
					${block}
				End;
			`;
		} else if (kind == "while") {
			const [, condition, block] = stmt;

			return dedent`
				While(${condition});
					${block};
				End;
			`;
		} else if (kind == "let") {
			const [, name, depth, type, value] = stmt;

			return dedent`
				Set Global Variable At Index(Vars, ${name}${depth}, ${expression(value)})
			`;
		} else if (kind == "assign") {
			const [, name, expr] = stmt;

			return dedent`
				Set Global Variable At Index(Vars, ${name}, ${expr})
			`;
		} else if (kind == "call") {
			const [, name, args] = stmt;

			return dedent`
				${name}(${args})
			`;
		} else if (kind == "noop") {
			return "";
		}

		throw `Unreachable`;
	}

	for (const obj of ast) {
		const [, name, ow, block] = obj;

		buffer.push(dedent`
			rule("${name}") {
				event {
					${ow};
					All;
					All;
				}
				actions {
					${statement(block)}
				}
			}
		`);
	}

	return buffer.join("\n");
}