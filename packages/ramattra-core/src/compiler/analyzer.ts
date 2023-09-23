import { EVENTS, CONSTANTS, FUNCTIONS } from "./std.js";
import { parse, Node, Stmt, Expr, ExprData, StmtData, ParsedType } from "./parser.js";
import { Type, TypeSolver, any, array, boolean, generic, native, nothing, number, reprType, string } from "../typing.js";

export type IRStmt =
	["block", IRStmt[]]
	| ["if", IRExpr, IRStmt]
	| ["while", IRExpr, IRStmt]
	| ["let", number, Type, IRExpr]
	| ["assign", number, IRExpr]
	| ["iassign", IRExpr, string, IRExpr]
	| ["call", string, IRExpr[]]
	| ["break"]
	| ["continue"]

	// Beyond here are compiler operations
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
	["array", Type, IRExpr[]] |
	["number", number]

export type IREvent =
	["event", string, string, IRStmt];

type Scope = {
	kind?: null | "loop" | "function",
	variables: Map<string, { const: boolean, expr: IRExpr }>,
	types: Map<string, Type>
};

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

	const types = new Map([
		["number", number],
		["string", string],
		["player", native("player")],
		["void", nothing]
	]);

	let scope = <Scope>{ variables: new Map(), types };
	const interner = new Map<string, number>();
	const scopes = [scope];

	const userfunctions: Map<string, { args: { type: ParsedType, name: string, default?: string }[], generics: { name: string, bound: null | Type }[], ret: ParsedType, block: Stmt }> = new Map();

	const lookupKind = (kind: Scope["kind"]): boolean =>
		scopes.find(i => i.kind == kind) !== undefined;

	const lookupVariable = (name: string): { const: boolean, expr: IRExpr } | undefined => {

		for (let i = scopes.length - 1; i >= 0; i--) {
			const scope = scopes[i];
			const value = scope.variables.get(name);

			if (value)
				return value;
		}

		const constant = CONSTANTS[name];
		if (constant)
			return { const: true, expr: { type: constant.type, data: ["constant", constant.ow] } }
	};

	const lookupType = (name: string): Type | undefined => {
		for (let i = scopes.length - 1; i >= 0; i--) {
			const scope = scopes[i];
			const value = scope.types.get(name);

			if (value)
				return value;
		}
	};

	const solver = new TypeSolver();

	const analyzeExpr = (expr: Expr, stmts: IRStmt[]): IRExpr => {
		const kind = expr.data[0];

		if (kind == "+") {
			const [lhs, rhs] = [analyzeExpr(expr.data[1], stmts), analyzeExpr(expr.data[2], stmts)];

			if (!solver.satisfies(lhs.type, rhs.type))
				error(expr, `Cannot perform ${kind} operation on differing types (${reprType(lhs.type)} and ${reprType(rhs.type)})`);

			if (!solver.satisfies(lhs.type, number) && !solver.satisfies(lhs.type, string))
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

			return { type: (solver.resolve(obj.type) as any).item, data: [kind, obj, index] };
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

				console.log(name, "1");

				stmts.push(analyzeStmt(sugar(expr, ["let", "__returnval__", ufn.ret, null, false]), stmts));

				console.log(name);

				const inner = sugar(expr, ["block", [
					...ufn.generics.map(g =>
						sugar(expr, ["generic", g.name, generic(g.name, g.bound ?? undefined)])
					),
					...ufn.args.map((arg, i) =>
						sugar(expr, ["let", arg.name, arg.type, args[i], true])
					),
					...ufn.block.data[1] as Stmt[]
				], "function"]);

				stmts.push(analyzeStmt(inner, stmts));

				console.log(name, "b4");

				const x = analyzeExpr(sugar(expr, ["ident", "__returnval__"]), stmts);
				// ufn.generics.forEach(g => solver.deleteGeneric(g.name));

				return x;
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
			let type = expr.data[1] && analyzeType(expr.data[1]);

			for (const value of values) {
				if (!type) {
					type = value.type;
				} else if (!solver.satisfies(value.type, type)) {
					error(expr, `Array of type ${reprType(type)} cannot also hold a ${reprType(value.type)} type.`);
				}
			}

			if (!type)
				error(expr, `Empty array must be given a tagged type <T>`);

			return { type: array(type), data: [kind, type, expr.data[2].map(a => analyzeExpr(a, stmts))] };
		} else if (kind == "ident") {
			const v = lookupVariable(expr.data[1]);
			if (!v)
				error(expr, `Variable ${expr.data[1]} is not defined.`);
			return v.expr;
		}

		return kind;
	};

	const analyzeStmt = (statement: Stmt, stmts: IRStmt[]): IRStmt => {
		const kind = statement.data[0];

		if (kind == "block") {
			scope = { kind: statement.data[2], variables: new Map(), types: new Map() };

			scopes.push(scope);
			const out: IRStmt[] = [];

			for (const stmt of statement.data[1])
				out.push(analyzeStmt(stmt, out));

			scope = scopes.pop()!;

			return ["block", out];
		} else if (kind == "if") {
			return ["if", analyzeExpr(statement.data[1], stmts), analyzeStmt(statement.data[2], stmts)];
		} else if (kind == "while") {
			const [, exp, block] = statement.data;
			block.data[2] = "loop";
			return ["while", analyzeExpr(exp, stmts), analyzeStmt(block, stmts)];
		} else if (kind == "let") {
			const [name, expr, immutable] = [statement.data[1], statement.data[3] && analyzeExpr(statement.data[3], stmts), statement.data[4]];
			const type = statement.data[2] ? analyzeType(statement.data[2]) : expr?.type;

			if (!type)
				error(statement, `Cannot declare variable without an expression or type annotation`);

			if (scope.variables.has(name))
				error(statement, `Cannot redeclare existing variable ${name}`);

			if (expr && !solver.satisfies(type, expr.type))
				error(statement, `Declaration annotated as type ${reprType(solver.resolve(type))} cannot be given expression of type ${reprType(expr.type)}`);

			if (interner.size >= 1000)
				error(statement, `Cannot use more than 1000 variables, for now.`);

			const [str, id] = [`${name}${scopes.length}`, interner.size];
			if (!interner.has(str))
				interner.set(str, id);

			scope.variables.set(name, { const: immutable, expr: { type, data: ["ident", id] } });

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

			if (!solver.satisfies(v.expr.type, expr.type))
				error(statement, `Cannot assign value of ${reprType(expr.type)} to variable of type ${reprType(v.expr.type)}`);

			if (v.const)
				error(statement, `Cannot assign to constant ${name}`);

			return ["assign", v.expr.data[1] as number, expr];
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

				for (const gen of ufn.generics)
					scope.types.set(gen.name, generic(gen.name, gen.bound ?? undefined));

				const desugared: Stmt[] = [
					sugar(statement, ["let", "__returnval__", ufn.ret, null, false]),
					...ufn.args.map((arg, i) =>
						sugar(statement, ["let", arg.name, arg.type, args[i], true])
					),
					...ufn.block.data[1] as Stmt[]
				];

				return analyzeStmt(sugar(statement, ["block", desugared, "function"]), stmts);
			}
		} else if (kind == "iassign") {
			const [obj, index, value] = [analyzeExpr(statement.data[1], stmts), statement.data[2], analyzeExpr(statement.data[3], stmts)];

			if (!solver.satisfies(obj.type, native("player")))
				error(statement, `Can only use indexing assignment on player`);

			return ["iassign", obj, index, value];
		} else if (kind == "return") {
			if (!lookupKind("function"))
				error(statement, `Cannot return outside of a function`);

			const exp = statement.data[1];
			if (!exp)
				error(statement, `Currently can only return with an expression`);

			return analyzeStmt({ location: statement.location, data: ["assign", "__returnval__", exp] }, stmts);
		} else if (kind == "break") {
			if (!lookupKind("loop"))
				error(statement, `Cannot break outside of a loop`);

			return ["break"];
		} else if (kind == "continue") {
			if (!lookupKind("loop"))
				error(statement, `Cannot continue outside of a loop`);

			error(statement, "Unimplemented: continue");
		} else if (kind == "generic") {
			const [, name, ty] = statement.data;
			scope.types.set(name, ty);
			return ["noop"];
		}

		return kind; // return "never", mark as unreachable.
	};

	const analyzeType = (t: ParsedType): Type => {
		switch (t.data.kind) {
			case "native":
				const ty = lookupType(t.data.name);
				if (!ty) error(t, `Unknown type ${t.data.name}`);
				return ty;
			case "generic":
				throw `Hm`;
			case "function":
				const params = t.data.params.map(analyzeType);
				const ret = analyzeType(t.data.ret);
				return { kind: "function", params, ret };
			case "variadic":
				return { kind: "variadic", type: analyzeType(t.data.type) };
			case "array":
				return { kind: "array", item: analyzeType(t.data.item) };
			case "union":
				return { kind: "union", types: t.data.types.map(t => analyzeType(t)) };
		}
	};


	const out: IREvent[] = [];
	for (const obj of ast) {
		const kind = obj.data[0];
		if (kind == "function") {
			const name = obj.data[1];
			const generics = obj.data[2].map(g => { return { name: g.name, bound: g.bound && analyzeType(g.bound) } });
			const args = obj.data[3];
			const ret = obj.data[4];
			const block = obj.data[5];

			block.data[2] = "function";

			userfunctions.set(name, { args, ret, generics, block });
		} else if (kind == "event") {
			const [, name, args, block] = obj.data;

			const event = EVENTS[name];

			if (!event)
				error(obj, `Event ${name} does not exist.`);

			if (event.args.length != args.length)
				error(obj, `Event ${name} has ${event.args.length} arguments.`);

			scope = { variables: new Map(), types: new Map() };
			for (const [i, arg] of args.entries()) {
				const registered = event.args[i];
				scope.variables.set(arg, { const: true, expr: { type: registered.type, data: ["constant", registered.ow] } });
			}

			scopes.push(scope);

			const b = analyzeStmt(block, []);

			scope = scopes.pop()!;

			out.push(["event", name, event.ow, b]);
		} else if (kind == "type") {
			const [, name, type] = obj.data;
			scope.types.set(name, analyzeType(type));
		}
	}

	return out;
}