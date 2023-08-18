import * as peggy from "peggy";

const peg = (template: TemplateStringsArray) => peggy.generate(String.raw(template));

/**
 * Grammar for PeggyJS
 */
const Parser = peg`
Top =
	@(Function / Event)|.., _|

Function = "function" _ name:ident "(" _ params:ident|.., _ "," _| _ ")" _ block:Block {
	return ["function", name, params, block]
}

Event = "event" _ name:ident _ "(" _ args:ident|.., _ "," _| _ ")" _ block:Block {
	return ["event", name, args, block]
}

Block "block" =
	"{" _ stmts:Stmt|.., _ ";"? _| ";"? _ "}" { return ["block", stmts] }

Stmt =
	"if" _ cond:Expr _ block:Block { return ["if", cond, block] }
	/ "for" _ marker:ident _ "in" _ start:Expr ".." end:Expr _ block:Block { return ["for", marker, start, end, block] }
	/ "while" _ cond:Expr _ block:Block { return ["while", cond, block] }
	/ "let" _ name:ident _ type:(":" _ @ident)? _ value:("=" _ @Expr)? { return ["let", name, type, value] }
	/ name:ident _ "=" _ value:Expr { return ["assign", name, value] }
	/ obj:BaseExpr "." mname:ident "(" _ args:Expr|.., _ "," _| _ ")" { return ["methodcall", obj, mname, args] }
	/ name:ident "(" _ args:Expr|.., _ "," _| _ ")" { return ["call", name, args] }

BaseExpr =
	"(" _ @Expr _ ")"
	/ "!" expr:Expr { return ["not", expr] }
	/ "typeof" expr:Expr { return ["typeof", expr] }
	/ '"' inner:[^"]+ '"' { return ["string", inner.join("")] }
	/ ( "true" / "false" ) { return ["boolean", text() == "true"] }
	/ type:("<" @ident ">")? "[" items:Expr|.., _ "," _| "]" { return ["array", type, items] }
	/ [0-9]+ "." [0-9]+ { return ["number", parseFloat(text())] }
	/ "0b" [0-1]+ { return ["number", parseInt(text().substring(2), 2)] }
	/ "0o" [0-1]+ { return ["number", parseInt(text().substring(2), 8)] }
	/ "0x" [0-1]+ { return ["number", parseInt(text().substring(2), 16)] }
	/ [0-9]+ { return ["number", parseInt(text())] }
	/ ident:ident { return ["ident", ident] }

Expr =
	lhs:BaseExpr _ "+" _ rhs:BaseExpr { return ["add", lhs, rhs] }
	/ lhs:BaseExpr _ "-" _ rhs:BaseExpr { return ["sub", lhs, rhs] }
	/ lhs:BaseExpr _ "*" _ rhs:BaseExpr { return ["mul", lhs, rhs] }
	/ lhs:BaseExpr _ "/" _ rhs:BaseExpr { return ["div", lhs, rhs] }
	/ lhs:BaseExpr _ "==" _ rhs:BaseExpr { return ["eq", lhs, rhs] }
	/ lhs:BaseExpr _ "!=" _ rhs:BaseExpr { return ["neq", lhs, rhs] }
	/ lhs:BaseExpr _ ">=" _ rhs:BaseExpr { return ["gte", lhs, rhs] }
	/ lhs:BaseExpr _ ">" _ rhs:BaseExpr { return ["gt", lhs, rhs] }
	/ lhs:BaseExpr _ "<" _ rhs:BaseExpr { return ["lt", lhs, rhs] }
	/ lhs:BaseExpr _ "<=" _ rhs:BaseExpr { return ["lte", lhs, rhs] }
	/ lhs:BaseExpr _ "||" _ rhs:BaseExpr { return ["or", lhs, rhs] }
	/ lhs:BaseExpr _ "&&" _ rhs:BaseExpr { return ["and", lhs, rhs] }
	/ obj:BaseExpr "[" _ index:BaseExpr _ "]" { return ["index", obj, index] }
	/ obj:BaseExpr "." mname:ident "(" _ args:Expr|.., _ "," _| _ ")" { return ["methodcall", obj, mname, args] }
	/ name:ident "(" _ args:Expr|.., _ "," _| _ ")" { return ["call", name, args] }
	/ BaseExpr

ident "identifier" =
	[a-zA-Z][a-zA-Z0-9_]* { return text() }

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
	| ["for", string, Expr, Expr, Stmt]
	| ["while", Expr, Stmt]
	| ["let", string, string, Expr | null]
	| ["assign", string, Expr]
	| ["methodcall", Expr, string, Expr[]]
	| ["call", string, Expr[]];

export type Expr =
	["add", Expr, Expr] |
	["sub", Expr, Expr] |
	["mul", Expr, Expr] |
	["div", Expr, Expr] |

	["eq", Expr, Expr] |
	["neq", Expr, Expr] |
	["gte", Expr, Expr] |
	["gt", Expr, Expr] |
	["lt", Expr, Expr] |
	["lte", Expr, Expr] |

	["or", Expr, Expr] |
	["and", Expr, Expr] |

	["index", Expr, Expr] |
	["methodcall", Expr, string, Expr[]] |
	["call", string, Expr[]] |

	["not", Expr] |
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

export default function parse(src: string): (Function | Event)[] {
	try {
		return Parser.parse(src, { grammarSource: "input.ram" });
	} catch (e: any) {
		if (typeof e.format == "function") {
			throw e.format([
				{ source: "input.ram", text: src }
			])
		} else {
			throw e;
		}
	}
}