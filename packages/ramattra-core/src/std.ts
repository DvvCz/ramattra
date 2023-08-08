export const EVENTS: Record<string, { ow: string, args: [ string, string ][] }> = {
	"client": {
		ow: "Ongoing - Each Player",
		args: [
			["player", "Event Player"]
		]
	},

	"playerDied": {
		ow: "Player Died",
		args: [
			["player", "Victim"],
			["player", "Attacker"],
			["number", "Event Damage"],
			["boolean", "Event Was Critical Hit"],
			["button", "Event Ability"],
			["vector", "Event Direction"]
		]
	}
};

export const CONSTANTS: Record<string, { ow: string, type: string }> = {
	"TEAM_ALL": {
		ow: "All Teams",
		type: "team"
	},
};

export const FUNCTIONS: Record<string, { ow: string, args: { type: string, default?: string }[] }> = {
	"disableGameModeHUD": {
		ow: "Disable Game Mode HUD",
		args: [
			{ type: "player" }
		]
	}
};