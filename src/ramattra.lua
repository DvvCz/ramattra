local Events = {
	["client"] = { ow = "Ongoing - Each Player", params = { { "player", "Event Player" } } },
	["server"] = { ow = "Ongoing - Global", params = {} },
}

local Constants = {
	["TEAM_ALL"] = { ow = "All Teams", type = "team" },
	["TEAM_1"] = { ow = "Team 1", type = "team" },
	["TEAM_2"] = { ow = "Team 2", type = "team" },

	["COLOR_WHITE"] = { ow = "Color(White)", type = "color" },
	["COLOR_BLUE"] = { ow = "Color(Blue)", type = "color" },
	["COLOR_LIME"] = { ow = "Color(Lime Green)", type = "color" },
	["COLOR_AQUA"] = { ow = "Color(Aqua)", type = "color" },
	["COLOR_SKY"] = { ow = "Color(Sky Blue)", type = "color" },
	["COLOR_GRAY"] = { ow = "Color(Gray)", type = "color" },
	["COLOR_ROSE"] = { ow = "Color(Rose)", type = "color" },
	["COLOR_VIOLET"] = { ow = "Color(Violet)", type = "color" },
	["COLOR_YELLOW"] = { ow = "Color(Yellow)", type = "color" },
	["COLOR_GREEN"] = { ow = "Color(Green)", type = "color" },
	["COLOR_RED"] = { ow = "Color(Red)", type = "color" },
	["COLOR_BLACK"] = { ow = "Color(Black)", type = "color" },
	["COLOR_TURQUOISE"] = { ow = "Color(Turquoise)", type = "color" },
	["COLOR_ORANGE"] = { ow = "Color(Orange)", type = "color" },
	["COLOR_PURPLE"] = { ow = "Color(Purple)", type = "color" },

	["COLOR_TEAM_1"] = { ow = "Color(Team 1)", type = "color" },
	["COLOR_TEAM_2"] = { ow = "Color(Team 2)", type = "color" },

	["HUD_LEFT"] = { ow = "Left", type = "hudpos" },
	["HUD_TOP"] = { ow = "Top", type = "hudpos" },
	["HUD_RIGHT"] = { ow = "Right", type = "hudpos" },

	["HUDEVAL_NONE"] = { ow = "None", type = "hudeval" },

	["SPECTATOR_VISIBLE_DEFAULT"] = { ow = "Default Visibility", type = "visibility" },
	["SPECTATOR_VISIBLE_ALWAYS"] = { ow = "Visible Always", type = "visibility" },
	["SPECTATOR_VISIBLE_NEVER"] = { ow = "Visible Never", type = "visibility" },

	["INVISIBLE_TO_ALL"] = { ow = "All", type = "invis" },
	["INVISIBLE_TO_ENEMIES"] = { ow = "Enemies", type = "invis" },
	["INVISIBLE_TO_NONE"] = { ow = "None", type = "invis" }
}

local Functions = {
	["disableGameModeHUD"] = { ow = "Disable Game Mode HUD", args = { "player" } },
	["createHUDText"] = {
		ow = "Create HUD Text",
		args = { "array", "string", "string", "string", "hudpos", "number", "color", "color", "color", "hudeval", "visibility" },
	},
	-- ["wait"] = { ow = "Wait", args = { "number" } },
	["disableMessages"] = { ow = "Disable Messages", args = { "player" } },

	["allPlayers"] = { ow = "All Players", args = { "team" }, ret = "array" },

	["format"] = { ow = "Custom String", args = { "string", "...any" } },

	-- Most of these should be Player | Array when unions are supported.
	["setAbility1Enabled"] = { ow = "Set Ability 1 Enabled", args = { "player", "boolean" } },
	["setAbility2Enabled"] = { ow = "Set Ability 2 Enabled", args = { "player", "boolean" } },
	-- ["setAbilityCharge"] = { ow = "Set Ability Charge", args = { "player", "button", "number" } },
	-- ["setAbilityCooldown"] = { ow = "Set Ability Cooldown", args = { "player", "button", "number" } },
	["setInvisible"] = { ow = "Set Invisible", args = { "player", "invis" } },


	["Vector"] = { ow = "Vector", args = { "number", "number", "number" }, ret = "vector" },
	["cross"] = { ow = "Cross Product", args = { "vector", "vector" }, ret = "vector" },
	["dot"] = { ow = "Dot Product", args = { "vector", "vector" }, ret = "number" },
}

