/**
 * Locale workflow helpers for untranslated key detection.
 */
export const findMissingLocaleKeys = (
	base: Record<string, string>,
	locale: Record<string, string>
): string[] => Object.keys(base).filter((key) => !(key in locale));
