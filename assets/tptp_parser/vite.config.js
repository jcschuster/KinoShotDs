import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss()],
	build: {
		outDir: '../../lib/assets/tptp_parser',
		emptyOutDir: true,
		lib: {
			entry: 'js/main.js',
			name: 'TPTP Parser',
			formats: ['es'],
			fileName: () => 'main.js',
		},
		rollupOptions: {
			external: [],
		},
	},
});
