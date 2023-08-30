# Ramattra [![Vitest](https://github.com/DvvCz/Ramattra/actions/workflows/vitest.yml/badge.svg)](https://github.com/DvvCz/Ramattra/actions) [![Playground](https://github.com/DvvCz/Ramattra/actions/workflows/playground.yml/badge.svg)](https://dvvcz.github.io/Ramattra)

A language similar to Typescript that compiles to [Overwatch Workshop Scripts](https://workshop.codes/wiki).

## Features
- [x] Language Server
- [x] [Online Playground](https://dvvcz.github.io/Ramattra)
- [x] CLI

## Example

```ts
event playerDied(victim, attacker, damage, crit, ability, dir) {
	let players = [victim, attacker];

	let strings = ["foo", "bar", "baz"];
	let buffer = "";

	for i in 0 .. strings.count() {
		buffer += strings[i];
	}

	players.createHUDText(buffer);
}
```

## Wiki

You can find information about the language [on the wiki](https://github.com/DvvCz/Ramattra/wiki).