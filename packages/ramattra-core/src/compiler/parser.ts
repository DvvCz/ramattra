import * as peggy from "peggy";
import { Type } from "..";

/* c8 ignore next 1: Testing variable check. */
const peg = (template: TemplateStringsArray) => peggy.generate(String.raw(template), process.env.NODE_ENV == "test" ? { allowedStartRules: ["*"] } : undefined);

/**
 * Grammar for PeggyJS
 *
 * Desugaring Syntaxes:
 *  For => While
 *  Method Call => Call
 *  Compound Assignment => Assignment
 */
export const Parser = peg`
{{
	const wrap = (location, data) => {
		return { location, data }
	}
}}

Top =
	_ @(Function / Event / TypeDef)|.., _ ";"? _| _

Function =
	"function" _ name:ident "<" _ generics:((gname:ident _ bound:(":" _ @Type)? { return { name: gname, bound } })|.., _ "," _|) _ ">" _ "(" _ params:(pname:ident ":" _ ptype:Type { return { name: pname, type: ptype } })|.., _ "," _| _ ")" _ "->" _ ret:Type _ block:Block { return wrap(location(), ["function", name, generics, params, ret, block]) }
	/ "function" _ name:ident "(" _ params:(pname:ident ":" _ ptype:Type { return { name: pname, type: ptype } })|.., _ "," _| _ ")" _ "->" _ ret:Type _ block:Block { return wrap(location(), ["function", name, [], params, ret, block]) }

Event =
	"event" _ name:ident _ "(" _ args:ident|.., _ "," _| _ ")" _ block:Block { return wrap(location(), ["event", name, args, block]) }

TypeDef =
	"type" _ name:ident _ "=" _ type:Type { return wrap(location(), ["type", name, type]) }

Block =
	"{" _ stmts:Stmt|.., _ ";"? _| ";"? _ "}" { return wrap(location(), ["block", stmts]) }

Stmt =
	"if" _ cond:Expr _ block:Block { return wrap(location(), ["if", cond, block]) }
	/ "for" _ marker:ident _ "in" _ start:Expr _ ".." _ end:Expr _ block:Block {
		return wrap(location(), ["block", [
			wrap(location(), ["let", marker, null, start, false]),
			wrap(location(), ["while", wrap(location(), ["<", wrap(location(), ["ident", marker]), end]),
				wrap(location(), ["block", [
					block,
					wrap(location(), ["assign", marker, wrap(location(), ["+", wrap(location(), ["ident", marker]), wrap(location(), ["number", 1])])])
				]])
			])
		]])
	}
	/ "while" _ cond:Expr _ block:Block { return wrap(location(), ["while", cond, block]) }
	/ "let" _ name:ident _ type:(":" _ @Type)? _ value:("=" _ @Expr)? { return wrap(location(), ["let", name, type, value, false]) }
	/ "const" _ name:ident _ type:(":" _ @Type)? _ value:("=" _ @Expr)? { return wrap(location(), ["let", name, type, value, true]) }
	/ "return" _ exp:Expr? { return wrap(location(), ["return", exp]) }
	/ action:("continue" / "break") { return wrap(location(), [action]) }
	/ name:ident _ op:("+" / "-" / "*" / "/") "=" _ value:Expr { return wrap(location(), ["assign", name, wrap(location(), [op, wrap(location(), ["ident", name]), value])]) }
	/ name:ident _ "=" _ value:Expr { return wrap(location(), ["assign", name, value]) }
	/ obj:Expr "." index:ident _ "=" _ value:Expr { return wrap(location(), ["iassign", obj, index]) }
	/ obj:BaseExpr "." mname:ident "(" _ args:Expr|.., _ "," _| _ ")" { return wrap(location(), ["call", mname, [obj, ...args]]) }
	/ name:ident "(" _ args:Expr|.., _ "," _| _ ")" { return wrap(location(), ["call", name, args]) }

BaseExpr =
	"(" _ @Expr _ ")"
	/ op:("!" / "typeof") _ expr:Expr { return wrap(location(), [op, expr]) }
	/ '"' inner:[^"]* '"' { return wrap(location(), ["string", inner.join("")]) }
	/ ( "true" / "false" ) { return wrap(location(), ["boolean", text() == "true"]) }
	/ type:("<" @Type ">")? "[" items:Expr|.., _ "," _| "]" { return wrap(location(), ["array", type, items]) }
	/ [0-9]+ "." [0-9]+ { return wrap(location(), ["number", parseFloat(text())]) }
	/ "0b" [0-1]+ { return wrap(location(), ["number", parseInt(text().substring(2), 2)]) }
	/ "0x" [0-9a-fA-F]+ { return wrap(location(), ["number", parseInt(text().substring(2), 16)]) }
	/ [0-9]+ { return wrap(location(), ["number", parseInt(text())]) }
	/ args:ident|.., _ "," _| _ "=>" _ ret:Expr { return wrap(location(), ["lambda", args, ret]) }
	/ ident:ident { return wrap(location(), ["ident", ident]) }

Expr "expression" =
	lhs:BaseExpr _ op:("+" / "-" / "*" / "/" / "==" / "!=" / ">=" / ">" / "<" / "<=" / "||" / "&&") _ rhs:Expr { return wrap(location(), [op, lhs, rhs]) }
	/ obj:BaseExpr "[" _ index:Expr _ "]" { return wrap(location(), ["index", obj, index]) }
	/ obj:BaseExpr "." index:ident !(_ "=" / "(") { return wrap(location(), ["index", obj, wrap(location(), ["string", index]) ]) }
	/ obj:BaseExpr "." mname:ident "(" _ args:Expr|.., _ "," _| _ ")" { return wrap(location(), ["call", mname, [obj, ...args]]) }
	/ name:ident "(" _ args:Expr|.., _ "," _| _ ")" { return wrap(location(), ["call", name, args]) }
	/ BaseExpr

Type "type" =
	types:ArrayType|2.., _ "|" _| { return wrap(location(), { kind: "union", types }) }
	/ ArrayType

ArrayType "type" =
	item:BaseType "[]" { return wrap(location(), { kind: "array", item }) }
	/ BaseType

BaseType =
	"(" _ @Type _ ")"
	/ "..." type:Type { return wrap(location(), { kind: "variadic", type }) }
	/ "fn(" _ params:Type|.., _ "," _| _ ")" ret:(_ "->" _ @Type)? { return wrap(location(), { kind: "function", params, ret: ret ?? { kind: "native", name: "void" } }) }
	/ name:ident { return wrap(location(), { kind: "native", name }) }

ident "identifier" =
	[a-zA-Z_][a-zA-Z0-9_]* { return text() }

comment "comment" =
	("/*" (!("*/") .)* "*/") / ("//" [^\n]+ "\n")

ws "whitespace" =
	[ \t\n\r]+

_ =
	(ws / comment)*
`;

