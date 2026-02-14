import { expect, test } from '@playwright/test';

test('root layout visual baseline', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveScreenshot('root-layout.png', { fullPage: true });
});
