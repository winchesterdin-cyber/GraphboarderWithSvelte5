import { expect, test } from '@playwright/test';
import {
	startMockGraphqlServer,
	type MockGraphqlServer
} from '../src/lib/server/mockGraphqlServer';

let mockServer: MockGraphqlServer;

const registerMockEndpoint = async (page: any, url: string) => {
	await page.goto('/endpoints');
	await page.click('text=Add Endpoint');
	await page.fill('input[placeholder="my-endpoint"]', 'mock-graphql');
	await page.fill('input[placeholder="https://example.com/graphql"]', url);
	await page.click('button:has-text("Save")');
	await expect(page.locator('.card', { hasText: 'mock-graphql' })).toBeVisible();
};

const removeMockEndpoint = async (page: any) => {
	await page.goto('/endpoints');
	const deleteCard = page.locator('.card', { hasText: 'mock-graphql' });
	await deleteCard.hover();
	await deleteCard.locator('button[title="Delete Endpoint"]').click();
	await page.click('button:has-text("Confirm")');
	await expect(page.locator('text=mock-graphql')).not.toBeVisible();
};

test.beforeAll(async () => {
	mockServer = await startMockGraphqlServer();
});

test.afterAll(async () => {
	await mockServer.close();
});

test('queries and mutations pages load for the mock endpoint', async ({ page }) => {
	await registerMockEndpoint(page, mockServer.url);

	await page.goto('/endpoints/mock-graphql/queries/items');
	await expect(page.locator('button:has-text("QMS body")')).toBeVisible();

	await page.goto('/endpoints/mock-graphql/mutations/addItem');
	await expect(page.locator('button:has-text("submit")')).toBeVisible();

	await removeMockEndpoint(page);
});

test('explorer filtering works on query list', async ({ page }) => {
	await registerMockEndpoint(page, mockServer.url);

	await page.goto('/endpoints/mock-graphql/explorer');
	await page.click('button:has-text("Queries")');
	await page.click('button:has-text("Explorer")');

	await page.fill('input[placeholder="Filter (e.g. +user -id)"]', 'items');
	await page.keyboard.press('Enter');
	await expect(page.locator('text=items')).toBeVisible();

	await page.fill('input[placeholder="Filter (e.g. +user -id)"]', 'nonexistent');
	await page.click('button[title="Filter"]');
	await expect(page.locator('text=items')).not.toBeVisible();

	await removeMockEndpoint(page);
});
