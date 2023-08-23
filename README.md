# Ramattra [![Vitest](https://github.com/DvvCz/Ramattra/actions/workflows/vitest.yml/badge.svg)](https://github.com/DvvCz/Ramattra/actions) [![Playground](https://github.com/DvvCz/Ramattra/actions/workflows/playground.yml/badge.svg)](https://dvvcz.github.io/Ramattra)

A language similar to Typescript that compiles to [Overwatch Workshop Scripts](https://workshop.codes/wiki).

## Features
- [x] Language Server
- [x] [Online Playground](https://dvvcz.github.io/Ramattra)
- [x] CLI

## Example

```ts
event playerDied(victim, attacker, damage, crit, ability, dir) { // Explicit event variables.
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

	for i in 0..5 {
		let num = numbers[i]
	}
}
```

## Wiki

You can find information about the language [on the wiki](https://github.com/DvvCz/Ramattra/wiki).