import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		outDir: 'build',
		modulePreload: {
			polyfill: false
		},
		target: 'ESNext'
	}
});