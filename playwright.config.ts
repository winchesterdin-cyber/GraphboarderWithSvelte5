import { defineConfig } from '@playwright/test';

// Prevent NO_COLOR/FORCE_COLOR conflicts in Playwright worker output.
delete process.env.NO_COLOR;
delete process.env.FORCE_COLOR;

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		env: {
			NPM_CONFIG_LOGLEVEL: 'error'
		},
		timeout: 120000
	},
	testDir: 'e2e'
});
