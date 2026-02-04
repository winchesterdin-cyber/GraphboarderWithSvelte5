import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import CommandPalette from './CommandPalette.svelte';
import { appContext } from '$lib/stores/appContextStore';
import { get } from 'svelte/store';
import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock page state
vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/') }
}));

describe('CommandPalette', () => {
	beforeAll(() => {
		// Mock HTMLDialogElement methods usually missing in JSDOM/Browser environment if not present
		if (!window.HTMLDialogElement.prototype.showModal) {
			window.HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
				this.open = true;
			};
			window.HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
				this.open = false;
			};
		}
	});

	beforeEach(() => {
		appContext.set({ endpointInfo: null, schemaData: null });
		vi.mocked(goto).mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it('should check if component renders (hidden by default)', () => {
		const { container } = render(CommandPalette);
		const dialog = container.querySelector('dialog');
		expect(dialog).toBeTruthy();
		expect(dialog?.open).toBeFalsy();
	});

	it('should open on Ctrl+K', async () => {
		const { container } = render(CommandPalette);
		const dialog = container.querySelector('dialog');

		await fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
		expect(dialog?.open).toBeTruthy();
	});

	it('should show global links', async () => {
		const { getByText } = render(CommandPalette);
		await fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

		expect(getByText('Home')).toBeTruthy();
		expect(getByText('Endpoints')).toBeTruthy();
	});

	it('should show context links when context is available', async () => {
		const mockEndpointInfo = writable({ id: 'test-endpoint', url: 'http://test' });
		const mockSchemaData = writable({
			isReady: true,
			queryFields: [{ name: 'getUser', description: 'Get user' }],
			mutationFields: []
		});

		// Update global store
		appContext.set({
			endpointInfo: mockEndpointInfo as any,
			schemaData: mockSchemaData as any
		});

		const { getByText, findByText } = render(CommandPalette);
		await fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

		expect(await findByText('Explorer')).toBeTruthy();
		expect(await findByText('getUser')).toBeTruthy();
	});

	it('should navigate on selection', async () => {
		const { getByText } = render(CommandPalette);
		await fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

		const homeLink = getByText('Home');
		// The click might be on the button which wraps the text
		// fireEvent.click bubbles, so clicking text should trigger button
		await fireEvent.click(homeLink);

		expect(goto).toHaveBeenCalledWith('/');
	});
});
