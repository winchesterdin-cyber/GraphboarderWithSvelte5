/**
 * specific type checking
 * @param {unknown} value
 * @returns {string} type
 */
export const getPreciseType = (value: unknown): string => {
	return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
};
