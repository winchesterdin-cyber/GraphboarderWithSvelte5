import { chromium } from 'playwright';

(async () => {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	try {
		// Wait for server to start (simple delay for this example, or poll)
		await page.waitForTimeout(5000);

		await page.goto('http://localhost:5173/');

		// Verify H1
		const heading = page.getByRole('heading', { level: 1 });
		await heading.waitFor({ state: 'visible' });

		// Verify it says "GraphQL Endpoint Explorer"
		const text = await heading.textContent();
		if (text?.trim() !== 'GraphQL Endpoint Explorer') {
			throw new Error(`Expected heading to be 'GraphQL Endpoint Explorer', got '${text}'`);
		}

		await page.screenshot({ path: '/home/jules/verification/verification.png' });
		console.log('Verification successful, screenshot saved.');
	} catch (e) {
		console.error('Verification failed:', e);
		process.exit(1);
	} finally {
		await browser.close();
	}
})();
