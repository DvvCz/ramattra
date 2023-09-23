import { type Type, native, array, number, string, boolean, union, any, variadic } from "../typing";

export const EVENTS: Record<string, { ow: string, args: { type: Type, ow: string }[] }> = {
	"client": {
		ow: "Ongoing - Each Player",
		args: [
			{ type: native("player"), ow: "Event Player" }
		]
	},

	"server": {
		ow: "Ongoing - Global",
		args: []
	},

	"playerDied": {
		ow: "Player Died",
		args: [
			{ type: native("player"), ow: "Victim" },
			{ type: native("player"), ow: "Attacker" },
			{ type: number, ow: "Event Damage" },
			{ type: boolean, ow: "Event Was Critical Hit" },
			{ type: native("button"), ow: "Event Ability" },
			{ type: native("vector"), ow: "Event Direction" }
		]
	},

	"playerTookDamage": {
		ow: "Player Took Damage",
		args: [
			{ type: native("player"), ow: "Event Player" },
			{ type: number, ow: "Event Damage" },
			{ type: native("player"), ow: "Attacker" },
			{ type: boolean, ow: "Event Was Critical Hit" },
			{ type: native("ability"), ow: "Event Ability" },
			{ type: native("vector"), ow: "Event Direction" }
		]
	},

	"playerDealtDamage": {
		ow: "Player Dealt Damage",
		args: [
			{ type: native("player"), ow: "Event Player" },
			{ type: number, ow: "Event Damage" },
			{ type: native("player"), ow: "Attacker" },
			{ type: boolean, ow: "Event Was Critical Hit" },
			{ type: native("ability"), ow: "Event Ability" },
			{ type: native("vector"), ow: "Event Direction" }
		]
	},
};

