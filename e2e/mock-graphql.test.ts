import { expect, test } from '@playwright/test';
import {
	startMockGraphqlServer,
	type MockGraphqlServer
} from '../src/lib/server/mockGraphqlServer';

let mockServer: MockGraphqlServer;

test.beforeAll(async () => {
	mockServer = await startMockGraphqlServer();
});

test.afterAll(async () => {
	await mockServer.close();
});

test('can explore a mocked GraphQL endpoint', async ({ page }) => {
	await page.goto('/endpoints');

	await page.click('text=Add Endpoint');
	await page.fill('input[placeholder="my-endpoint"]', 'mock-graphql');
	await page.fill('input[placeholder="https://example.com/graphql"]', mockServer.url);
	await page.click('button:has-text("Save")');

	const card = page.locator('.card', { hasText: 'mock-graphql' });
	await expect(card).toBeVisible();

	await card.click();

	await expect(page.locator('button:has-text("Queries")')).toBeVisible();
	await page.click('button:has-text("Queries")');
	await page.click('button:has-text("Explorer")');

	await expect(page.locator('text=items')).toBeVisible();

	await page.goto('/endpoints');
	const deleteCard = page.locator('.card', { hasText: 'mock-graphql' });
	await deleteCard.hover();
	await deleteCard.locator('button[title="Delete Endpoint"]').click();
	await page.click('button:has-text("Confirm")');
	await expect(page.locator('text=mock-graphql')).not.toBeVisible();
});
