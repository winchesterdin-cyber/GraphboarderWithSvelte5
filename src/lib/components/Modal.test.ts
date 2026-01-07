import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Modal from './Modal.svelte';

describe('Modal Component', () => {
	describe('Basic Rendering', () => {
		it('should render without errors', () => {
			const { container } = render(Modal);
			expect(container).toBeTruthy();
		});

		it('should accept modalIdetifier prop', () => {
			const { container } = render(Modal, {
				props: { modalIdetifier: 'custom-modal' }
			});
			expect(container).toBeTruthy();
		});

		it('should accept showApplyBtn prop as true', () => {
			const { container } = render(Modal, {
				props: { showApplyBtn: true }
			});
			expect(container).toBeTruthy();
		});

		it('should accept showApplyBtn prop as false', () => {
			const { container } = render(Modal, {
				props: { showApplyBtn: false }
			});
			expect(container).toBeTruthy();
		});
	});

	describe('Event Handling', () => {
		it('should accept mounted event listener', () => {
			const mounted = vi.fn();
			const { container } = render(Modal, {
				props: { onMounted: mounted, modalIdetifier: 'test-modal' }
			});
			expect(container).toBeTruthy();
		});

		it('should accept apply event listener', () => {
			const apply = vi.fn();
			const { container } = render(Modal, {
				props: { onApply: apply }
			});
			expect(container).toBeTruthy();
		});

		it('should accept cancel event listener', () => {
			const cancel = vi.fn();
			const { container } = render(Modal, {
				props: { onCancel: cancel, modalIdetifier: 'test-modal' }
			});
			expect(container).toBeTruthy();
		});
	});

	describe('Props Configuration', () => {
		it('should handle different modalIdentifier values', () => {
			const identifiers = ['modal-1', 'user-settings', 'confirmation-dialog'];

			identifiers.forEach((identifier) => {
				const { container } = render(Modal, {
					props: { modalIdetifier: identifier }
				});
				expect(container).toBeTruthy();
			});
		});
	});

	describe('Component Lifecycle', () => {
		it('should mount successfully', () => {
			const { container } = render(Modal);
			expect(container).toBeTruthy();
		});

		it('should unmount without errors', () => {
			const { unmount } = render(Modal);
			expect(() => unmount()).not.toThrow();
		});
	});

	describe('Multiple Instances', () => {
		it('should support multiple modal instances', () => {
			const modal1 = render(Modal, {
				props: { modalIdetifier: 'modal-1' }
			});

			const modal2 = render(Modal, {
				props: { modalIdetifier: 'modal-2' }
			});

			expect(modal1.container).toBeTruthy();
			expect(modal2.container).toBeTruthy();
		});
	});
});
