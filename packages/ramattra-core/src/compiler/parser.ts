import * as peggy from "peggy";

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
	class Node {
		constructor(location, data) {
			this.location = location;
			this.data = data;
		}

		throw(msg) {
			throw {
				location: this.location,
				message: msg
			}
		}
	}
}}

Top =
	_ @(Function / Event)|.., _| _

Function =
	"function" _ name:ident "(" _ params:ident|.., _ "," _| _ ")" _ block:Block { return new Node(location(), ["function", name, params, block]) }

Event =
	"event" _ name:ident _ "(" _ args:ident|.., _ "," _| _ ")" _ block:Block { return new Node(location(), ["event", name, args, block]) }

Block =
	"{" _ stmts:Stmt|.., _ ";"? _| ";"? _ "}" { return new Node(location(), ["block", stmts]) }

Stmt =
	"if" _ cond:Expr _ block:Block { return new Node(location(), ["if", cond, block]) }
	/ "for" _ marker:ident _ "in" _ start:Expr _ ".." _ end:Expr _ block:Block {
		return new Node(location(), ["block", [
			new Node(location(), ["let", marker, "number", start]),
			new Node(location(), ["while", new Node(location(), ["<", new Node(location(), ["ident", marker]), end]), block])
		]])
	}
	/ "while" _ cond:Expr _ block:Block { return new Node(location(), ["while", cond, block]) }
	/ "let" _ name:ident _ type:(":" _ @ident)? _ value:("=" _ @Expr)? { return new Node(location(), ["let", name, type, value]) }
	/ name:ident _ op:("+" / "-" / "*" / "/") "=" _ value:Expr { return new Node(location(), ["assign", name, new Node(location(), [op, new Node(location(), ["ident", name]), value])]) }
	/ name:ident _ "=" _ value:Expr { return new Node(location(), ["assign", name, value]) }
	/ obj:Expr "." index:ident _ "=" _ value:Expr { return new Node(location(), ["iassign", obj, index]) }
	/ obj:BaseExpr "." mname:ident "(" _ args:Expr|.., _ "," _| _ ")" { return new Node(location(), ["call", mname, [obj, ...args]]) }
	/ name:ident "(" _ args:Expr|.., _ "," _| _ ")" { return new Node(location(), ["call", name, args]) }

BaseExpr =
	"(" _ @Expr _ ")"
	/ op:("!" / "typeof") _ expr:Expr { return new Node(location(), [op, expr]) }
	/ '"' inner:[^"]+ '"' { return new Node(location(), ["string", inner.join("")]) }
	/ ( "true" / "false" ) { return new Node(location(), ["boolean", text() == "true"]) }
	/ type:("<" @ident ">")? "[" items:Expr|.., _ "," _| "]" { return new Node(location(), ["array", type, items]) }
	/ [0-9]+ "." [0-9]+ { return new Node(location(), ["number", parseFloat(text())]) }
	/ "0b" [0-1]+ { return new Node(location(), ["number", parseInt(text().substring(2), 2)]) }
	/ "0x" [0-9a-fA-F]+ { return new Node(location(), ["number", parseInt(text().substring(2), 16)]) }
	/ [0-9]+ { return new Node(location(), ["number", parseInt(text())]) }
	/ args:ident|.., _ "," _| _ "=>" _ ret:Expr { return new Node(location(), ["lambda", args, ret]) }
	/ ident:ident { return new Node(location(), ["ident", ident]) }

Expr "expression" =
	lhs:BaseExpr _ op:("+" / "-" / "*" / "/" / "==" / "!=" / ">=" / ">" / "<" / "<=" / "||" / "&&") _ rhs:Expr { return new Node(location(), [op, lhs, rhs]) }
	/ obj:BaseExpr "[" _ index:Expr _ "]" { return new Node(location(), ["index", obj, index]) }
	/ obj:BaseExpr "." index:ident !(_ "=" / "(") { return new Node(location(), ["index", obj, new Node(location(), ["string", index]) ]) }
	/ obj:BaseExpr "." mname:ident "(" _ args:Expr|.., _ "," _| _ ")" { return new Node(location(), ["call", mname, [obj, ...args]]) }
	/ name:ident "(" _ args:Expr|.., _ "," _| _ ")" { return new Node(location(), ["call", name, args]) }
	/ BaseExpr

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

declare class Node<T> {
	location: Location
	data: T

	throw(msg: string): never;
}

export type Stmt = Node<StmtData>

type StmtData =
	["block", Stmt[]]
	| ["if", Expr, Stmt]
	| ["while", Expr, Stmt]
	| ["let", string, string, Expr | null]
	| ["assign", string, Expr]
	| ["iassign", Expr, string, Expr]
	| ["call", string, Expr[]];

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
	["array", string | null, Expr[]] |
	["number", number]

export type Function = Node<["function", string, string[], Stmt]>;
export type Event = Node<["event", string, string[], Stmt]>;

export function parse(src: string): (Function | Event)[] {
	try {
		return Parser.parse(src, { grammarSource: "input.ram" });
	} catch (e: any) {
		throw {
			// display: () => e.format([{ source: "input.ram", text: src }]),
			message: e.message,
			location: e.location
		};
	}
}