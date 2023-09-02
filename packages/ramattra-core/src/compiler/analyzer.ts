import { EVENTS, CONSTANTS, FUNCTIONS } from "./std.js";
import { parse, Node, Stmt, Expr, ExprData, StmtData } from "./parser.js";
import { Type, TypeSolver, any, array, boolean, native, nothing, number, reprType, string } from "./typing.js";

export type IRStmt =
	["block", IRStmt[]]
	| ["if", IRExpr, IRStmt]
	| ["while", IRExpr, IRStmt]
	| ["let", number, Type, IRExpr]
	| ["assign", number, IRExpr]
	| ["iassign", IRExpr, string, IRExpr]
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
	["array", Type | null, IRExpr[]] |
	["number", number]

export type IREvent =
	["event", string, string, IRStmt];

type Scope = Map<string, IRExpr>;

function error(e: Node<any>, message: string): never {
	throw {
		message,
		location: e.location
	}
}

function sugar(e: Node<any>, data: ExprData): Expr;
function sugar(e: Node<any>, data: StmtData): Stmt;

function sugar(e: Node<any>, data: ExprData | StmtData) {
	return { location: e.location, data }
}

export function analyze(src: string): IREvent[] {
	const ast = parse(src);

	let scope: Scope = new Map();
	const interner = new Map<string, number>();
	const scopes = [scope];

	const userfunctions: Map<string, { args: { type: Type, name: string, default?: string }[], ret: Type, block: Stmt }> = new Map();
	const usertypes: Map<string, Type> = new Map();

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

	const analyzeExpr = (expr: Expr, stmts: IRStmt[]): IRExpr => {
		const kind = expr.data[0];
		const solver = new TypeSolver();

		if (kind == "+") {
			const [lhs, rhs] = [analyzeExpr(expr.data[1], stmts), analyzeExpr(expr.data[2], stmts)];

			if (!solver.satisfies(lhs.type, rhs.type))
				error(expr, `Cannot perform ${kind} operation on differing types (${reprType(lhs.type)} and ${reprType(rhs.type)})`);

			if (lhs.type.kind != "native" || (lhs.type.name != "number" && lhs.type.name != "string"))
				error(expr, `Can only add numbers and strings`);

			return { type: lhs.type, data: [kind, lhs, rhs] };
		} else if (kind == "-" || kind == "*" || kind == "/") {
			const [lhs, rhs] = [analyzeExpr(expr.data[1], stmts), analyzeExpr(expr.data[2], stmts)];

			if (!solver.satisfies(lhs.type, rhs.type))
				error(expr, `Cannot perform ${kind} operation on differing types (${reprType(lhs.type)} and ${reprType(rhs.type)})`);

			if (!solver.satisfies(lhs.type, number))
				error(expr, `Cannot perform ${kind} operation on non-numeric expressions`);

			return { type: number, data: [kind as any, lhs, rhs] };
		} else if (kind == "==" || kind == "!=" || kind == ">=" || kind == ">" || kind == "<" || kind == "<=") {
			const [lhs, rhs] = [analyzeExpr(expr.data[1], stmts), analyzeExpr(expr.data[2], stmts)]

			if (!solver.satisfies(lhs.type, rhs.type))
				error(expr, `Cannot perform ${kind} operation on differing types (${reprType(lhs.type)} and ${reprType(rhs.type)})`);

			return { type: boolean, data: [kind as any, lhs, rhs] };
		} else if (kind == "||" || kind == "&&") {
			const [lhs, rhs] = [analyzeExpr(expr.data[1], stmts), analyzeExpr(expr.data[2], stmts)]

			if (!solver.satisfies(lhs.type, rhs.type))
				error(expr, `Cannot perform ${kind} operation on expressions of differing types (${reprType(lhs.type)} and ${reprType(rhs.type)})`);

			if (!solver.satisfies(lhs.type, boolean))
				error(expr, `Cannot perform ${kind} operation on non-boolean expressions`);

			return { type: boolean, data: [kind as any, lhs, rhs] };
		} else if (kind == "index") {
			const [obj, index] = [analyzeExpr(expr.data[1], stmts), analyzeExpr(expr.data[2], stmts)];

			if (!solver.satisfies(array(any), obj.type))
				error(expr, `Cannot index type of ${reprType(obj.type)}`);

			if (!solver.satisfies(index.type, number))
				error(expr, `Can only index an array with a number`);

			// TODO: Make satisfies signature deduce type as array, if possible
			return { type: (obj.type as any).item, data: [kind, obj, index] };
		} else if (kind == "call") {
			const [name, args] = [expr.data[1], expr.data[2]];

			const fn = FUNCTIONS[name];
			if (fn) {
				const iargs = args.map(a => analyzeExpr(a, stmts));
				const types = iargs.map(a => a.type);

				for (const expected of fn.args) {
					if (types.length == 0) {
						if (expected.default) {
							iargs.push({ type: expected.type, data: ["constant", expected.default] });
							continue;
						} else {
							error(expr, `Not enough arguments passed to ${name}, expected ${reprType(expected.type)}`);
						}
					}

					const given = types.shift()!;
					if (!solver.satisfies(expected.type, given))
						error(expr, `Expected ${reprType(expected.type)}, got ${reprType(given)}`)
				}

				return { type: fn.ret ?? nothing, data: ["call", fn.ow, iargs] };
			} else {
				const ufn = userfunctions.get(name);

				if (!ufn)
					error(expr, `No such function ${name}`);

				const desugared: Stmt[] = [
					sugar(expr, ["let", "__returnval__", ufn.ret, null]),
					...ufn.args.map((arg, i) =>
						sugar(expr, ["let", arg.name, arg.type, args[i]])
					),
					...ufn.block.data[1] as Stmt[]
				];

				desugared.forEach(s => stmts.push(analyzeStmt(s, stmts)));
				return analyzeExpr(sugar(expr, ["ident", "__returnval__"]), stmts);
			}
		} else if (kind == "!") {
			return { type: boolean, data: [kind, analyzeExpr(expr.data[1], stmts)] };
		} else if (kind == "typeof") {
			const value = analyzeExpr(expr.data[1], stmts);
			return { type: string, data: ["string", reprType(value.type)] };
		} else if (kind == "string" || kind == "boolean" || kind == "number") {
			return { type: native(kind), data: [kind as any, expr.data[1]] };
		} else if (kind == "array") {
			const values = expr.data[2].map(a => analyzeExpr(a, stmts));
			let type = expr.data[1];

			for (const value of values) {
				if (!type) {
					type = value.type;
				} else if (!solver.satisfies(value.type, type)) {
					error(expr, `Array of type ${reprType(type)} cannot also hold a ${reprType(value.type)} type.`);
				}
			}

			if (!type)
				error(expr, `Empty array must be given a tagged type <T>`);

			return { type: array(type), data: [kind, expr.data[1], expr.data[2].map(a => analyzeExpr(a, stmts))] };
		} else if (kind == "ident") {
			const v = lookupVariable(expr.data[1]);
			if (!v)
				error(expr, `Variable ${expr.data[1]} is not defined.`);
			return v;
		}

		return kind;
	};

	const analyzeStmt = (statement: Stmt, stmts: IRStmt[]): IRStmt => {
		const kind = statement.data[0];
		const solver = new TypeSolver();

		if (kind == "block") {
			scope = new Map();

			scopes.push(scope);
			const out: IRStmt[] = [];

			for (const stmt of statement.data[1])
				out.push(analyzeStmt(stmt, out));

			scope = scopes.pop()!;

			return ["block", out];
		} else if (kind == "if") {
			return ["if", analyzeExpr(statement.data[1], stmts), analyzeStmt(statement.data[2], stmts)];
		} else if (kind == "while") {
			return ["while", analyzeExpr(statement.data[1], stmts), analyzeStmt(statement.data[2], stmts)];
		} else if (kind == "let") {
			const [name, expr] = [statement.data[1], statement.data[3] && analyzeExpr(statement.data[3], stmts)];
			const type = statement.data[2] || expr?.type;

			if (!type)
				error(statement, `Cannot declare variable without an expression or type annotation`);

			if (scope.has(name))
				error(statement, `Cannot redeclare existing variable ${name}`);

			if (expr && !solver.satisfies(type, expr.type))
				error(statement, `Declaration annotated as type ${reprType(type)} cannot be given expression of type ${reprType(expr.type)}`);

			if (interner.size >= 1000)
				error(statement, `Cannot use more than 1000 variables, for now.`);

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
			const [name, expr] = [statement.data[1], analyzeExpr(statement.data[2], stmts)];

			const v = lookupVariable(name);
			if (!v)
				error(statement, `Variable ${name} has not been declared. Maybe you meant let ${name}?`);

			if (!solver.satisfies(v.type, expr.type))
				error(statement, `Cannot assign value of ${reprType(expr.type)} to variable of type ${reprType(v.type)}`);

			if (v.data[0] == "constant")
				error(statement, `Cannot assign to constant ${name}`);

			return ["assign", v.data[1] as number, expr];
		} else if (kind == "call") {
			const [name, args] = [statement.data[1], statement.data[2]];

			const fn = FUNCTIONS[name];
			if (fn) {
				const iargs = args.map(a => analyzeExpr(a, stmts));
				const types = iargs.map(a => a.type);

				for (const expected of fn.args) {
					if (types.length == 0) {
						if (expected.default) {
							iargs.push({ type: expected.type, data: ["constant", expected.default] });
							continue;
						} else {
							error(statement, `Not enough arguments passed to ${name}, expected ${reprType(expected.type)}`);
						}
					}

					const given = types.shift()!;
					if (!solver.satisfies(expected.type, given))
						error(statement, `Expected ${reprType(expected.type)}, got ${reprType(given)}`)
				}

				return ["call", fn.ow, iargs];
			} else {
				const ufn = userfunctions.get(name);

				if (!ufn)
					error(statement, `No such function ${name}`);

				const desugared: Stmt[] = [
					sugar(statement, ["let", "__returnval__", ufn.ret, null]),
					...ufn.args.map((arg, i) =>
						sugar(statement, ["let", arg.name, arg.type, args[i]])
					),
					...ufn.block.data[1] as Stmt[]
				];

				return analyzeStmt(sugar(statement, ["block", desugared]), stmts);
			}
		} else if (kind == "iassign") {
			const [obj, index, value] = [analyzeExpr(statement.data[1], stmts), statement.data[2], analyzeExpr(statement.data[3], stmts)];

			if (!solver.satisfies(obj.type, native("player")))
				error(statement, `Can only use indexing assignment on player`);

			return ["iassign", obj, index, value];
		} else if (kind == "return") {
			const exp = statement.data[1];
			if (!exp)
				error(statement, `Currently can only return with an expression`);

			return analyzeStmt({ location: statement.location, data: ["assign", "__returnval__", exp] }, stmts);
		}

		return kind; // return "never", mark as unreachable.
	};

	const out: IREvent[] = [];
	for (const obj of ast) {
		const kind = obj.data[0];
		if (kind == "function") {
			const [, name, params, ret, block] = obj.data;
			userfunctions.set(name, { args: params, ret, block });
		} else if (kind == "event") {
			const [, name, args, block] = obj.data;

			const event = EVENTS[name];

			if (!event)
				error(obj, `Event ${name} does not exist.`);

			if (event.args.length != args.length)
				error(obj, `Event ${name} has ${event.args.length} arguments.`);

			scope = new Map();
			for (const [i, arg] of args.entries()) {
				const registered = event.args[i];
				scope.set(arg, { type: registered.type, data: ["constant", registered.ow] });
			}

			scopes.push(scope);

			const b = analyzeStmt(block, []);

			scope = scopes.pop()!;

			out.push(["event", name, event.ow, b]);
		} else if (kind == "type") {
			const [, name, type] = obj.data;
			usertypes.set(name, type);
		}
	}

	return out;
}