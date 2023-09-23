import { IREvent, IRExpr, IRStmt } from "./analyzer";
import { string, number, boolean } from "../typing";

export default function optimize(events: IREvent[]) {
	const optimizeExpr = (expr: IRExpr): IRExpr => {
		const kind = expr.data[0];
		if (kind == "+") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (expr.type.kind == "native" && expr.type.name == "string") {
				if (lhs.data[0] == "string" && rhs.data[0] == "string")
					return { type: string, data: ["string", lhs.data[1] + rhs.data[1]] };
			} else {
				if (lhs.data[0] == "number" && rhs.data[0] == "number")
					return { type: number, data: ["number", lhs.data[1] + rhs.data[1]] };
			}
		} else if (kind == "-") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (lhs.data[0] == "number" && rhs.data[0] == "number")
				return { type: number, data: ["number", lhs.data[1] + rhs.data[1]] };
		} else if (kind == "*") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (lhs.data[0] == "number" && rhs.data[0] == "number")
				return { type: number, data: ["number", lhs.data[1] * rhs.data[1]] };
		} else if (kind == "/") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (lhs.data[0] == "number" && rhs.data[0] == "number")
				return { type: number, data: ["number", lhs.data[1] / rhs.data[1]] };
		} else if (kind == "<") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (lhs.data[0] == "number" && rhs.data[0] == "number")
				return { type: boolean, data: ["boolean", lhs.data[1] < rhs.data[1]] };
		} else if (kind == "<=") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (lhs.data[0] == "number" && rhs.data[0] == "number")
				return { type: boolean, data: ["boolean", lhs.data[1] <= rhs.data[1]] };
		} else if (kind == ">") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (lhs.data[0] == "number" && rhs.data[0] == "number")
				return { type: boolean, data: ["boolean", lhs.data[1] > rhs.data[1]] };
		} else if (kind == ">=") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (lhs.data[0] == "number" && rhs.data[0] == "number")
				return { type: boolean, data: ["boolean", lhs.data[1] >= rhs.data[1]] };
		} else if (kind == "==") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (lhs.data[0] == "number" && rhs.data[0] == "number")
				return { type: boolean, data: ["boolean", lhs.data[1] == rhs.data[1]] };
		} else if (kind == "!=") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (lhs.data[0] == "number" && rhs.data[0] == "number")
				return { type: boolean, data: ["boolean", lhs.data[1] < rhs.data[1]] };
		} else if (kind == "&&") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (lhs.data[0] == "boolean" && rhs.data[0] == "boolean")
				return { type: boolean, data: ["boolean", lhs.data[1] && rhs.data[1]] };
		} else if (kind == "||") {
			const [lhs, rhs] = [optimizeExpr(expr.data[1]), optimizeExpr(expr.data[2])];
			if (lhs.data[0] == "boolean" && rhs.data[0] == "boolean")
				return { type: boolean, data: ["boolean", lhs.data[1] || rhs.data[1]] };
		} else if (kind == "!") {
			const exp = optimizeExpr(expr.data[1]);
			if (exp.data[0] == "boolean")
				return { type: boolean, data: ["boolean", !exp.data[1]] }
		} else if (kind == "call") {
			const [, name, args] = expr.data;
			return { type: expr.type, data: ["call", name, args.map(optimizeExpr)] };
		}

		return expr;
	}

	const optimizeStmt = (stmt: IRStmt): IRStmt | undefined => {
		const kind = stmt[0];
		if (kind == "block") {
			const [, stmts] = stmt;
			return ["block", stmts.map(optimizeStmt).filter((stmt): stmt is IRStmt => stmt != undefined)]
		} else if (kind == "let") {
			const [, id, type, expr] = stmt;
			return ["let", id, type, optimizeExpr(expr)];
		} else if (kind == "call") {
			const [, name, args] = stmt;
			return ["call", name, args.map(optimizeExpr)];
		} else if (kind == "assign") {
			const [, id, expr] = stmt;
			return ["assign", id, optimizeExpr(expr)];
		} else if (kind == "while") {
			const [, cond, block] = stmt;
			return ["while", optimizeExpr(cond), optimizeStmt(block)!];
		} else if (kind == "if") {
			const [, cond, block] = stmt;
			return ["if", optimizeExpr(cond), optimizeStmt(block)!];
		}

		return stmt;
	};

	const optimizeEvent = (event: IREvent): IREvent => {
		const [, name, args, block] = event;
		return ["event", name, args, optimizeStmt(block)!];
	};

	return events.map(optimizeEvent);
}