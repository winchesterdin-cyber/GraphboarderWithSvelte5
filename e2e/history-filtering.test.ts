import { expect, test } from '@playwright/test';

const seedHistory = () => {
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

	localStorage.setItem('historyQueries', JSON.stringify(items));
};

test.beforeEach(async ({ page }) => {
	await page.addInitScript(seedHistory);
});

test('filters history by type, status, and search', async ({ page }) => {
	await page.goto('/endpoints/mock-graphql/history');

	await expect(page.locator('text=items')).toBeVisible();
	await expect(page.locator('text=addItem')).toBeVisible();

	await page.selectOption('select', { value: 'query' });
	await expect(page.locator('text=items')).toBeVisible();
	await expect(page.locator('text=addItem')).not.toBeVisible();

	await page.selectOption('select', { value: 'all' });
	await page.selectOption('select >> nth=1', { value: 'error' });
	await expect(page.locator('text=addItem')).toBeVisible();
	await expect(page.locator('text=items')).not.toBeVisible();

	await page.selectOption('select', { value: 'all' });
	await page.selectOption('select >> nth=1', { value: 'all' });
	await page.fill('input[placeholder="Search by name..."]', 'items');
	await expect(page.locator('text=items')).toBeVisible();
	await expect(page.locator('text=addItem')).not.toBeVisible();
});

test('removes a history item from the list', async ({ page }) => {
	await page.goto('/endpoints/mock-graphql/history');

	const row = page.locator('tr', { hasText: 'items' });
	await expect(row).toBeVisible();

	page.once('dialog', (dialog) => dialog.accept());
	await row.locator('button[aria-label="Delete history item"]').click();

	await expect(page.locator('text=items')).not.toBeVisible();
});