local function map(t, f)
	local out = {}
	for k, v in ipairs(t) do
		out[k] = f(v)
	end
	return out
end

---@enum ExprKind
local ExprKind = {
	Number = 1,
	Boolean = 2,
	String = 3,
	Array = 4,
	Null = 5,
	Ident = 6,
	Call = 7,
	MethodCall = 8,

	Add = 9,
	Sub = 10,
	Mul = 11,
	Div = 12,

	Eq = 13,
	Neq = 14,

	GreaterThan = 15,
	GreaterThanOrEqual = 16,
	LessThan = 17,
	LessThanOrEqual = 18,
}

---@class Expr
local Expr = {}
Expr.__index = Expr

function Expr.new(kind, data)
	return setmetatable({ kind = kind, data = data }, Expr)
end

local Stringify = {
	[ExprKind.Boolean] = function(expr)
		return expr.data and "True" or "False"
	end,
	[ExprKind.Number] = function(expr)
		return expr.data
	end,
	[ExprKind.Null] = function(expr)
		return "Null"
	end,

	[ExprKind.String] = function(expr)
		return ("Custom String(%q)"):format(expr.data)
	end,
	[ExprKind.Array] = function(expr)
		return ("Array(%s)"):format(table.concat(map(expr.data, tostring), ", "))
	end,

	[ExprKind.Ident] = function(expr)
		return expr.ow and expr.ow or expr.data
	end,

	[ExprKind.Call] = function(expr)
		return ("%s(%s)"):format(Functions[expr.data[1]].ow, table.concat(map(expr.data[2], tostring), ", "))
	end,

	[ExprKind.Add] = function(expr)
		return ("%s + %s"):format(expr.data[1], expr.data[2])
	end,

	[ExprKind.Sub] = function(expr)
		return ("%s - %s"):format(expr.data[1], expr.data[2])
	end,

	[ExprKind.Mul] = function(expr)
		return ("%s * %s"):format(expr.data[1], expr.data[2])
	end,

	[ExprKind.Div] = function(expr)
		return ("%s / %s"):format(expr.data[1], expr.data[2])
	end,

	[ExprKind.Eq] = function(expr)
		return ("%s == %s"):format(expr.data[1], expr.data[2])
	end,

	[ExprKind.Neq] = function(expr)
		return ("%s != %s"):format(expr.data[1], expr.data[2])
	end,

	[ExprKind.GreaterThan] = function(expr)
		return ("%s > %s"):format(expr.data[1], expr.data[2])
	end,

	[ExprKind.GreaterThanOrEqual] = function(expr)
		return ("%s >= %s"):format(expr.data[1], expr.data[2])
	end,

	[ExprKind.LessThan] = function(expr)
		return ("%s < %s"):format(expr.data[1], expr.data[2])
	end,

	[ExprKind.LessThanOrEqual] = function(expr)
		return ("%s <= %s"):format(expr.data[1], expr.data[2])
	end
}

function Expr:__tostring()
	return Stringify[self.kind](self)
end

---@enum StmtKind
local StmtKind = {
	Event = 0,
	If = 1,
	Call = 2,
	MethodCall = 3,
	Declare = 4,
}

---@class Stmt
---@field kind StmtKind
local Stmt = {}
Stmt.__index = Stmt

function Stmt.new(kind, data)
	return setmetatable({ kind = kind, data = data }, Stmt)
end

local Stringify = {
	[StmtKind.Event] = function(stmt)
		return ("rule(%q)\n{\n\tevent\n\t{\n\t\t%s;\n\t\tAll;\n\t\tAll;\n\t}\n\n\tactions\n\t{\n\t\t%s;\n\t}\n}"):format(
			stmt.data[1],
			Events[stmt.data[1]].ow,
			table.concat(map(stmt.data[3], tostring), ";\n"):gsub("\n", "\n\t\t")
		)
	end,

	[StmtKind.Call] = function(stmt)
		return ("%s(%s)"):format(Functions[stmt.data[1]].ow, table.concat(map(stmt.data[2], tostring), ", "))
	end,

	[StmtKind.If] = function(stmt)
		return ("If(%s);\n\t%s;\nEnd"):format(stmt.data[1], table.concat(map(stmt.data[2], tostring), ";\n"):gsub("\n", "\n\t"))
	end,

	[StmtKind.Declare] = function(stmt)
		return ("Set Global Variable At Index(Vars, %s, %s)"):format(stmt.ow and stmt.ow or stmt.data[1], stmt.data[2])
	end,
}

