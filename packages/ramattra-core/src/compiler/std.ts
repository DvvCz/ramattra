export const EVENTS: Record<string, { ow: string, args: { type: string, ow: string }[] }> = {
	"client": {
		ow: "Ongoing - Each Player",
		args: [
			{ type: "player", ow: "Event Player" }
		]
	},

	"server": {
		ow: "Ongoing - Global",
		args: []
	},

	"playerDied": {
		ow: "Player Died",
		args: [
			{ type: "player", ow: "Victim" },
			{ type: "player", ow: "Attacker" },
			{ type: "number", ow: "Event Damage" },
			{ type: "boolean", ow: "Event Was Critical Hit" },
			{ type: "button", ow: "Event Ability" },
			{ type: "vector", ow: "Event Direction" }
		]
	},

	"playerTookDamage": {
		ow: "Player Took Damage",
		args: [
			{ type: "player", ow: "Event Player" },
			{ type: "number", ow: "Event Damage" },
			{ type: "player", ow: "Attacker" },
			{ type: "boolean", ow: "Event Was Critical Hit" },
			{ type: "ability", ow: "Event Ability" },
			{ type: "vector", ow: "Event Direction" }
		]
	},

	"playerDealtDamage": {
		ow: "Player Dealt Damage",
		args: [
			{ type: "player", ow: "Event Player" },
			{ type: "number", ow: "Event Damage" },
			{ type: "player", ow: "Attacker" },
			{ type: "boolean", ow: "Event Was Critical Hit" },
			{ type: "ability", ow: "Event Ability" },
			{ type: "vector", ow: "Event Direction" }
		]
	},
};

