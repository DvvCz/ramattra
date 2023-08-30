import { defineConfig } from "vite";
import { preact } from "@preact/preset-vite";

export default defineConfig({
	plugins: [preact()],
	base: "/Ramattra/",
	build: {
		minify: "esbuild",
	},
	resolve: {
		preserveSymlinks: true,
		alias: {
			events: "events"
		}
	}
});