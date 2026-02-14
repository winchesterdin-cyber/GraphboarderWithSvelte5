/**
 * Accessibility helpers that standardize keyboard-focus behavior.
 */
export const focusElementById = (id: string): boolean => {
	if (typeof document === 'undefined') {
		return false;
	}

	const target = document.getElementById(id);
	if (!target) {
		return false;
	}

	target.focus();
	return true;
};