function Stmt:__tostring()
	return Stringify[self.kind](self)
end

local function parse(src)
	local ptr, len = 1, #src

	local function consume(pattern)
		ptr = string.match(src, "^%s+()", ptr) or ptr

		local start, finish, match = string.find(src, pattern, ptr)
		if start then
			ptr = finish + 1
			return match or true
		end

		return nil
	end

	local function number()
		local match = consume("^(%d*%.%d+)") or consume("^(%d+)")
		if match then
			return Expr.new(ExprKind.Number, tonumber(match))
		end
	end

	local function string()
		local match = consume('^"([^"]+)"')
		if match then
			return Expr.new(ExprKind.String, match)
		end
	end

	local function bool()
		return consume("^(true)") and Expr.new(ExprKind.Boolean, true) or (consume("^(false)") and Expr.new(ExprKind.Boolean, false))
	end

	local function ident()
		local match = consume("^([%w_]+)")
		if match then
			return Expr.new(ExprKind.Ident, match)
		end
	end

	local expr
	local function array()
		if not consume("^%[") then
			return
		end

		local args = {}
		if consume("^%]") then
			return Expr.new(ExprKind.Array, args)
		end

		repeat
			args[#args + 1] = assert(expr(), "Expected expression for array")
		until not consume(",")

		assert(consume("^%]"), "Expected ] to end array")

		return Expr.new(ExprKind.Array, args)
	end

	local function group()
		if consume("^%(") then
			local e = expr()
			assert(consume("^%)"), "Expected ) to end grouped expression")
			return e
		end
	end

	local function call(exp)
		local name = consume("^(%w+)%(")
		if not name then
			return
		end

		local args = {}
		if not consume("^%)") then
			repeat
				args[#args + 1] = assert(expr(), "Expected expression for argument")
			until not consume("^,")
			assert(consume("^%)"), "Expected ) to end call")
		end

		return exp and Expr.new(ExprKind.Call, { name, args }) or Stmt.new(StmtKind.Call, { name, args })
	end

	local function methodcall(exp)
		local prev = number() or string() or bool() or array() or group() or call(exp) or ident()
		if not prev then
			return
		end

		local name = consume("^%.([%w_]+)%s*%(")
		if name then
			local args = {}
			if not consume("^%)") then
				repeat
					args[#args + 1] = assert(expr(), "Expected expression for argument")
				until not consume("^,")
				assert(consume("^%)"), "Expected ) to end methodcall")
			end

			return exp and Expr.new(ExprKind.MethodCall, { prev, name, args }) or Stmt.new(StmtKind.MethodCall, { prev, name, args })
		else
			return prev
		end
	end

	local function binop()
		local prev = number() or string() or bool() or array() or group() or call(true) or methodcall(true) or ident()
		if not prev then
			return
		end

		if consume("^//[^\n]+\n") then
			return prev
		end

		if consume("^%+") then
			return Expr.new(ExprKind.Add, { prev, assert(expr(), "Expected rhs expression for addition") })
		elseif consume("^%-") then
			return Expr.new(ExprKind.Sub, { prev, assert(expr(), "Expected rhs expression for subtraction") })
		elseif consume("^%*") then
			return Expr.new(ExprKind.Mul, { prev, assert(expr(), "Expected rhs expression for multiplication") })
		elseif consume("^%/") then
			return Expr.new(ExprKind.Div, { prev, assert(expr(), "Expected rhs expression for division") })
		elseif consume("^==") then
			return Expr.new(ExprKind.Eq, { prev, assert(expr(), "Expected rhs expression for ==") })
		elseif consume("^!=") then
			return Expr.new(ExprKind.Neq, { prev, assert(expr(), "Expected rhs expression for !=") })
		elseif consume("^%>=") then
			return Expr.new(ExprKind.GreaterThanOrEqual, { prev, assert(expr(), "Expected rhs expression for >=") })
		elseif consume("^%<=") then
			return Expr.new(ExprKind.LessThanOrEqual, { prev, assert(expr(), "Expected rhs expression for <=") })
		elseif consume("^%>") then
			return Expr.new(ExprKind.GreaterThan, { prev, assert(expr(), "Expected rhs expression for >") })
		elseif consume("^%<") then
			return Expr.new(ExprKind.LessThan, { prev, assert(expr(), "Expected rhs expression for <") })
		else
			return prev
		end
	end

	function expr()
		return binop()
			or number()
			or string()
			or bool()
			or array()
			or group()
			or call(true)
			or methodcall(true)
			or ident()
			or (consume("^(null)") and Expr.new(ExprKind.Literal, { nil, "null" }))
	end

	local function declare()
		if not consume("^let") then
			return
		end

		local name = assert(consume("^([%w_]+)"), "Expected name for let declaration")
		assert(consume("^="), "Expected = to follow '" .. name .. "'")
		local expr = assert(expr(), "Expected expression for let declaration")

		return Stmt.new(StmtKind.Declare, { name, expr })
	end

	local block
	local function stmt()
		return (
			consume("^if")
			and Stmt.new(StmtKind.If, {
				assert(expr(), "Expected condition for if statement"),
				assert(block(), "Expected block for if statement"),
			})
		)
			or declare()
			or call()
			or methodcall()
	end

	function block()
		if not consume("^{") then
			return
		end

		local stmts = {}
		while not consume("^}") do
			while consume("^//[^\n]+\n") do end
			stmts[#stmts + 1] = assert(stmt(), "Expected statement to parse")
		end

		return stmts
	end

	local function event()
		if not consume("^(event)") then
			return nil
		end

		local name = assert(consume("^(%w+)"), "Couldn't match event name")
		assert(consume("^%("))

		local params = {}
		if not consume("^%)") then
			repeat
				params[#params + 1] = assert(consume("^(%w+)"), "Expected param name")
			until not consume("^,")

			assert(consume("^%)"))
		end

		return Stmt.new(StmtKind.Event, { name, params, assert(block()) })
	end

	local events = {}
	consume("^%s+")
	consume("^//[^\n]*\n")
	while ptr <= len do
		events[#events + 1] = assert(event())
		consume("^%s+")
		consume("^//[^\n]*\n")
		consume("^%s+")
	end

	return events
end

local function assemble(src)
	local out = {"variables {\n\tglobal:\n\t\t0: Vars\n}"}

	local events = assert(parse(src))
	local scopes, depth = { [0] = setmetatable({}, { __index = Constants }) }, 0

	local flatvars, nflatvars = {}, 0

	local function pushScope()
		depth = depth + 1
		scopes[depth] = {}
	end

	local function popScope()
		scopes[depth] = nil
		depth = depth - 1
	end

	local function get(name)
		for i = depth, 0, -1 do
			if scopes[i][name] then
				return scopes[i][name]
			end
		end
	end

	local statement, expression

	local Statements = {
		[StmtKind.Call] = function(stmt)
			local fn = assert(Functions[stmt.data[1]], "No such function: " .. stmt.data[1])

			if #fn.args > #stmt.data[2] then
				error("Incorrect # of arguments passed to " .. stmt.data[1] .. " expected " .. #fn.args .. " arguments")
			end

			for i, arg in ipairs(stmt.data[2]) do
				expression(arg)

				if fn.args[i] ~= arg.type then
					error(
						"Incorrect argument type passed to "
							.. stmt.data[1]
							.. " expected "
							.. (fn.args[i] or "none")
							.. " got "
							.. arg.type
					)
				end
			end
		end,

		[StmtKind.If] = function(stmt)
			expression(stmt.data[1])

			pushScope()

			for _, stmt in ipairs(stmt.data[2]) do
				statement(stmt)
			end

			popScope()
		end,

		[StmtKind.MethodCall] = function(stmt)
			table.insert(stmt.data[3], 1, stmt.data[1])
			stmt.data[1] = stmt.data[2]
			stmt.data[2] = stmt.data[3]

			stmt.kind = StmtKind.Call

			statement(stmt)
		end,

		[StmtKind.Declare] = function(stmt)
			expression(stmt.data[2])

			if not flatvars[stmt.data[1]] then
				nflatvars = nflatvars + 1
				flatvars[stmt.data[1]] = nflatvars
			end

			local ow = tostring(flatvars[stmt.data[1]]) -- add depth to variable for shadowing
			stmt.ow = ow
			scopes[depth][stmt.data[1]] = { type = stmt.data[2].type, ow = "Value In Array(Global Variable(Vars), " .. ow .. ")" }
		end,
	}

	function statement(stmt)
		Statements[stmt.kind](stmt)
	end

	local Expressions = {
		[ExprKind.Number] = function()
			return "number"
		end,
		[ExprKind.Array] = function()
			return "array"
		end,
		[ExprKind.Boolean] = function()
			return "boolean"
		end,
		[ExprKind.String] = function()
			return "string"
		end,
		[ExprKind.Null] = function()
			return "null"
		end,

		[ExprKind.Ident] = function(expr)
			local var = assert(get(expr.data), "Unknown variable " .. expr.data)
			if var.ow then
				expr.ow = var.ow
			end

			return var.type
		end,

		[ExprKind.Call] = function(expr)
			local fn = assert(Functions[expr.data[1]], "Unknown function " .. expr.data[1])
			if #fn.args > #expr.data[2] then
				error("Incorrect # of arguments passed to " .. expr.data[1] .. " expected " .. #fn.args .. " arguments")
			end

			for i, arg in ipairs(expr.data[2]) do
				expression(arg)

				if fn.args[i] ~= arg.type then
					error(
						"Incorrect argument type passed to "
							.. expr.data[1]
							.. " expected "
							.. (fn.args[i] or "none")
							.. " got "
							.. arg.type
					)
				end
			end

			return fn.ret
		end,

		[ExprKind.MethodCall] = function(expr)
			table.insert(expr.data[3], 1, expr.data[1])
			expr.data[1] = expr.data[2]
			expr.data[2] = expr.data[3]

			expr.kind = ExprKind.Call

			expression(expr)

			return expr.type
		end,

		[ExprKind.Add] = function(expr)
			expression(expr.data[1])
			expression(expr.data[2])
			return expr.data[1].type
		end,

		[ExprKind.Sub] = function(expr)
			expression(expr.data[1])
			expression(expr.data[2])
			return expr.data[1].type
		end,

		[ExprKind.Mul] = function(expr)
			expression(expr.data[1])
			expression(expr.data[2])
			return expr.data[1].type
		end,

		[ExprKind.Div] = function(expr)
			expression(expr.data[1])
			expression(expr.data[2])
			return expr.data[1].type
		end,

		[ExprKind.Eq] = function(expr)
			expression(expr.data[1])
			expression(expr.data[2])
			return "boolean"
		end,


		[ExprKind.Neq] = function(expr)
			expression(expr.data[1])
			expression(expr.data[2])
			return "boolean"
		end,

		[ExprKind.GreaterThan] = function(expr)
			expression(expr.data[1])
			expression(expr.data[2])
			return "boolean"
		end,

		[ExprKind.GreaterThanOrEqual] = function(expr)
			expression(expr.data[1])
			expression(expr.data[2])
			return "boolean"
		end,

		[ExprKind.LessThan] = function(expr)
			expression(expr.data[1])
			expression(expr.data[2])
			return "boolean"
		end,

		[ExprKind.LessThanOrEqual] = function(expr)
			expression(expr.data[1])
			expression(expr.data[2])
			return "boolean"
		end,
	}

	function expression(expr)
		expr.type = assert(Expressions[expr.kind](expr), "Cannot use void return as expression")
	end

	local function event(evt)
		pushScope()

		local event = assert(Events[evt.data[1]], "Unknown event: " .. evt.data[1])

		assert(#event.params == #evt.data[2], "Event " .. evt.data[1] .. " has " .. #event.params .. " parameters.")

		for i, param in ipairs(evt.data[2]) do
			scopes[depth][param] = { type = event.params[i][1], ow = event.params[i][2] }
		end

		for i, stmt in ipairs(evt.data[3]) do
			statement(stmt)
		end

		out[#out + 1] = tostring(evt)

		popScope()
	end

	for i, evt in ipairs(events) do
		event(evt)
	end

	return table.concat(out, "\n\n")
end

return assemble