import { EVENTS, CONSTANTS, FUNCTIONS } from "./std";
import parse, { Stmt, Expr } from "./parser";

// methodcall desugars to call
// for desugars to while
export type IRStmt =
	["block", IRStmt[]]
	| ["if", IRExpr, IRStmt]
	| ["while", IRExpr, IRStmt]
	| ["let", string, string, IRExpr]
	| ["assign", string, IRExpr]
	| ["call", string, IRExpr[]]
	| ["noop"]

export type IRExpr =
	{ type: string, data: IRExprData }

type IRExprData =
	["add", IRExpr, IRExpr] |
	["sub", IRExpr, IRExpr] |
	["mul", IRExpr, IRExpr] |
	["div", IRExpr, IRExpr] |

	["eq", IRExpr, IRExpr] |
	["neq", IRExpr, IRExpr] |
	["gte", IRExpr, IRExpr] |
	["gt", IRExpr, IRExpr] |
	["lt", IRExpr, IRExpr] |
	["lte", IRExpr, IRExpr] |

	["or", IRExpr, IRExpr] |
	["and", IRExpr, IRExpr] |

	["index", IRExpr, IRExpr] |
	["call", string, IRExpr[]] |

	["not", IRExpr] |

	["ident", string] |
	["string", string] |
	["boolean", boolean] |
	["array", string | null, IRExpr[]] |
	["number", number]

export type IREvent =
	["event", string, string, IRStmt];

export type IRFunction =
	["function", string, string[], IRStmt];

