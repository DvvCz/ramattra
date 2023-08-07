import * as peggy from "peggy";

/**
 * Grammar for PeggyJS
 */
const Grammar = `
Top =
	(Function / Event)*

Function = "function" _ name:ident "(" _ params:ident|.., _ "," _| _ ")" _ block:Block {
	return ["function", name, params, block]
}

Event = "event" _ name:ident _ "(" _ args:ident|.., _ "," _| _ ")" _ block:Block {
	return ["event", name, args, block]
}

Block "block" =
	"{" _ @Stmt|.., _ ";"? _| ";"? _ "}"

Stmt =
	"if" _ cond:Expr _ block:Block { return ["if", cond, block] }
	/ "for" _ marker:ident _ "in" _ start:Expr ".." end:Expr _ block:Block { return ["for", marker, start, end] }
	/ "while" _ cond:Expr _ block:Block { return ["while", cond, block] }

BaseExpr =
	"(" _ @Expr _ ")"
	/ "!" expr:Expr { return ["not", expr] }
	/ "typeof" expr:Expr { return ["typeof", expr] }
	/ tname:ident "." mname:ident "(" args: Expr|.., _ "," _| ")" { return ["methodcall", tname, mname, args] }
	/ name:ident "(" args: Expr|.., _ "," _| ")" { return ["call", name, args] }
	/ '"' inner:[^"]+ '"' { return ["string", inner.join("")] }
	/ ( "true" / "false" ) { return ["boolean", text() == "true"] }
	/ ("<" type:ident ">")? "[" items:Expr|.., _ "," _| "]" { return ["array", type, items] }
	/ [0-9]+.[0.9]+ { return ["float", parseFloat(text())] }
	/ [0-9]+ { return ["int", parseInt(text())] }

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
	/ BaseExpr

ident "identifier" =
	[a-zA-Z][a-zA-Z0-9_]* { return text() }

_ "whitespace" =
	[ \\t\\n\\r]* ("/*" (!("*/") .)* "*/")* ("//" [^\\n]+ "\\n")*
`;

const Parser = peggy.generate(Grammar);

export type Block = Statement[];

export type Statement =
	["if", Expr, Block];

export type Expr =
	["not", Expr]
	| ["typeof", Expr]
	| ["methodcall", string, string, Expr[]]
	| ["call", string, Expr[]]
	| ["string", string]
	| ["boolean", boolean]
	| ["array", string|null, Expr[]]
	| ["int", number]
	| ["float", number];

export type Function = ["function", string, string[], Block];
export type Event = ["event", string, string[], Block];

export default function parse(src: string): (Function | Event)[] {
	return Parser.parse(src);
}