import { paraglideVitePlugin } from '@inlang/paraglide-js';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';

const stripSveltekitBaseWarning = () => ({
	name: 'strip-sveltekit-base-warning',
	config(config: { base?: string }) {
		// Ensure SvelteKit doesn't warn about Vite's default base configuration.
		if ('base' in config) {
			delete config.base;
		}
	}
});

export default defineConfig({
	plugins: [
		stripSveltekitBaseWarning(),
		tailwindcss({
			// Disable Lightning CSS optimization to avoid @property warnings during builds.
			optimize: false
		}),
		sveltekit(),
		devtoolsJson(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],
	optimizeDeps: {
		include: ['@testing-library/svelte', 'svelte-portal']
	},
	build: {
		chunkSizeWarningLimit: 2000,
		rollupOptions: {
			onwarn(warning, warn) {
				if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
					return;
				}
				warn(warning);
			}
		}
	},
	resolve: {
		alias: {
			$lib: resolve('./src/lib'),
			$components: resolve('./src/lib/components'),
			$actions: resolve('./src/lib/actions'),
			$header: resolve('./src/lib/header'),
			$models: resolve('./src/lib/models'),
			$server: resolve('./src/lib/server'),
			$stores: resolve('./src/lib/stores'),
			$types: resolve('./src/lib/types'),
			$utils: resolve('./src/lib/utils')
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: [
						'src/**/*.svelte.{test,spec}.{js,ts}',
						'src/lib/actions/**/*.{test,spec}.{js,ts}',
						'src/lib/components/**/*.{test,spec}.{js,ts}'
					],
					exclude: ['src/lib/server/**']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: [
						'src/**/*.svelte.{test,spec}.{js,ts}',
						'src/lib/actions/**/*.{test,spec}.{js,ts}',
						'src/lib/components/**/*.{test,spec}.{js,ts}'
					]
				}
			}
		]
	}
});
