local assemble = require("packages.ramattra.src.ramattra")

local function unindent(by, str)
	return (str:gsub(("\t"):rep(by), ""))
end

local function help()
	return unindent(2, [[
		usage: ramattra <in.ram> <out.ows>
	]])
end

if #arg < 2 then
	io.write(help())
else
	local input, err = io.open(arg[1], "rb")
	if not input then
		io.write("Failed to open input file: " .. err)
		return
	end

	local output, err = io.open(arg[2], "wb")
	if not output then
		io.write("Failed to open output file: " .. err)
		return
	end

	local src = input:read("*a")
	local ows = assemble(src)

	output:write(ows)

	output:close()
	input:close()
end