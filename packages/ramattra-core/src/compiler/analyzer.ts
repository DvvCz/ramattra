import { EVENTS, CONSTANTS, FUNCTIONS } from "./std.js";
import { parse, Stmt, Expr } from "./parser.js";

export type IRStmt =
	["block", IRStmt[]]
	| ["if", IRExpr, IRStmt]
	| ["while", IRExpr, IRStmt]
	| ["let", number, string, IRExpr]
	| ["assign", number, IRExpr]
	| ["call", string, IRExpr[]]
	| ["noop"]

export type IRExpr =
	{ type: string, data: IRExprData }

type IRExprData =
	["+", IRExpr, IRExpr] |
	["-", IRExpr, IRExpr] |
	["*", IRExpr, IRExpr] |
	["/", IRExpr, IRExpr] |

	["==", IRExpr, IRExpr] |
	["!=", IRExpr, IRExpr] |
	[">=", IRExpr, IRExpr] |
	[">", IRExpr, IRExpr] |
	["<", IRExpr, IRExpr] |
	["<=", IRExpr, IRExpr] |

	["||", IRExpr, IRExpr] |
	["&&", IRExpr, IRExpr] |

	["index", IRExpr, IRExpr] |
	["call", string, IRExpr[]] |

	["!", IRExpr] |

	["constant", string] |
	["ident", number] |
	["string", string] |
	["boolean", boolean] |
	["array", string | null, IRExpr[]] |
	["number", number]

export type IREvent =
	["event", string, string, IRStmt];

export type IRFunction =
	["function", string, string[], IRStmt];

type Scope = Map<string, IRExpr>;

