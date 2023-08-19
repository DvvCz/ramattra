import { dedent } from "../util";
import analyze, { IRExpr, IRStmt } from "./analyzer";

export default function assemble(src: string): string {
	const ast = analyze(src);
	const buffer = [];

	const expression = (expr: IRExpr): string => {
		const kind = expr.data[0];
		if (kind == "add") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			if (expr.type == "string") {
				return `Custom String("{0}{1}", ${lhs} ${rhs})`;
			} else {
				return `Add(${lhs}, ${rhs})`;
			}
		} else if (kind == "sub") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			return `Subtract(${lhs}, ${rhs})`;
		} else if (kind == "mul") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			return `Multiply(${lhs}, ${rhs})`;
		} else if (kind == "div") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			return `Divide(${lhs}, ${rhs})`;
		} else if (kind == "eq") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			return `Compare(${lhs}, ==, ${rhs})`;
		} else if (kind == "neq") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			return `Compare(${lhs}, ==, ${rhs})`;
		} else if (kind == "gte") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			return `Compare(${lhs}, >=, ${rhs})`;
		} else if (kind == "gt") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			return `Compare(${lhs}, >, ${rhs})`;
		} else if (kind == "lt") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			return `Compare(${lhs}, <, ${rhs})`;
		} else if (kind == "lte") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			return `Compare(${lhs}, <=, ${rhs})`;
		} else if (kind == "or") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			return `Or(${lhs}, ${rhs})`;
		} else if (kind == "and") {
			const [lhs, rhs] = [expression(expr.data[1]), expression(expr.data[2])]
			return `And(${lhs}, ${rhs})`;
		} else if (kind == "index") {
			throw `Unimplemented: Index`;
		} else if (kind == "call") {
			const [name, args] = [expr.data[1], expr.data[2].map(expression)];
			return `${name}(${args.join(", ")})`;
		} else if (kind == "not") {
			return `Not(${expression(expr.data[1])})`;
		} else if (kind == "ident") {
			throw `Unimplemented: Ident`;
		} else if (kind == "string") {
			return `"${expr.data[1]}"`;
		} else if (kind == "boolean") {
			return expr.data[1].toString();
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
			const [, name, type, value] = stmt;

			return dedent`
				Set Global Variable At Index(Vars, ${name}, ${expression(value)})
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