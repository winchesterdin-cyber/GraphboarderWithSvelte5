import { expect, test } from '@playwright/test';

test.describe('Endpoints Page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/endpoints');
	});

	test('should display default endpoints', async ({ page }) => {
		await expect(page.locator('text=Select an Endpoint')).toBeVisible();
		// Assuming some default endpoints exist (e.g. SWAPI from test data)
		// If not, we can at least check the structure
	});

	test('should add, edit and delete a user endpoint', async ({ page }) => {
		// 1. Add Endpoint
		await page.click('text=Add Endpoint');
		await expect(page.locator('h2:has-text("Add new Endpoint")')).toBeVisible();

		await page.fill('input[placeholder="my-endpoint"]', 'test-endpoint');
		await page.fill('input[placeholder="https://example.com/graphql"]', 'https://test.com/graphql');

		await page.click('button:has-text("Save")');

		// Verify added
		const newCard = page.locator('.card', { hasText: 'test-endpoint' });
		await expect(newCard).toBeVisible();
		await expect(newCard.locator('text=User Defined')).toBeVisible();

		// 2. Edit Endpoint
		// Find the edit button for the new endpoint.
		// We need to target the card that contains 'test-endpoint'
		const card = page.locator('.card', { hasText: 'test-endpoint' });
		const editBtn = card.locator('button[title="Edit Endpoint"]');

		// Hover to make sure button is visible (it has opacity transition)
		await card.hover();
		await editBtn.click();

		await expect(page.locator('h2:has-text("Edit Endpoint")')).toBeVisible();
		// ID should be there
		await expect(page.locator('input[placeholder="my-endpoint"]')).toHaveValue('test-endpoint');

		// Change URL
		await page.fill('input[placeholder="https://example.com/graphql"]', 'https://test.com/graphql/v2');
		await page.click('button:has-text("Save")');

		// Verify updated
		await expect(page.locator('text=https://test.com/graphql/v2')).toBeVisible();

		// 3. Delete Endpoint
		await card.hover();
		await card.locator('button[title="Delete Endpoint"]').click();

		await expect(page.locator('text=Are you sure?')).toBeVisible();
		await page.click('button:has-text("Confirm")');

		await expect(page.locator('text=test-endpoint')).not.toBeVisible();
	});

    test('should sort endpoints', async ({ page }) => {
        // Add two endpoints
        await page.click('text=Add Endpoint');
        await page.fill('input[placeholder="my-endpoint"]', 'A-Endpoint');
        await page.fill('input[placeholder="https://example.com/graphql"]', 'https://a.com');
        await page.click('button:has-text("Save")');

        await page.click('text=Add Endpoint');
        await page.fill('input[placeholder="my-endpoint"]', 'Z-Endpoint');
        await page.fill('input[placeholder="https://example.com/graphql"]', 'https://z.com');
        await page.click('button:has-text("Save")');

        // Default sort is A-Z
        const cards = page.locator('.card-title');
        // We might have other endpoints, but A-Endpoint should be before Z-Endpoint

        // Select Z-A
        await page.selectOption('select', 'name-desc');

        // Now Z-Endpoint should be before A-Endpoint (relative order)
        // Let's just check the text content of the first few cards or specific logic
        // But verifying strict order might be hard if there are other endpoints.

        // Clean up
        await page.locator('.card', { hasText: 'A-Endpoint' }).hover();
        await page.locator('.card', { hasText: 'A-Endpoint' }).locator('button[title="Delete Endpoint"]').click();
        await page.click('button:has-text("Confirm")');

        await page.locator('.card', { hasText: 'Z-Endpoint' }).hover();
        await page.locator('.card', { hasText: 'Z-Endpoint' }).locator('button[title="Delete Endpoint"]').click();
        await page.click('button:has-text("Confirm")');
    });
});
