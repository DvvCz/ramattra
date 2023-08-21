import * as peggy from "peggy";

const peg = (template: TemplateStringsArray) => peggy.generate(String.raw(template), { allowedStartRules: process.env.NODE_ENV == "test" ? ["*"] : undefined });

/**
 * Grammar for PeggyJS
 *
 * Desugaring Syntaxes:
 *  For => While
 *  Method Call => Call
 *  Compound Assignment => Assignment
 */
export const Parser = peg`
Top =
	_ @(Function / Event)|.., _| _

Function =
	"function" _ name:ident "(" _ params:ident|.., _ "," _| _ ")" _ block:Block { return ["function", name, params, block] }

Event =
	"event" _ name:ident _ "(" _ args:ident|.., _ "," _| _ ")" _ block:Block { return ["event", name, args, block] }

Block =
	"{" _ stmts:Stmt|.., _ ";"? _| ";"? _ "}" { return ["block", stmts] }

Stmt =
	"if" _ cond:Expr _ block:Block { return ["if", cond, block] }
	/ "for" _ marker:ident _ "in" _ start:Expr ".." end:Expr _ block:Block {
		return ["block", [
			["let", marker, "number", start],
			["while", ["<", ["ident", marker], end], block]
		]]
	}
	/ "while" _ cond:Expr _ block:Block { return ["while", cond, block] }
	/ "let" _ name:ident _ type:(":" _ @ident)? _ value:("=" _ @Expr)? { return ["let", name, type, value] }
	/ name:ident _ op:("+" / "-" / "*" / "/") "=" _ value:Expr { return ["assign", name, [op, ["ident", name], value]] }
	/ name:ident _ "=" _ value:Expr { return ["assign", name, value] }
	/ obj:BaseExpr "." mname:ident "(" _ args:Expr|.., _ "," _| _ ")" { return ["call", mname, [obj, ...args]] }
	/ name:ident "(" _ args:Expr|.., _ "," _| _ ")" { return ["call", name, args] }

BaseExpr =
	"(" _ @Expr _ ")"
	/ op:("!" / "typeof") _ expr:Expr { return [op, expr] }
	/ '"' inner:[^"]+ '"' { return ["string", inner.join("")] }
	/ ( "true" / "false" ) { return ["boolean", text() == "true"] }
	/ type:("<" @ident ">")? "[" items:Expr|.., _ "," _| "]" { return ["array", type, items] }
	/ [0-9]+ "." [0-9]+ { return ["number", parseFloat(text())] }
	/ "0b" [0-1]+ { return ["number", parseInt(text().substring(2), 2)] }
	/ "0x" [0-9a-fA-F]+ { return ["number", parseInt(text().substring(2), 16)] }
	/ [0-9]+ !"." { return ["number", parseInt(text())] }
	/ args:ident|.., _ "," _| _ "=>" _ ret:Expr { return ["lambda", args, ret] }
	/ ident:ident { return ["ident", ident] }

Expr "expression" =
	lhs:BaseExpr _ op:("+" / "-" / "*" / "/" / "==" / "!=" / ">=" / ">" / "<" / "<=" / "||" / "&&") _ rhs:Expr { return [op, lhs, rhs] }
	/ obj:BaseExpr "[" _ index:Expr _ "]" { return ["index", obj, index] }
	/ obj:BaseExpr "." mname:ident "(" _ args:Expr|.., _ "," _| _ ")" { return ["call", mname, [obj, ...args]] }
	/ name:ident "(" _ args:Expr|.., _ "," _| _ ")" { return ["call", name, args] }
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

export type Stmt =
	["block", Stmt[]]
	| ["if", Expr, Stmt]
	| ["while", Expr, Stmt]
	| ["let", string, string, Expr | null]
	| ["assign", string, Expr]
	| ["call", string, Expr[]];

export type Expr =
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

export type Function
	= ["function", string, string[], Stmt];

export type Event
	= ["event", string, string[], Stmt];

export function parse(src: string): (Function | Event)[] {
	try {
		return Parser.parse(src, { grammarSource: "input.ram" });
	} catch (e: any) {
		throw e.format([
			{ source: "input.ram", text: src }
		]);
	}
}