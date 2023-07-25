# Ramattra

A language written in lua that compiles to [Overwatch Workshop Scripts](https://workshop.codes/wiki).

## Example

```rs
event client(ply) { // Input variables from events.
	let x = 5 // Variables which are stored in a single global array

	disableGameModeHUD(ply) // Calling functions

	ply.disableGameModeHUD() // Can call them as methods, as well.

	if true { // If syntax builtin
		let y = "Hello, string"
		ply.disableMessages()
	}


	for x in 0..3 {
		// for loop
	}

	// More complex method call example
	// Enums are built in global constants.
	(TEAM_1.allPlayers()).createHUDText("Header", "Subheader", "Text", HUD_LEFT, x, COLOR_RED, COLOR_WHITE, COLOR_BLUE, HUDEVAL_NONE, SPECTATOR_VISIBLE_DEFAULT)
}

event playerDied(victim, attacker, damage, crit, ability, dir) {
	let x = 2.pow(4)

	(TEAM_1.allPlayers()).createHUDText(
		"Header",
		"Subheader",
		"Text",

		HUD_LEFT,
		x,

		COLOR_RED,
		COLOR_WHITE,
		COLOR_BLUE,

		HUDEVAL_NONE,
		SPECTATOR_VISIBLE_DEFAULT
	)

	let id = lastTextID()
	destroyHUDText(id)
}
```