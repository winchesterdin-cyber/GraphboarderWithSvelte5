import { stringToQMSString_transformer } from '$lib/utils/dataStructureTransformers';
import { getPreciseType } from './typeUtils';

/**
 * Formats data into a string with a maximum length.
 * @param data - The data to format.
 * @param length - The maximum length of the resulting string.
 * @param alwaysStringyfy - Whether to always stringify the data (default: true).
 * @returns The formatted string, potentially truncated with "...".
 */
export const formatData = (
	data: unknown = '',
	length: number,
	alwaysStringyfy: boolean = true
): string => {
	let string = '';
	let resultingString = '';

	if (alwaysStringyfy) {
		string = JSON.stringify(data);
	} else {
		typeof data === 'string' ? (string = data) : (string = JSON.stringify(data));
	}

	if (string.length >= length) {
		resultingString = `${string.substring(0, length / 2)} ... ${string.substring(
			string.length - length / 2
		)}`;
	} else {
		resultingString = string;
	}

	return resultingString;
};

/**
 * Modifies a string by applying modifiers to text inside and outside of specified boundaries.
 * @param inputString - The input string to modify.
 * @param openBoundryChar - The character marking the start of a boundary (default: '(').
 * @param closeBoundryChar - The character marking the end of a boundary (default: ')').
 * @param insideTextModifier - A function to modify text inside the boundaries.
 * @param outsideTextModifier - A function to modify text outside the boundaries.
 * @param deleteBoundriesIfTextInsideIsEmpty - Whether to delete the boundaries if the text inside becomes empty (default: true).
 * @returns The modified string.
 */
export const smartModifyStringBasedOnBoundries = (
	inputString: string,
	openBoundryChar: string = '(',
	closeBoundryChar: string = ')',
	insideTextModifier: ((text: string) => string) | undefined,
	outsideTextModifier: ((text: string) => string) | undefined,
	deleteBoundriesIfTextInsideIsEmpty: boolean = true
): string => {
	if (!inputString.includes(openBoundryChar)) {
		return inputString;
	}
	const result: string[] = [];
	//let splitByOpened=inputString.split('(')
	const splitByClosed = inputString.split(closeBoundryChar);
	splitByClosed.forEach((element) => {
		const splitByOpen = element.split(openBoundryChar);
		let outsidePart = splitByOpen[0];
		let insidePart = splitByOpen[1];
		if (outsidePart) {
			if (getPreciseType(outsideTextModifier) === 'function') {
				outsidePart = outsideTextModifier!(outsidePart);
			}
			result.push(outsidePart);
		}
		if (insidePart) {
			if (getPreciseType(insideTextModifier) === 'function') {
				insidePart = insideTextModifier!(insidePart);
			}
			if (deleteBoundriesIfTextInsideIsEmpty && insidePart == '') {
				result.push(``);
			} else {
				result.push(`${openBoundryChar}${insidePart}${closeBoundryChar}`);
			}
		}
	});

	return result.join('');
};

/**
 * Replaces the last occurrence of specific substring logic within a string up to a max index.
 * Note: This function seems tailored for a specific parsing logic (replacing ":{" occurrences).
 * @param {string} str - The input string.
 * @param {number} MaxIndex - The maximum index to search backwards from.
 * @param {string} REPLACEMENT_STRING - The string to use as replacement.
 * @returns {string} - The modified string.
 */
function replaceLastOccurrence(str: string, MaxIndex: number, REPLACEMENT_STRING: string): string {
	// Find the index of the first occurrence of ":{" after the first character
	const startIndex = str.indexOf(':{', 1);

	// If the first occurrence is found
	if (startIndex !== -1) {
		// Find the index of the last occurrence of ":{" before the fourth character
		const lastIndex = str.lastIndexOf(':{', MaxIndex);

		// If the last occurrence is found
		if (lastIndex !== -1) {
			// Replace the last occurrence with a new string (e.g., "REPLACEMENT_STRING")
			const replacedString =
				str.substring(0, lastIndex) + REPLACEMENT_STRING + str.substring(lastIndex + 2);

			return replacedString;
		}
	}

	// If no occurrences are found, return the original string
	return str;
}

/**
 * Replaces a substring between two indices.
 * @param {string} string - The original string.
 * @param {number} start - The start index (inclusive).
 * @param {number} end - The end index (exclusive).
 * @param {string} what - The replacement string.
 * @returns {string} - The new string.
 */
const replaceBetween = function (string: string, start: number, end: number, what: string): string {
	return string.substring(0, start) + what + string.substring(end);
};

/**
 * Parses and modifies a string by extracting parenthesized content and transforming it.
 * Used for parsing complex nested string structures.
 * @param {string} input - The input string.
 * @returns {{ modifiedSubstring: string; remainingString: string }} - The processed part and the remainder.
 */
function modifyString(input: string): { modifiedSubstring: string; remainingString: string } {
	// Step 1: Match the first parenthesis and the text inside them
	const matchParenthesis = input.match(/\(([^)]+)\)/);
	let remainingString: string;
	let modifiedSubstring: string;
	if (!matchParenthesis) {
		modifiedSubstring = input;
		remainingString = '';
		return { modifiedSubstring, remainingString };
	}
	const parenhtesisLength = matchParenthesis[0].length;
	const parenhtesisStart = matchParenthesis.index!;
	const parenhtesisEnd = parenhtesisStart + parenhtesisLength;

	//delete matched parenthesis and it's content from string
	input = replaceBetween(input, parenhtesisStart, parenhtesisEnd, '');
	input = replaceLastOccurrence(input, matchParenthesis.index!, matchParenthesis[0] + ':{');
	modifiedSubstring = input.substring(0, parenhtesisEnd);
	remainingString = input.substring(parenhtesisEnd, input.length);
	// Return the original string if no match is found
	return { modifiedSubstring, remainingString };
}

/**
 * Generates a list of substrings from a string, handling nested structures/parentheses.
 * @param string - The input string.
 * @returns An array of substrings.
 */
export const generateListOfSubstrings = (string: string): string[] => {
	const substrings: string[] = [];
	let reachedTheEnd = false;
	while (!reachedTheEnd) {
		const { modifiedSubstring, remainingString } = modifyString(string);
		if (remainingString === '') {
			reachedTheEnd = true;
		}
		substrings.push(modifiedSubstring);
		string = remainingString;
	}
	return substrings;
};

/**
 * Converts a GraphQL argument object to a string representation.
 * @param gqlArgObj - The GraphQL argument object.
 * @returns The string representation of the argument object.
 */
export const gqlArgObjToString = (gqlArgObj: Record<string, unknown>): string => {
	const gqlArgObj_string = JSON.stringify(gqlArgObj);
	if (gqlArgObj_string == '{ }') {
		return '';
	}
	const gqlArgObj_stringModified = gqlArgObj_string
		.replace(/"/g, '')
		.replace(/'/g, `"`)
		.replace(/&Prime;/g, `\\"`)
		.replace(/&prime;/g, `'`)
		.slice(1, -1);
	return gqlArgObj_stringModified;
};

/**
 * Generates a title string from an array of field steps.
 * @param steps - Array of strings representing the steps/path to a field.
 * @returns A joined string representation of the steps.
 */
export const generateTitleFromStepsOfFields = (steps: string[]): string => {
	if (!Array.isArray(steps) || steps.length === 0) {
		return '';
	}
	// Join with a separator, e.g., ' > ' or just return the last element or similar.
	// Based on typical usage 'col-' + ... it might be used for IDs or classes.
	// Let's assume a simple join for now.
	return steps.join('-');
};