export default function analyze(src: string): IREvent[] {
	const ast = parse(src);

	let scope: Scope = new Map();
	const interner = new Map<string, number>();
	const scopes = [scope];

	const lookupVariable = (name: string): IRExpr | undefined => {

		for (let i = scopes.length - 1; i >= 0; i--) {
			const scope = scopes[i];
			const value = scope.get(name);

			if (value)
				return value;
		}

		const constant = CONSTANTS[name];
		if (constant)
			return { type: constant.type, data: ["constant", constant.ow] }
	}

	const analyzeExpr = (expr: Expr): IRExpr => {
		const kind = expr[0];

		if (kind == "+") {
			const [lhs, rhs] = [analyzeExpr(expr[1]), analyzeExpr(expr[2])];

			if (lhs.type == "number" && rhs.type != "number")
				throw `Cannot add a ${rhs.type} to a number`;

			// Can append anything to a string.

			if (lhs.type != "string")
				throw `Can only add strings`;

			return { type: lhs.type, data: [kind, lhs, rhs] };
		} else if (kind == "-" || kind == "*" || kind == "/") {
			const [lhs, rhs] = [analyzeExpr(expr[1]), analyzeExpr(expr[2])];

			if (lhs.type != rhs.type)
				throw `Cannot perform ${kind} operation on expressions of differing types (${lhs.type} and ${rhs.type})`;

			if (lhs.type != "number")
				throw `Cannot perform ${kind} operation on non-numeric expressions`;

			return { type: "number", data: [kind as any, lhs, rhs] };
		} else if (kind == "==" || kind == "!=" || kind == ">=" || kind == ">" || kind == "<" || kind == "<=") {
			const [lhs, rhs] = [analyzeExpr(expr[1]), analyzeExpr(expr[2])]

			if (lhs.type != rhs.type)
				throw `Cannot perform ${kind} operation on expressions of differing types (${lhs.type} and ${rhs.type})`;

			return { type: "boolean", data: [kind as any, lhs, rhs] };
		} else if (kind == "||" || kind == "&&") {
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
		} else if (kind == "call") {
			const [name, args] = [expr[1], expr[2].map(analyzeExpr)];

			const fn = FUNCTIONS[name];
			const types = args.map(a => a.type);

			if (!fn)
				throw `No such function ${name}(${types.join(", ")})`;

			outer: for (const expected of fn.args) {
				if (types.length == 0) {
					if (expected.default) {
						args.push(analyzeExpr(expected.default));
						continue;
					} else if (expected.type == "...") {
						break;
					} else {
						throw `Not enough arguments passed to ${name}, expected ${expected.type}`;
					}
				}

				const given = types.shift();
				if (expected.type.includes("|")) {
					for (const ty of expected.type.split("|")) {
						if (given == ty)
							continue outer;
					}
				} else if (expected.type == "...") {
					break;
				} else if (given == expected.type) {
					continue;
				}

				throw `Expected ${expected.type}, got ${given}`;
			}

			return { type: fn.ret ?? "!", data: ["call", fn.ow, args] };
		} else if (kind == "!") {
			return { type: "boolean", data: [kind, analyzeExpr(expr)] };
		} else if (kind == "typeof") {
			const value = analyzeExpr(expr);
			return { type: "string", data: ["string", value.type] };
		} else if (kind == "string" || kind == "boolean" || kind == "number") {
			return { type: kind, data: [kind as any, expr[1]] };
		} else if (kind == "array") {
			const [type, values] = [expr[1], expr[2].map(analyzeExpr)];

			let ty = type;
			for (const value of values) {
				if (!ty) {
					ty = value.type;
				} else if (value.type != ty) {
					throw `Array of type ${ty} cannot also hold a ${value.type} type.`;
				}
			}

			if (!ty)
				throw `Empty array must be given a tagged type <T>`;

			return { type: `array<${ty}>`, data: [kind, expr[1], expr[2].map(analyzeExpr)] };
		} else if (kind == "ident") {
			const v = lookupVariable(expr[1]);
			if (!v)
				throw `Variable ${expr[1]} is not defined.`;
			return v;
		}

		throw `Unreachable`;
	};

	let varcounter = 0;

	const analyzeStmt = (statement: Stmt): IRStmt => {
		const kind = statement[0];
		if (kind == "block") {
			scope = new Map();

			scopes.push(scope);
			const out = statement[1].map(analyzeStmt);
			scope = scopes.pop()!;

			return ["block", out];
		} else if (kind == "if") {
			return ["if", analyzeExpr(statement[1]), analyzeStmt(statement[2])];
		} else if (kind == "while") {
			return ["while", analyzeExpr(statement[1]), analyzeStmt(statement[2])];
		} else if (kind == "let") {
			const [name, expr] = [statement[1], statement[3] && analyzeExpr(statement[3])];
			const type = statement[2] ? statement[2] : expr?.type;

			if (!type)
				throw `Cannot declare variable without an expression or type annotation`;

			if (scope.has(name))
				throw `Cannot redeclare existing variable ${name}`;

			if (expr && type != expr.type)
				throw `Declaration annotated as type ${type} cannot be given expression of type ${expr.type}`;

			const [str, id] = [`${name}${scopes.length}`, interner.size];
			if (!interner.has(str))
				interner.set(str, id);

			scope.set(name, { type: type, data: ["ident", id] });

			if (expr) {
				return ["let", id, type, expr];
			} else {
				return ["noop"];
			}
		} else if (kind == "assign") {
			const [name, expr] = [statement[1], analyzeExpr(statement[2])];

			const v = lookupVariable(name);
			if (!v)
				throw `Variable ${name} has not been declared. Maybe you meant let ${name}?`;

			if (v.type != expr.type)
				throw `Cannot assign value of ${expr.type} to variable of type ${v.type}`;

			if (v.data[0] == "constant")
				throw `Cannot assign to constant ${name}`;

			return ["assign", v.data[1] as number, expr];
		} else if (kind == "call") {
			const [name, args] = [statement[1], statement[2].map(analyzeExpr)];

			const fn = FUNCTIONS[name];
			if (!fn)
				throw `No such function ${name}`;

			const types = args.map(x => x.type);
			outer: for (const expected of fn.args) {
				if (types.length == 0) {
					if (expected.default) {
						args.push(analyzeExpr(expected.default));
						continue;
					} else {
						throw `Not enough arguments passed to ${name}, expected ${expected.type}`;
					}
				}

				const given = types.shift();
				if (expected.type.includes("|")) {
					for (const ty of expected.type.split("|")) {
						if (given == ty)
							continue outer;
					}
				} else if (given == expected.type) {
					continue;
				}

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
			// TODO: Functions
		} else {
			const [, name, args, block] = obj;

			const event = EVENTS[name];

			if (!event)
				throw `Event ${name} does not exist.`;

			if (event.args.length != args.length)
				throw `Event ${name} has ${event.args.length} arguments.`;

			scope = new Map();
			for (const [i, arg] of args.entries()) {
				const registered = event.args[i];
				scope.set(arg, { type: registered.type, data: ["constant", registered.ow] });
			}

			scopes.push(scope);

			const b = analyzeStmt(block);

			scope = scopes.pop()!;

			out.push(["event", name, event.ow, b]);
		}
	}

	return out;
}