export const CONSTANTS: Record<string, { ow: string, type: Type }> = {
	"TEAM_ALL": { ow: "All Teams", type: native("team") },
	"TEAM_1": { ow: "Team 1", type: native("team") },
	"TEAM_2": { ow: "Team 2", type: native("team") },

	"COLOR_WHITE": { ow: "Color(White)", type: native("color") },
	"COLOR_BLUE": { ow: "Color(Blue)", type: native("color") },
	"COLOR_LIME": { ow: "Color(Lime Green)", type: native("color") },
	"COLOR_AQUA": { ow: "Color(Aqua)", type: native("color") },
	"COLOR_SKY": { ow: "Color(Sky Blue)", type: native("color") },
	"COLOR_GRAY": { ow: "Color(Gray)", type: native("color") },
	"COLOR_ROSE": { ow: "Color(Rose)", type: native("color") },
	"COLOR_VIOLET": { ow: "Color(Violet)", type: native("color") },
	"COLOR_YELLOW": { ow: "Color(Yellow)", type: native("color") },
	"COLOR_GREEN": { ow: "Color(Green)", type: native("color") },
	"COLOR_RED": { ow: "Color(Red)", type: native("color") },
	"COLOR_BLACK": { ow: "Color(Black)", type: native("color") },
	"COLOR_TURQUOISE": { ow: "Color(Turquoise)", type: native("color") },
	"COLOR_ORANGE": { ow: "Color(Orange)", type: native("color") },
	"COLOR_PURPLE": { ow: "Color(Purple)", type: native("color") },

	"COLOR_TEAM_1": { ow: "Color(Team 1)", type: native("color") },
	"COLOR_TEAM_2": { ow: "Color(Team 2)", type: native("color") },

	"HUD_LEFT": { ow: "Left", type: native("hudpos") },
	"HUD_TOP": { ow: "Top", type: native("hudpos") },
	"HUD_RIGHT": { ow: "Right", type: native("hudpos") },

	"HUDEVAL_NONE": { ow: "None", type: native("hudeval") },

	"SPECTATOR_VISIBLE_DEFAULT": { ow: "Default Visibility", type: native("visibility") },
	"SPECTATOR_VISIBLE_ALWAYS": { ow: "Visible Always", type: native("visibility") },
	"SPECTATOR_VISIBLE_NEVER": { ow: "Visible Never", type: native("visibility") },

	"INVISIBLE_TO_ALL": { ow: "All", type: native("invis") },
	"INVISIBLE_TO_ENEMIES": { ow: "Enemies", type: native("invis") },
	"INVISIBLE_TO_NONE": { ow: "None", type: native("invis") },

	"RELATIVE_TO_WORLD": { ow: "To World", type: native("relativity") },
	"RELATIVE_TO_PLAYER": { ow: "To Player", type: native("relativity") },

	"STATUS_ASLEEP": { ow: "Asleep", type: native("status") },
	"STATUS_BURNING": { ow: "Burning", type: native("status") },
	"STATUS_FROZEN": { ow: "Frozen", type: native("status") },
	"STATUS_HACKED": { ow: "Hacked", type: native("status") },
	"STATUS_INVINCIBLE": { ow: "Invincible", type: native("status") },
	"STATUS_KNOCKED_DOWN": { ow: "Knocked Down", type: native("status") },
	"STATUS_PHASED_OUT": { ow: "Phased Out", type: native("status") },
	"STATUS_ROOTED": { ow: "Rooted", type: native("status") },
	"STATUS_STUNNED": { ow: "Stunned", type: native("status") },
	"STATUS_UNKILLABLE": { ow: "Unkillable", type: native("status") },

	"HERO_GENJI": { ow: "Genji", type: native("hero") },
	"HERO_LUCIO": { ow: "Lúcio", type: native("hero") },
	"HERO_MERCY": { ow: "Mercy", type: native("hero") },
	"HERO_ROADHOG": { ow: "Roadhog", type: native("hero") },
	"HERO_JUNKRAT": { ow: "Junkrat", type: native("hero") },
	"HERO_JUNKER_QUEEN": { ow: "Junker Queen", type: native("hero") },
	"HERO_WRECKING_BALL": { ow: "Wrecking Ball", type: native("hero") },
	"HERO_RAMATTRA": { ow: "Ramattra", type: native("hero") },
	"HERO_ZENYATTA": { ow: "Zenyatta", type: native("hero") },
	"HERO_SOLDIER_76": { ow: "Soldier 76", type: native("hero") },
	"HERO_SOMBRA": { ow: "Sombra", type: native("hero") },
	"HERO_MEI": { ow: "Mei", type: native("hero") },
	"HERO_BAPTISTE": { ow: "Baptiste", type: native("hero") },
	"HERO_MOIRA": { ow: "Moira", type: native("hero") },
	"HERO_BRIGITTE": { ow: "Brigitte", type: native("hero") },
	"HERO_LIFEWEAVER": { ow: "Lifeweaver", type: native("hero") },
	"HERO_SOJOURN": { ow: "Sojourn", type: native("hero") },
	"HERO_BASTION": { ow: "Bastion", type: native("hero") },
	"HERO_TORBJORN": { ow: "Torbjörn", type: native("hero") },
	"HERO_ECHO": { ow: "Echo", type: native("hero") },
	"HERO_WINSTON": { ow: "Winston", type: native("hero") },
	"HERO_TRACER": { ow: "Tracer", type: native("hero") },
	"HERO_ZARYA": { ow: "Zarya", type: native("hero") },
	"HERO_DOOMFIST": { ow: "Doomfist", type: native("hero") },
	"HERO_REINHARDT": { ow: "Reinhardt", type: native("hero") },
	"HERO_SYMMETRA": { ow: "Symmetra", type: native("hero") },
	"HERO_DVA": { ow: "D.Va", type: native("hero") },
	"HERO_HANZO": { ow: "Hanzo", type: native("hero") },
	"HERO_REAPER": { ow: "Reaper", type: native("hero") },
	"HERO_WIDOWMAKER": { ow: "Widowmaker", type: native("hero") },
	"HERO_ASHE": { ow: "Ashe", type: native("hero") },
	"HERO_SIGMA": { ow: "Sigma", type: native("hero") },
	"HERO_ORISA": { ow: "Orisa", type: native("hero") },
	"HERO_MCCREE": { ow: "Cassidy", type: native("hero") },
	"HERO_CASSIDY": { ow: "Cassidy", type: native("hero") },
	"HERO_KIRIKO": { ow: "Kiriko", type: native("hero") },
	"HERO_ANA": { ow: "Ana", type: native("hero") },
	"HERO_PHARAH": { ow: "Pharah", type: native("hero") },
	"HERO_ILLARI": { ow: "Illari", type: native("hero") },

	"ROUND_NEAREST": { ow: "To Nearest", type: native("rounding") },
	"ROUND_UP": { ow: "Up", type: native("rounding") },
	"ROUND_DOWN": { ow: "Down", type: native("rounding") },
};

