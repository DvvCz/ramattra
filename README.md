# Ramattra

A language written in lua that compiles to [Overwatch Workshop Scripts](https://workshop.codes/wiki).

## Example

```rs
event playerDied(victim, attacker, damage, crit, ability, dir) { // Input variables from events
	let players = [victim, attacker]

	players.setInvisible(INVISIBLE_TO_ALL) // Enums as constants
	players.createHUDText(
		"Header",
		"Subheader",
		"Text",

		HUD_LEFT,
		2,

		COLOR_RED,
		COLOR_WHITE,
		COLOR_BLUE,

		HUDEVAL_NONE,
		SPECTATOR_VISIBLE_DEFAULT
	)

	let numbers = <number>[1, 2, 3, 4, 5] // Can annotate array type

	for i in 0..5 { // For loop
		let num = numbers[i]
	}
}
```