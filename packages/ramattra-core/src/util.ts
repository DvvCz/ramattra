export function dedent(template: TemplateStringsArray, ...subs: any[]): string {
	const middle = String.raw(template, ...subs).trim();
	const lines = middle.split("\n");

	let min = null;
	for (const line of lines) {
		let ptr = 0;
		while (line.charAt(ptr) == "\t") ptr++;

		if (min) {
			if (ptr < min) {
				min = ptr;
			}
		} else {
			min = ptr;
		}

		if (min == 0) break;
	}

	if (min) {
		for (let i = 0; i < lines.length; i++) {
			lines[i] = lines[i].substring(min)
		}

		return lines.join("\n");
	} else {
		return middle;
	}
}