export const FUNCTIONS: Record<string, { ow: string, args: { type: Type, default?: string }[], ret?: Type } | undefined> = {
	"disableGameModeHUD": { ow: "Disable Game Mode HUD", args: [{ type: native("player") }] },

	"createHUDText": {
		ow: "Create HUD Text",
		args: [
			{ type: union(array(native("player")), native("player")) },
			{ type: string },
			{ type: string, default: "0" },
			{ type: string, default: "0" },
			{ type: native("hudpos"), default: "Left" },
			{ type: number, default: "0" },
			{ type: native("color"), default: "Color(White)" },
			{ type: native("color"), default: "Color(White)" },
			{ type: native("color"), default: "Color(White)" },
			{ type: native("hudeval"), default: "None" },
			{ type: native("visibility"), default: "Default Visibility" },
		],
	},

	"lastTextID": {
		ow: "Last Text ID",
		args: [],
		ret: native("textid"),
	},

	"destroyHUDText": {
		ow: "Destroy HUD Text",
		args: [{ type: native("textid") }],
	},

	"format": { ow: "Custom String", args: [{ type: string }, { type: variadic(any) }], ret: string },

	// "wait": { ow: "Wait", args: [ "number" } },
	"disableMessages": { ow: "Disable Messages", args: [{ type: native("player") }] },

	"allPlayers": { ow: "All Players", args: [{ type: native("team") }], ret: array(native("player")) },

	// Player | Player[]
	"setAbility1Enabled": { ow: "Set Ability 1 Enabled", args: [{ type: union(array(native("player")), native("player")) }, { type: boolean }] },
	"setAbility2Enabled": { ow: "Set Ability 2 Enabled", args: [{ type: union(array(native("player")), native("player")) }, { type: boolean }] },
	"setAbilityCharge": { ow: "Set Ability Charge", args: [{ type: native("player") }, { type: native("button") }, { type: number }] },
	"setAbilityCooldown": { ow: "Set Ability Cooldown", args: [{ type: native("player") }, { type: native("button") }, { type: number }] },
	"setAbilityResource": { ow: "Set Ability Resource", args: [{ type: union(array(native("player")), native("player")) }, { type: native("button") }, { type: number }] },
	"setAimSpeed": { ow: "Set Aim Speed", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setAmmo": { ow: "Set Ammo", args: [{ type: union(array(native("player")), native("player")) }, { type: number }, { type: number }] },
	"setCrouchEnabled": { ow: "Set Crouch Enabled", args: [{ type: union(array(native("player")), native("player")) }, { type: boolean }] },
	"setDamageDealt": { ow: "Set Damage Dealt", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setDamageReceived": { ow: "Set Damage Received", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setDeathEnvironmentCredit": { ow: "Set Environment Credit Player", args: [{ type: union(array(native("player")), native("player")) }, { type: union(array(native("player")), native("player")) }] },
	"setFacing": { ow: "Set Facing", args: [{ type: union(array(native("player")), native("player")) }, { type: native("vector") }, { type: native("relativity") }] },
	"setHealingDealt": { ow: "Set Healing Dealt", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setHealingReceived": { ow: "Set Healing Received", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setInvisible": { ow: "Set Invisible", args: [{ type: union(array(native("player")), native("player")) }, { type: native("invis"), default: "All" }] },
	"setJumpEnabled": { ow: "Set Jump Enabled", args: [{ type: union(array(native("player")), native("player")) }, { type: boolean }] },
	"setJumpVerticalSpeed": { ow: "Set Jump Vertical Speed", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setKnockbackDealt": { ow: "Set Knockback Dealt", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setKnockbackReceived": { ow: "Set Knockback Received", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setMaxAmmo": { ow: "Set Max Ammo", args: [{ type: union(array(native("player")), native("player")) }, { type: number }, { type: number }] },
	"setMaxHealth": { ow: "Set Max Health", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setMeleeEnabled": { ow: "Set Melee Enabled", args: [{ type: union(array(native("player")), native("player")) }, { type: boolean }] },
	"setMoveSpeed": { ow: "Set Melee Enabled", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setAllowedHeroes": { ow: "Set Player Allowed Heroes", args: [{ type: union(array(native("player")), native("player")) }, { type: native("hero|array<hero>") }] },
	"setHealth": { ow: "Set Player Health", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setScore": { ow: "Set Player Score", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setPrimaryFireEnabled": { ow: "Set Primary Fire Enabled", args: [{ type: union(array(native("player")), native("player")) }, { type: boolean }] },
	"setProjectileGravity": { ow: "Set Projectile Gravity", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setProjectileSpeed": { ow: "Set Projectile Speed", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setReloadEnabled": { ow: "Set Reload Enabled", args: [{ type: union(array(native("player")), native("player")) }, { type: boolean }] },
	"setRespawnMaxTime": { ow: "Set Respawn Max Time", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setSecondaryFireEnabled": { ow: "Set Secondary Fire Enabled", args: [{ type: union(array(native("player")), native("player")) }, { type: boolean }] },
	"setStatus": { ow: "Set Status", args: [{ type: union(array(native("player")), native("player")) }, { type: native("player") }, { type: native("status") }, { type: number }] },
	"setUltimateEnabled": { ow: "Set Ultimate Ability Enabled", args: [{ type: union(array(native("player")), native("player")) }, { type: boolean }] },
	"setUltimateCharge": { ow: "Set Ultimate Charge", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },
	"setWeapon": { ow: "Set Weapon", args: [{ type: union(array(native("player")), native("player")) }, { type: number }] },

	// Player
	"getHero": { ow: "Hero Of", args: [{ type: native("player") }], ret: native("hero") },
	"getHealth": { ow: "Health", args: [{ type: native("player") }], ret: number },

	// Number
	"round": { ow: "Round To Integer", args: [{ type: number }, { type: native("rounding"), default: "To Nearest" }], ret: number },
	"ceil": { ow: "Round To Integer", args: [{ type: number }, { type: native("rounding"), default: "Up" }], ret: number },
	"floor": { ow: "Round To Integer", args: [{ type: number }, { type: native("rounding"), default: "Down" }], ret: number },
	"pow": { ow: "Raise To Power", args: [{ type: number }, { type: number }], ret: number },

	// Vector
	"Vector": { ow: "Vector", args: [{ type: number }, { type: number }, { type: number }], ret: native("vector") },
	"cross": { ow: "Cross Product", args: [{ type: native("vector") }, { type: native("vector") }], ret: native("vector") },
	"dot": { ow: "Dot Product", args: [{ type: native("vector") }, { type: native("vector") }], ret: number },
	"towards": { ow: "Vector Towards", args: [{ type: native("vector") }, { type: native("vector") }], ret: native("vector") },

	"count": { ow: "Count Of", args: [{ type: array(any) }], ret: native("number") }
};