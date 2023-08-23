import { defineConfig } from "vite";
import { preact } from "@preact/preset-vite";

export default defineConfig({
	plugins: [preact()],
	base: "/Ramattra/",
	resolve: {
		preserveSymlinks: true
	}
});