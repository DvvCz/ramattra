import { EVENTS, CONSTANTS, FUNCTIONS } from "./std.js";
import { parse, Stmt, Expr } from "./parser.js";
import { Type, TypeSolver, any, array, boolean, native, nothing, number, reprType, string } from "./typing.js";

export type IRStmt =
	["block", IRStmt[]]
	| ["if", IRExpr, IRStmt]
	| ["while", IRExpr, IRStmt]
	| ["let", number, Type, IRExpr]
	| ["assign", number, IRExpr]
	| ["call", string, IRExpr[]]
	| ["noop"]

export type IRExpr =
	{ type: Type, data: IRExprData }

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

export function analyze(src: string): IREvent[] {
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
		const kind = expr.data[0];
		const solver = new TypeSolver();

		if (kind == "+") {
			const [lhs, rhs] = [analyzeExpr(expr.data[1]), analyzeExpr(expr.data[2])];

			if (!solver.satisfies(lhs.type, rhs.type))
				expr.throw(`Cannot perform ${kind} operation on differing types (${reprType(lhs.type)} and ${reprType(rhs.type)})`);

			if (lhs.type.kind != "native" || (lhs.type.name != "number" && lhs.type.name != "string"))
				expr.throw(`Can only add numbers and strings`);

			return { type: lhs.type, data: [kind, lhs, rhs] };
		} else if (kind == "-" || kind == "*" || kind == "/") {
			const [lhs, rhs] = [analyzeExpr(expr.data[1]), analyzeExpr(expr.data[2])];

			if (!solver.satisfies(lhs.type, rhs.type))
				expr.throw(`Cannot perform ${kind} operation on differing types (${reprType(lhs.type)} and ${reprType(rhs.type)})`);

			if (!solver.satisfies(lhs.type, number))
				expr.throw(`Cannot perform ${kind} operation on non-numeric expressions`);

			return { type: number, data: [kind as any, lhs, rhs] };
		} else if (kind == "==" || kind == "!=" || kind == ">=" || kind == ">" || kind == "<" || kind == "<=") {
			const [lhs, rhs] = [analyzeExpr(expr.data[1]), analyzeExpr(expr.data[2])]

			if (!solver.satisfies(lhs.type, rhs.type))
				expr.throw(`Cannot perform ${kind} operation on differing types (${reprType(lhs.type)} and ${reprType(rhs.type)})`);

			return { type: boolean, data: [kind as any, lhs, rhs] };
		} else if (kind == "||" || kind == "&&") {
			const [lhs, rhs] = [analyzeExpr(expr.data[1]), analyzeExpr(expr.data[2])]

			if (!solver.satisfies(lhs.type, rhs.type))
				expr.throw(`Cannot perform ${kind} operation on expressions of differing types (${reprType(lhs.type)} and ${reprType(rhs.type)})`);

			if (!solver.satisfies(lhs.type, boolean))
				expr.throw(`Cannot perform ${kind} operation on non-boolean expressions`);

			return { type: boolean, data: [kind as any, lhs, rhs] };
		} else if (kind == "index") {
			const [obj, index] = [analyzeExpr(expr.data[1]), analyzeExpr(expr.data[2])];

			if (!solver.satisfies(obj.type, array(any)))
				expr.throw(`Cannot index non array type`);

			if (!solver.satisfies(index.type, number))
				expr.throw(`Can only index an array with a number`);

			// TODO: Make satisfies signature deduce type as array, if possible
			return { type: (obj.type as any).item, data: [kind, obj, index] };
		} else if (kind == "call") {
			const [name, args] = [expr.data[1], expr.data[2].map(analyzeExpr)];

			const types = args.map(a => a.type);
			const solver = new TypeSolver();

			const fn = FUNCTIONS[name];
			if (!fn)
				expr.throw(`No such function ${name}(${types.map(reprType).join(", ")})`);

			for (const expected of fn.args) {
				if (types.length == 0) {
					if (expected.default) {
						args.push({ type: expected.type, data: ["constant", expected.default] });
						continue;
					} else if (expected.type.kind == "variadic") {
						break;
					} else {
						expr.throw(`Not enough arguments passed to ${name}, expected ${expected.type}`);
					}
				}

				const given = types.shift()!;
				if (!solver.satisfies(expected.type, given))
					expr.throw(`Expected ${expected.type}, got ${given}`)
			}

			return { type: fn.ret ?? nothing, data: ["call", fn.ow, args] };
		} else if (kind == "!") {
			return { type: boolean, data: [kind, analyzeExpr(expr.data[1])] };
		} else if (kind == "typeof") {
			const value = analyzeExpr(expr.data[1]);
			return { type: string, data: ["string", reprType(value.type)] };
		} else if (kind == "string" || kind == "boolean" || kind == "number") {
			return { type: native(kind), data: [kind as any, expr.data[1]] };
		} else if (kind == "array") {
			const [type, values] = [expr.data[1], expr.data[2].map(analyzeExpr)];

			let ty = type && <Type>native(type); // TODO: Parse type properly
			for (const value of values) {
				if (!ty) {
					ty = value.type;
				} else if (!solver.satisfies(value.type, ty)) {
					expr.throw(`Array of type ${reprType(ty)} cannot also hold a ${reprType(value.type)} type.`);
				}
			}

			if (!ty)
				expr.throw(`Empty array must be given a tagged type <T>`);

			return { type: array(ty), data: [kind, expr.data[1], expr.data[2].map(analyzeExpr)] };
		} else if (kind == "ident") {
			const v = lookupVariable(expr.data[1]);
			if (!v)
				expr.throw(`Variable ${expr.data[1]} is not defined.`);
			return v;
		}

		return kind;
	};

	const analyzeStmt = (statement: Stmt): IRStmt => {
		const kind = statement.data[0];
		const solver = new TypeSolver();

		if (kind == "block") {
			scope = new Map();

			scopes.push(scope);
			const out = statement.data[1].map(analyzeStmt);
			scope = scopes.pop()!;

			return ["block", out];
		} else if (kind == "if") {
			return ["if", analyzeExpr(statement.data[1]), analyzeStmt(statement.data[2])];
		} else if (kind == "while") {
			return ["while", analyzeExpr(statement.data[1]), analyzeStmt(statement.data[2])];
		} else if (kind == "let") {
			const [name, expr] = [statement.data[1], statement.data[3] && analyzeExpr(statement.data[3])];
			const type = statement.data[2] ? native(statement.data[2]) : expr?.type; // TODO: Parse type properly

			if (!type)
				statement.throw(`Cannot declare variable without an expression or type annotation`);

			if (scope.has(name))
				statement.throw(`Cannot redeclare existing variable ${name}`);

			if (expr && !solver.satisfies(type, expr.type))
				statement.throw(`Declaration annotated as type ${reprType(type)} cannot be given expression of type ${reprType(expr.type)}`);

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
			const [name, expr] = [statement.data[1], analyzeExpr(statement.data[2])];

			const v = lookupVariable(name);
			if (!v)
				statement.throw(`Variable ${name} has not been declared. Maybe you meant let ${name}?`);

			if (v.type != expr.type)
				statement.throw(`Cannot assign value of ${expr.type} to variable of type ${v.type}`);

			if (v.data[0] == "constant")
				statement.throw(`Cannot assign to constant ${name}`);

			return ["assign", v.data[1] as number, expr];
		} else if (kind == "call") {
			const [name, args] = [statement.data[1], statement.data[2].map(analyzeExpr)];

			const types = args.map(a => a.type);
			const solver = new TypeSolver();

			const fn = FUNCTIONS[name];
			if (!fn)
				statement.throw(`No such function ${name}(${types.map(reprType).join(", ")})`);

			for (const expected of fn.args) {
				if (types.length == 0) {
					if (expected.default) {
						args.push({ type: expected.type, data: ["constant", expected.default] });
						continue;
					} else {
						statement.throw(`Not enough arguments passed to ${name}, expected ${expected.type}`);
					}
				}

				const given = types.shift()!;
				if (!solver.satisfies(expected.type, given))
					statement.throw(`Expected ${expected.type}, got ${given}`)
			}

			return ["call", fn.ow, args];
		}

		return kind; // return "never", mark as unreachable.
	};

	const out: IREvent[] = [];
	for (const obj of ast) {
		if (obj.data[0] == "function") {
			const [, _name, _params, _block] = obj.data;
			throw {
				location: {
					start: { column: 1, line: 1 },
					end: { column: 1, line: 1 }
				},
				message: "TODO: Functions"
			}
		} else {
			const [, name, args, block] = obj.data;

			const event = EVENTS[name];

			if (!event)
				obj.throw(`Event ${name} does not exist.`);

			if (event.args.length != args.length)
				obj.throw(`Event ${name} has ${event.args.length} arguments.`);

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