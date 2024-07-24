import type { Node } from "./parser";
import { type Type, TypeSolver, reprType, fn, any, variadic, boolean, number, string, array, unknown } from "./typing";

/*
	Replaces all instances of a type in fields with another
	This was made specifically to work with union types.

	TODO: Simplify, if possible
*/

// biome-ignore format: don't ruin it
export type Extend<T, Find, With> = {
	[K in keyof T]: T[K] extends Find
	? (Extend<T[K], Find, With> & With)
	: T[K] extends object
	? Extend<T[K], Find, With>
	: T[K];
}
export type TStmt = Extend<Node, Node, { type?: Type }>;
export type TExpr = Extend<Node, Node, { type: Type }> & { type: Type };

type Scope = Record<string, { ty: Type }>;

export const analyze = (ast: Node): TStmt => {
	const solver = new TypeSolver();

	const expr = (s: Node): TExpr => {
		switch (s.kind) {
			case "+":
			case "-":
			case "*":
			case "/": {
				const lhs = expr(s.lhs);
				const rhs = expr(s.rhs);

				if (!solver.satisfies(lhs.type, rhs.type))
					throw `Cannot ${s.kind} two different types ${reprType(lhs.type)} and ${reprType(rhs.type)}`;

				return { kind: s.kind, lhs, rhs, type: lhs.type, span: s.span };
			}

			case "&&":
			case "||":
			case "==":
			case "!=": {
				const lhs = expr(s.lhs);
				const rhs = expr(s.rhs);

				if (!solver.satisfies(lhs.type, rhs.type))
					throw `Cannot ${s.kind} two different types ${reprType(lhs.type)} and ${reprType(rhs.type)}`;

				return { kind: s.kind, lhs, rhs, type: boolean, span: s.span };
			}

			case "!":
				return { kind: s.kind, obj: expr(s.obj), type: boolean, span: s.span };

			case "number":
				return { kind: s.kind, val: s.val, type: number, span: s.span };
			case "string":
				return { kind: s.kind, val: s.val, type: string, span: s.span };
			case "boolean":
				return { kind: s.kind, val: s.val, type: boolean, span: s.span };
			case "array": {
				let ty: Type = unknown;

				const out = [];
				for (const item of s.val) {
					const e = expr(item);
					if (ty !== unknown) {
						if (!solver.satisfies(e.type, ty))
							throw `Array can only hold one type ${reprType(e.type)} vs ${reprType(ty)}`;
					} else {
						ty = e.type;
					}
					out.push(e);
				}

				return { kind: s.kind, val: out, type: array(ty), span: s.span };
			}

			case "call": {
				const fn = expr(s.fn);
				if (fn.type.kind !== "function")
					throw `Cannot call a ${reprType(fn.type)}`;

				// Provided more args than has
				if (s.args.length > fn.type.params.length && fn.type.params?.[fn.type.params.length].kind !== "variadic") {
					throw `Unexpected argument #${fn.type.params.length + 1}`;
				} else if (s.args.length < fn.type.params.length && fn.type.params[s.args.length + 1].kind !== "variadic") {
					throw `Expected another argument`
				}

				const args = s.args.map(expr);

				for (const [i, arg] of args.entries()) {
					const expected = fn.type.params[i];

					if (!solver.satisfies(arg.type, expected)) {
						throw `Argument #${i} doesn't satisfy ${reprType(expected)}`
					}
				}

				return { kind: s.kind, type: fn.type.ret, args, fn, span: s.span };
			}

			default:
				throw `wtf? ${s}`;
		}
	};

	let scope: Scope;
	const scopes = <Scope[]>[];

	const stmt = (s: Node): TStmt => {
		switch (s.kind) {
			case "scope": {
				const stmts = [];

				scopes.push((scope = {}));
				for (const statement of s.stmts) stmts.push(stmt(statement));
				scopes.pop();

				return { kind: "scope", stmts, span: s.span };
			}

			case "if":
				return { kind: "if", cond: expr(s.cond), block: stmt(s.block), span: s.span };

			case "let": {
				if (!s.val && !s.hint) throw `Cannot declare variable ${s.name} without type, or value`;

				if (s.val) {
					const e = expr(s.val);

					if (s.hint && !solver.satisfies(e.type, s.hint))
						throw `Declaring variable with incorrect type: ${reprType(e.type)} (expected ${reprType(
							s.hint,
						)})`;

					scope[s.name] = { ty: e.type };

					return { kind: "let", name: s.name, val: e, span: s.span };
				}

				scope[s.name] = { ty: s.hint! };
				return { kind: "let", name: s.name, hint: s.hint, span: s.span };
			}

			case "assign":
				throw "todo";

			case "call": {
				const exp = expr(s.fn);

				if (!solver.satisfies(exp.type!, fn([variadic(any)], any))) {
					throw "Calling non function";
				}

				throw "what";
			}

			default:
				throw `?? ${s.kind}`;
		}
	};

	return stmt(ast);
};