export const CONSTANTS: Record<string, { ow: string, type: string }> = {
	"TEAM_ALL": { ow: "All Teams", type: "team" },
	"TEAM_1": { ow: "Team 1", type: "team" },
	"TEAM_2": { ow: "Team 2", type: "team" },

	"COLOR_WHITE": { ow: "Color(White)", type: "color" },
	"COLOR_BLUE": { ow: "Color(Blue)", type: "color" },
	"COLOR_LIME": { ow: "Color(Lime Green)", type: "color" },
	"COLOR_AQUA": { ow: "Color(Aqua)", type: "color" },
	"COLOR_SKY": { ow: "Color(Sky Blue)", type: "color" },
	"COLOR_GRAY": { ow: "Color(Gray)", type: "color" },
	"COLOR_ROSE": { ow: "Color(Rose)", type: "color" },
	"COLOR_VIOLET": { ow: "Color(Violet)", type: "color" },
	"COLOR_YELLOW": { ow: "Color(Yellow)", type: "color" },
	"COLOR_GREEN": { ow: "Color(Green)", type: "color" },
	"COLOR_RED": { ow: "Color(Red)", type: "color" },
	"COLOR_BLACK": { ow: "Color(Black)", type: "color" },
	"COLOR_TURQUOISE": { ow: "Color(Turquoise)", type: "color" },
	"COLOR_ORANGE": { ow: "Color(Orange)", type: "color" },
	"COLOR_PURPLE": { ow: "Color(Purple)", type: "color" },

	"COLOR_TEAM_1": { ow: "Color(Team 1)", type: "color" },
	"COLOR_TEAM_2": { ow: "Color(Team 2)", type: "color" },

	"HUD_LEFT": { ow: "Left", type: "hudpos" },
	"HUD_TOP": { ow: "Top", type: "hudpos" },
	"HUD_RIGHT": { ow: "Right", type: "hudpos" },

	"HUDEVAL_NONE": { ow: "None", type: "hudeval" },

	"SPECTATOR_VISIBLE_DEFAULT": { ow: "Default Visibility", type: "visibility" },
	"SPECTATOR_VISIBLE_ALWAYS": { ow: "Visible Always", type: "visibility" },
	"SPECTATOR_VISIBLE_NEVER": { ow: "Visible Never", type: "visibility" },

	"INVISIBLE_TO_ALL": { ow: "All", type: "invis" },
	"INVISIBLE_TO_ENEMIES": { ow: "Enemies", type: "invis" },
	"INVISIBLE_TO_NONE": { ow: "None", type: "invis" },

	"RELATIVE_TO_WORLD": { ow: "To World", type: "relativity" },
	"RELATIVE_TO_PLAYER": { ow: "To Player", type: "relativity" },

	"STATUS_ASLEEP": { ow: "Asleep", type: "status" },
	"STATUS_BURNING": { ow: "Burning", type: "status" },
	"STATUS_FROZEN": { ow: "Frozen", type: "status" },
	"STATUS_HACKED": { ow: "Hacked", type: "status" },
	"STATUS_INVINCIBLE": { ow: "Invincible", type: "status" },
	"STATUS_KNOCKED_DOWN": { ow: "Knocked Down", type: "status" },
	"STATUS_PHASED_OUT": { ow: "Phased Out", type: "status" },
	"STATUS_ROOTED": { ow: "Rooted", type: "status" },
	"STATUS_STUNNED": { ow: "Stunned", type: "status" },
	"STATUS_UNKILLABLE": { ow: "Unkillable", type: "status" },

	"HERO_GENJI": { ow: "Genji", type: "hero" },
	"HERO_LUCIO": { ow: "Lúcio", type: "hero" },
	"HERO_MERCY": { ow: "Mercy", type: "hero" },
	"HERO_ROADHOG": { ow: "Roadhog", type: "hero" },
	"HERO_JUNKRAT": { ow: "Junkrat", type: "hero" },
	"HERO_JUNKER_QUEEN": { ow: "Junker Queen", type: "hero" },
	"HERO_WRECKING_BALL": { ow: "Wrecking Ball", type: "hero" },
	"HERO_RAMATTRA": { ow: "Ramattra", type: "hero" },
	"HERO_ZENYATTA": { ow: "Zenyatta", type: "hero" },
	"HERO_SOLDIER_76": { ow: "Soldier 76", type: "hero" },
	"HERO_SOMBRA": { ow: "Sombra", type: "hero" },
	"HERO_MEI": { ow: "Mei", type: "hero" },
	"HERO_BAPTISTE": { ow: "Baptiste", type: "hero" },
	"HERO_MOIRA": { ow: "Moira", type: "hero" },
	"HERO_BRIGITTE": { ow: "Brigitte", type: "hero" },
	"HERO_LIFEWEAVER": { ow: "Lifeweaver", type: "hero" },
	"HERO_SOJOURN": { ow: "Sojourn", type: "hero" },
	"HERO_BASTION": { ow: "Bastion", type: "hero" },
	"HERO_TORBJORN": { ow: "Torbjörn", type: "hero" },
	"HERO_ECHO": { ow: "Echo", type: "hero" },
	"HERO_WINSTON": { ow: "Winston", type: "hero" },
	"HERO_TRACER": { ow: "Tracer", type: "hero" },
	"HERO_ZARYA": { ow: "Zarya", type: "hero" },
	"HERO_DOOMFIST": { ow: "Doomfist", type: "hero" },
	"HERO_REINHARDT": { ow: "Reinhardt", type: "hero" },
	"HERO_SYMMETRA": { ow: "Symmetra", type: "hero" },
	"HERO_DVA": { ow: "D.Va", type: "hero" },
	"HERO_HANZO": { ow: "Hanzo", type: "hero" },
	"HERO_REAPER": { ow: "Reaper", type: "hero" },
	"HERO_WIDOWMAKER": { ow: "Widowmaker", type: "hero" },
	"HERO_ASHE": { ow: "Ashe", type: "hero" },
	"HERO_SIGMA": { ow: "Sigma", type: "hero" },
	"HERO_ORISA": { ow: "Orisa", type: "hero" },
	"HERO_MCCREE": { ow: "Cassidy", type: "hero" },
	"HERO_CASSIDY": { ow: "Cassidy", type: "hero" },
	"HERO_KIRIKO": { ow: "Kiriko", type: "hero" },
	"HERO_ANA": { ow: "Ana", type: "hero" },
	"HERO_PHARAH": { ow: "Pharah", type: "hero" },
	"HERO_ILLARI": { ow: "Illari", type: "hero" }
};

export const FUNCTIONS: Record<string, { ow: string, args: { type: string, default?: string }[], ret?: string } | undefined> = {
	"disableGameModeHUD": {
		ow: "Disable Game Mode HUD",
		args: [
			{ type: "player" }
		]
	},

	"allPlayers": {
		ow: "All Players",
		args: [
			{ type: "team" }
		]
	},

	"disableMessages": {
		ow: "Disable Messages",
		args: [
			{ type: "player" }
		]
	}
};