export default function analyze(src: string): IREvent[] {
	const ast = parse(src);

	let scope = new Map<string, string>();
	const scopes = [scope];

	const lookupVariable = (name: string): [string, Map<string, string>] | undefined => {
		for (let i = scopes.length; i > 0; i++) {
			const scope = scopes[i];
			const value = scope.get(name);
			if (value)
				return [value, scope];
		}
	}

	const analyzeExpr = (expr: Expr): IRExpr => {
		const kind = expr[0];

		if (kind == "add" || kind == "sub" || kind == "mul" || kind == "div") {
			const [lhs, rhs] = [analyzeExpr(expr[1]), analyzeExpr(expr[2])];

			if (lhs.type != rhs.type)
				throw `Cannot perform ${kind} operation on expressions of differing types (${lhs.type} and ${rhs.type})`;

			if (lhs.type != "number")
				throw `Cannot perform ${kind} operation on non-numeric expressions`;

			return { type: "number", data: [kind as any, lhs, rhs] };
		} else if (kind == "eq" || kind == "neq" || kind == "gte" || kind == "gt" || kind == "lt" || kind == "lte") {
			const [lhs, rhs] = [analyzeExpr(expr[1]), analyzeExpr(expr[2])]

			if (lhs.type != rhs.type)
				throw `Cannot perform ${kind} operation on expressions of differing types (${lhs.type} and ${rhs.type})`;

			return { type: "boolean", data: [kind as any, lhs, rhs] };
		} else if (kind == "or" || kind == "and") {
			const [lhs, rhs] = [analyzeExpr(expr[1]), analyzeExpr(expr[2])]

			if (lhs.type != rhs.type)
				throw `Cannot perform ${kind} operation on expressions of differing types (${lhs.type} and ${rhs.type})`;

			if (lhs.type != "boolean")
				throw `Cannot perform ${kind} operation on non-boolean expressions`;

			return { type: "boolean", data: [kind as any, lhs, rhs] };
		} else if (kind == "index") {
			const [array, index] = [analyzeExpr(expr[1]), analyzeExpr(expr[2])];

			if (!array.type.startsWith("array"))
				throw `Cannot index non array type`;

			if (index.type != "number")
				throw `Can only index an array with a number`;

			return { type: array.type.slice(6, -1), data: [kind, array, index] };
		} else if (kind == "methodcall") {
			const [obj, method_name, args] = [analyzeExpr(expr[1]), expr[2], expr[3].map(analyzeExpr)];
			throw `Unimplemented: Methodcall`;
		} else if (kind == "call") {
			const [name, args] = [expr[1], expr[2].map(analyzeExpr)];

			const fn = FUNCTIONS[name];
			if (!fn)
				throw `No such function ${name}`;

			const types = args.map(x => x.type);
			for (const expected of fn.args) {
				if (types.length == 0) {
					if (expected.default) {
						// TODO: Push defaults into call arguments
						break;
					} else {
						throw `Not enough arguments passed to ${name}, expected ${expected.type}`;
					}
				}

				const given = types.shift();
				if (given != expected.type)
					throw `Expected ${expected.type}, got ${given}`;
			}

			return { type: fn.ret ?? "!", data: ["call", fn.ow, args] };
		} else if (kind == "not") {
			return { type: "boolean", data: [kind, analyzeExpr(expr)] };
		} else if (kind == "typeof") {
			const value = analyzeExpr(expr);
			return { type: "string", data: ["string", value.type] };
		} else if (kind == "string" || kind == "boolean" || kind == "number") {
			return { type: kind, data: [kind as any, expr[1]] };
		} else if (kind == "array") {
			return { type: kind, data: [kind, expr[1], expr[2].map(analyzeExpr)] }
		}

		throw `Unreachable`;
	};

	const analyzeStmt = (statement: Stmt): IRStmt => {
		const kind = statement[0];
		if (kind == "block") {
			scope = new Map();

			scopes.push(scope);
			const out = statement[1].map(analyzeStmt);
			scopes.pop();

			return ["block", out];
		} else if (kind == "if") {
			return ["if", analyzeExpr(statement[1]), analyzeStmt(statement[2])];
		} else if (kind == "for") {
			const [, ident, start, end] = statement;

			// Desugar to while loop
			return analyzeStmt(["block", [
				["let", ident, "number", start],
				["while", ["lt", ["ident", ident], end],
					["block", []]
				]
			]]);
		} else if (kind == "while") {
			return ["while", analyzeExpr(statement[1]), analyzeStmt(statement[2])];
		} else if (kind == "let") {
			const [name, type, expr] = [statement[1], statement[2], statement[3] && analyzeExpr(statement[3])];

			if (scope.has(name))
				throw `Cannot redeclare existing variable ${name}`;

			if (expr) {
				if (type) {
					if (type != expr.type)
						throw `Declaration annotated as type ${type} given expression of type ${expr.type}`;
				}

				scope.set(name, expr.type);
			} else if (type) {
				scope.set(name, type);
			} else {
				throw `Cannot declare variable without type annotation or expression`;
			}

			if (expr) {
				return ["let", name, type, expr];
			} else {
				return ["noop"];
			}
		} else if (kind == "assign") {
			const [name, expr] = [statement[1], analyzeExpr(statement[2])];

			const v = lookupVariable(name);
			if (!v)
				throw `Variable ${name} has not been declared. Maybe you meant let ${name}?`;

			const [type] = v;
			if (type != expr.type)
				throw `Cannot assign value of ${expr.type} to variable of type ${type}`;

			return ["assign", name, expr];
		} else if (kind == "methodcall") {
			return analyzeStmt(["call", statement[2], [statement[1], ...statement[3]]])
		} else if (kind == "call") {
			const [name, args] = [statement[1], statement[2].map(analyzeExpr)];

			const fn = FUNCTIONS[name];
			if (!fn)
				throw `No such function ${name}`;

			const types = args.map(x => x.type);
			for (const expected of fn.args) {
				if (types.length == 0) {
					if (expected.default) {
						// TODO: Push defaults into call arguments
						break;
					} else {
						throw `Not enough arguments passed to ${name}, expected ${expected.type}`;
					}
				}

				const given = types.shift();
				if (given != expected.type)
					throw `Expected ${expected.type}, got ${given}`;
			}

			return ["call", fn.ow, args];
		}

		throw `Unreachable`;
	};

	const out: IREvent[] = [];
	for (const obj of ast) {
		if (obj[0] == "function") {
			const [name, params, block] = [obj[1], obj[2], analyzeStmt(obj[3])];

			// TODO:

			throw `Unimplemented: Functions`;
		} else {
			const [name, args, block] = [obj[1], obj[2], analyzeStmt(obj[3])];

			const event = EVENTS[name];

			if (!event)
				throw `Event ${name} does not exist.`;

			if (event.args.length != args.length)
				throw `Event ${name} has ${event.args.length} arguments.`;

			// TODO: set arg types in scope

			out.push(["event", name, event.ow, block]);
		}
	}

	return out;
}