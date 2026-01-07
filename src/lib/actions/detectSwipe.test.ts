import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { detectSwipe } from './detectSwipe';

// Helper function to create touch events
function createTouchEvent(
	type: 'touchstart' | 'touchmove' | 'touchend',
	clientX: number,
	clientY: number
): TouchEvent {
	const touch = new Touch({
		identifier: Date.now(),
		target: document.createElement('div'),
		clientX,
		clientY
	});

	const touchEvent = new TouchEvent(type, {
		touches: type !== 'touchend' ? [touch] : [],
		targetTouches: [],
		changedTouches: [touch],
		bubbles: true,
		cancelable: true
	});

	return touchEvent;
}

describe('detectSwipe action', () => {
	let element: HTMLElement;

	beforeEach(() => {
		element = document.createElement('div');
		element.setAttribute('data-testid', 'swipe-target');
		document.body.appendChild(element);
		vi.useFakeTimers();
	});

	afterEach(() => {
		document.body.removeChild(element);
		vi.useRealTimers();
	});

	describe('Swipe Detection - Horizontal', () => {
		it('should detect swipe left gesture', () => {
			return new Promise<void>((resolve) => {
				const action = detectSwipe(element);

				element.addEventListener('swipeleft', () => {
					expect(true).toBe(true);
					action.destroy();
					resolve();
				});

				// Simulate swipe left (move from left to right, positive diffX)
				const touchStart = createTouchEvent('touchstart', 100, 100);
				const touchMove = createTouchEvent('touchmove', 50, 100);
				const touchEnd = createTouchEvent('touchend', 50, 100);

				document.dispatchEvent(touchStart);
				document.dispatchEvent(touchMove);
				document.dispatchEvent(touchEnd);
			});
		});

		it('should detect swipe right gesture', () => {
			return new Promise<void>((resolve) => {
				const action = detectSwipe(element);

				element.addEventListener('swiperight', () => {
					expect(true).toBe(true);
					action.destroy();
					resolve();
				});

				// Simulate swipe right (move from right to left, negative diffX)
				const touchStart = createTouchEvent('touchstart', 50, 100);
				const touchMove = createTouchEvent('touchmove', 100, 100);
				const touchEnd = createTouchEvent('touchend', 100, 100);

				document.dispatchEvent(touchStart);
				document.dispatchEvent(touchMove);
				document.dispatchEvent(touchEnd);
			});
		});
	});

	describe('Swipe Detection - Vertical', () => {
		it('should detect swipe up gesture', () => {
			return new Promise<void>((resolve) => {
				const action = detectSwipe(element);

				element.addEventListener('swipeup', () => {
					expect(true).toBe(true);
					action.destroy();
					resolve();
				});

				// Simulate swipe up (move from top to bottom, positive diffY)
				const touchStart = createTouchEvent('touchstart', 100, 100);
				const touchMove = createTouchEvent('touchmove', 100, 50);
				const touchEnd = createTouchEvent('touchend', 100, 50);

				document.dispatchEvent(touchStart);
				document.dispatchEvent(touchMove);
				document.dispatchEvent(touchEnd);
			});
		});

		it('should detect swipe down gesture', () => {
			return new Promise<void>((resolve) => {
				const action = detectSwipe(element);

				element.addEventListener('swipedown', () => {
					expect(true).toBe(true);
					action.destroy();
					resolve();
				});

				// Simulate swipe down (move from bottom to top, negative diffY)
				const touchStart = createTouchEvent('touchstart', 100, 50);
				const touchMove = createTouchEvent('touchmove', 100, 100);
				const touchEnd = createTouchEvent('touchend', 100, 100);

				document.dispatchEvent(touchStart);
				document.dispatchEvent(touchMove);
				document.dispatchEvent(touchEnd);
			});
		});
	});

	describe('Speed Threshold', () => {
		it.skip('should not trigger swipe if speed is too slow', async () => {
			const action = detectSwipe(element);

			const swipeHandler = vi.fn();
			element.addEventListener('swipeleft', swipeHandler);
			element.addEventListener('swiperight', swipeHandler);
			element.addEventListener('swipeup', swipeHandler);
			element.addEventListener('swipedown', swipeHandler);

			// Very slow swipe (minSpeed is 0.1, this should be slower)
			const touchStart = createTouchEvent('touchstart', 100, 100);
			const touchMove = createTouchEvent('touchmove', 102, 100);
			const touchEnd = createTouchEvent('touchend', 102, 100);

			document.dispatchEvent(touchStart);
			vi.advanceTimersByTime(100);
			document.dispatchEvent(touchMove);
			vi.advanceTimersByTime(1000);
			document.dispatchEvent(touchEnd);

			// Wait a bit to ensure no event was fired
			vi.advanceTimersByTime(100);
			expect(swipeHandler).not.toHaveBeenCalled();
			action.destroy();
		});

		it('should trigger swipe if speed is above threshold', () => {
			return new Promise<void>((resolve) => {
				const action = detectSwipe(element);

				element.addEventListener('swipeleft', () => {
					expect(true).toBe(true);
					action.destroy();
					resolve();
				});

				// Fast swipe (speed > 0.1)
				const touchStart = createTouchEvent('touchstart', 100, 100);
				const touchMove = createTouchEvent('touchmove', 50, 100);
				const touchEnd = createTouchEvent('touchend', 50, 100);

				document.dispatchEvent(touchStart);
				document.dispatchEvent(touchMove);
				document.dispatchEvent(touchEnd);
			});
		});
	});

	describe('Lifecycle', () => {
		it('should return an object with destroy method', () => {
			const action = detectSwipe(element);

			expect(action).toHaveProperty('destroy');
			expect(typeof action.destroy).toBe('function');

			action.destroy();
		});
		it('should stop detecting swipes after destroy is called', async () => {
			const action = detectSwipe(element);

			const swipeHandler = vi.fn();
			element.addEventListener('swipeleft', swipeHandler);

			// Destroy before swiping
			action.destroy();

			// Try to swipe after destroy
			const touchStart = createTouchEvent('touchstart', 100, 100);
			const touchMove = createTouchEvent('touchmove', 50, 100);
			const touchEnd = createTouchEvent('touchend', 50, 100);

			document.dispatchEvent(touchStart);
			document.dispatchEvent(touchMove);
			document.dispatchEvent(touchEnd);

			vi.advanceTimersByTime(100);
			expect(swipeHandler).not.toHaveBeenCalled();
		});
	});

	describe('Edge Cases', () => {
		it('should handle touchend without touchmove', async () => {
			const action = detectSwipe(element);

			const swipeHandler = vi.fn();
			element.addEventListener('swipeleft', swipeHandler);

			const touchStart = createTouchEvent('touchstart', 100, 100);
			const touchEnd = createTouchEvent('touchend', 100, 100);

			document.dispatchEvent(touchStart);
			// Skip touchmove
			document.dispatchEvent(touchEnd);

			vi.advanceTimersByTime(100);
			expect(swipeHandler).not.toHaveBeenCalled();
			action.destroy();
		});

		it('should handle touchmove without touchstart', async () => {
			const action = detectSwipe(element);

			const swipeHandler = vi.fn();
			element.addEventListener('swipeleft', swipeHandler);

			// Skip touchstart
			const touchMove = createTouchEvent('touchmove', 50, 100);
			const touchEnd = createTouchEvent('touchend', 50, 100);

			document.dispatchEvent(touchMove);
			document.dispatchEvent(touchEnd);

			vi.advanceTimersByTime(100);
			expect(swipeHandler).not.toHaveBeenCalled();
			action.destroy();
		});
	});

	describe('Event Properties', () => {
		it('should dispatch CustomEvent with correct properties', () => {
			return new Promise<void>((resolve) => {
				const action = detectSwipe(element);

				element.addEventListener('swipeleft', ((event: CustomEvent) => {
					expect(event).toBeInstanceOf(CustomEvent);
					expect(event.type).toBe('swipeleft');
					expect(event.bubbles).toBe(false);
					action.destroy();
					resolve();
				}) as EventListener);

				document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
				document.dispatchEvent(createTouchEvent('touchmove', 50, 100));
				document.dispatchEvent(createTouchEvent('touchend', 50, 100));
			});
		});
	});
});