export type Location = {
	source: string,
	start: {
		offset: number,
		line: number,
		column: number
	},
	end: {
		offset: number,
		line: number,
		column: number
	}
}

export type Error = {
	location: Location,
	message: string
}

export type Node<T> = {
	location: Location,
	data: T
}

export type Stmt = Node<StmtData>

export type StmtData =
	["block", Stmt[], null | "loop" | "function"]
	| ["if", Expr, Stmt]
	| ["while", Expr, Stmt]
	| ["let", string, ParsedType | null, Expr | null, boolean]
	| ["assign", string, Expr]
	| ["iassign", Expr, string, Expr]
	| ["call", string, Expr[]]
	| ["return", Expr | null]
	| ["continue"]
	| ["break"]
	// Beyond here are sugar intrinsics
	| ["generic", string, Type];

export type Expr = Node<ExprData>

export type ExprData =
	["+", Expr, Expr] |
	["-", Expr, Expr] |
	["*", Expr, Expr] |
	["/", Expr, Expr] |

	["==", Expr, Expr] |
	["!=", Expr, Expr] |
	[">=", Expr, Expr] |
	[">", Expr, Expr] |
	["<", Expr, Expr] |
	["<=", Expr, Expr] |

	["||", Expr, Expr] |
	["&&", Expr, Expr] |

	["index", Expr, Expr] |
	["call", string, Expr[]] |

	["!", Expr] |
	["typeof", Expr] |

	["ident", string] |
	["string", string] |
	["boolean", boolean] |
	["array", ParsedType | null, Expr[]] |
	["number", number]

export type TypeData =
	{ kind: "native", name: string } |
	{ kind: "array", item: ParsedType } |
	{ kind: "function", params: ParsedType[], ret: ParsedType } |
	{ kind: "variadic", type: ParsedType } |
	{ kind: "generic", name: string, bound?: ParsedType } |
	{ kind: "union", types: ParsedType[] }

export type ParsedType = Node<TypeData>;

export type Function = Node<["function", string, { name: string, bound: ParsedType | null }[], { name: string, type: ParsedType }[], ParsedType, Stmt]>;
export type TypeDef = Node<["type", string, ParsedType]>;
export type Event = Node<["event", string, string[], Stmt]>;

export function parse(src: string): (Function | Event | TypeDef)[] {
	try {
		return Parser.parse(src, { grammarSource: "input.ram" });
	} catch (e: any) {
		throw {
			message: e.message,
			location: e.location
		};
	}
}