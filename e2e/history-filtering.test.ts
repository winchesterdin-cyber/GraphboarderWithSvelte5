import { expect, test } from '@playwright/test';
import {
	startMockGraphqlServer,
	type MockGraphqlServer
} from '../src/lib/server/mockGraphqlServer';

let mockServer: MockGraphqlServer;

const seedHistory = ({ url }: { url: string }) => {
	const endpoints = [
		{
			id: 'mock-graphql',
			url
		}
	];

	const items = [
		{
			id: 'hist-1',
			endpointId: 'mock-graphql',
			queryName: 'items',
			type: 'query',
			args: {},
			cols: [],
			timestamp: 100,
			duration: 20,
			status: 'success',
			queryBody: 'query { items { id } }'
		},
		{
			id: 'hist-2',
			endpointId: 'mock-graphql',
			queryName: 'addItem',
			type: 'mutation',
			args: { name: 'Alpha' },
			cols: [],
			timestamp: 200,
			duration: 30,
			status: 'error',
			queryBody: 'mutation { addItem(name: "Alpha") { id } }'
		},
		{
			id: 'hist-3',
			endpointId: 'other-endpoint',
			queryName: 'ignored',
			type: 'query',
			args: {},
			cols: [],
			timestamp: 300,
			duration: 40,
			status: 'success',
			queryBody: 'query { ignored }'
		}
	];

	localStorage.setItem('localStorageEndpoints', JSON.stringify(endpoints));
	localStorage.setItem('historyQueries', JSON.stringify(items));
};

test.beforeAll(async () => {
	mockServer = await startMockGraphqlServer();
});

test.afterAll(async () => {
	await mockServer.close();
});

test.beforeEach(async ({ page }) => {
	await page.addInitScript(seedHistory, { url: mockServer.url });
});

test('filters history by type, status, and search', async ({ page }) => {
	await page.goto('/endpoints/mock-graphql/history');

	await expect(page.getByRole('button', { name: 'items' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'addItem' })).toBeVisible();

	await page.locator('[data-testid="history-type-filter"]').selectOption({ value: 'query' });
	await expect(page.getByRole('button', { name: 'items' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'addItem' })).not.toBeVisible();

	await page.locator('[data-testid="history-type-filter"]').selectOption({ value: 'all' });
	await page.locator('[data-testid="history-status-filter"]').selectOption({ value: 'error' });
	await expect(page.getByRole('button', { name: 'addItem' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'items' })).not.toBeVisible();

	await page.locator('[data-testid="history-type-filter"]').selectOption({ value: 'all' });
	await page.locator('[data-testid="history-status-filter"]').selectOption({ value: 'all' });
	await page.locator('[data-testid="history-search"]').fill('items');
	await expect(page.getByRole('button', { name: 'items' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'addItem' })).not.toBeVisible();
});

test('removes a history item from the list', async ({ page }) => {
	await page.goto('/endpoints/mock-graphql/history');

	const row = page.locator('tr', { hasText: 'items' });
	await expect(row).toBeVisible();

	page.once('dialog', (dialog) => dialog.accept());
	await row.locator('button[aria-label="Delete history item"]').click();

	await expect(page.locator('text=items')).not.toBeVisible();
});
