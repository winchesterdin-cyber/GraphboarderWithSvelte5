import { getPreciseType } from './typeUtils';

/**
 * Stringifies a value, including functions, into a JSON-compatible string.
 * Functions are serialized as "/Function(fnBody)/".
 * @param data - The value to stringify.
 * @returns The stringified representation.
 */
export const stigifyAll = (data: unknown): string => {
	return JSON.stringify(data, function (key, value) {
		if (typeof value === 'function') {
			return '/Function(' + value.toString() + ')/';
		}
		return value;
	});
};

/**
 * Parses a JSON string that may contain serialized functions.
 * Reverses `stigifyAll`.
 * @param json - The JSON string to parse.
 * @returns The parsed value with functions restored.
 */
export const parseAll = (json: string): unknown => {
	return JSON.parse(json, function (key, value) {
		if (typeof value === 'string' && value.startsWith('/Function(') && value.endsWith(')/')) {
			value = value.substring(10, value.length - 2);
			return (0, eval)('(' + value + ')');
		}
		return value;
	});
};

/**
 * Evaluates a string as JavaScript code or parses it if it contains serialized functions.
 * @param string - The string to evaluate.
 * @returns The evaluated value.
 */
export const stringToJs = (string: unknown): unknown => {
	if (getPreciseType(string) !== 'string') {
		console.warn(
			`expectig string but got ${getPreciseType(string)},will use it as is.If object,you do not need this function,maybe this function was run previously.`,
			{ string }
		);
		return string;
	}
	if ((string as string).includes('/Function') && (string as string).includes(')/')) {
		return parseAll(string as string);
	}
	return new Function(`return ${string}`)();
};

/**
 * Converts an object into its source code string representation.
 * Handles nested objects, arrays, and functions.
 * @param obj - The object to convert.
 * @returns The source code string.
 * @throws If input is not an object.
 */
export const objectToSourceCode = (obj: Record<string, unknown>): string => {
	// Check if the input is an object
	if (typeof obj !== 'object' || obj === null) {
		throw new Error('Input must be an object');
	}

	// Helper function to convert functions to strings
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	function functionToString(fn: Function): string {
		return fn.toString();
	}

	// Recursively convert the object to source code
	function convertObjectToSourceCode(obj: unknown): string {
		if (typeof obj === 'function') {
			return functionToString(obj);
		}

		if (Array.isArray(obj)) {
			return '[' + obj.map(convertObjectToSourceCode).join(', ') + ']';
		}

		if (typeof obj === 'object' && obj !== null) {
			return (
				'{' +
				Object.entries(obj as Record<string, unknown>)
					.map(([key, value]) => {
						if (key.includes('-')) {
							key = `'${key}'`;
						}
						return `${key}: ${convertObjectToSourceCode(value)}`;
					})
					.join(', ') +
				'}'
			);
		}

		// All other types are converted to string literals
		return JSON.stringify(obj);
	}

	return convertObjectToSourceCode(obj);
};
