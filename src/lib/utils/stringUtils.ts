import { stringToQMSString_transformer } from '$lib/utils/dataStructureTransformers';
import { getPreciseType } from '$lib/utils/objectUtils';

export const formatData = (data: unknown = '', length: number, alwaysStringyfy: boolean = true): string => {
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

export const smartModifyStringBasedOnBoundries = (
	inputString: string,
	openBoundryChar: string = "(",
	closeBoundryChar: string = ")",
	insideTextModifier: ((text: string) => string) | undefined,
	outsideTextModifier: ((text: string) => string) | undefined,
	deleteBoundriesIfTextInsideIsEmpty: boolean = true
): string => {
	if (!inputString.includes(openBoundryChar)) {
		return inputString
	}
	let result: string[] = []
	//let splitByOpened=inputString.split('(')
	const splitByClosed = inputString.split(closeBoundryChar)
	splitByClosed.forEach((element) => {
		const splitByOpen = element.split(openBoundryChar)
		let outsidePart = splitByOpen[0]
		let insidePart = splitByOpen[1]
		if (outsidePart) {
			if (getPreciseType(outsideTextModifier) === 'function') {
				outsidePart = outsideTextModifier!(outsidePart)
			}
			result.push(outsidePart)
		}
		if (insidePart) {
			if (getPreciseType(insideTextModifier) === 'function') {
				insidePart = insideTextModifier!(insidePart)
			}
			if (deleteBoundriesIfTextInsideIsEmpty && insidePart == '') {
				result.push(``)
			} else {
				result.push(`${openBoundryChar}${insidePart}${closeBoundryChar}`)
			}
		}

	});

	return result.join('');
}

function replaceLastOccurrence(str: string, MaxIndex: number, REPLACEMENT_STRING: string): string {
	// Find the index of the first occurrence of ":{" after the first character
	const startIndex = str.indexOf(":{", 1);

	// If the first occurrence is found
	if (startIndex !== -1) {
		// Find the index of the last occurrence of ":{" before the fourth character
		const lastIndex = str.lastIndexOf(":{", MaxIndex);

		// If the last occurrence is found
		if (lastIndex !== -1) {
			// Replace the last occurrence with a new string (e.g., "REPLACEMENT_STRING")
			const replacedString = str.substring(0, lastIndex) + REPLACEMENT_STRING + str.substring(lastIndex + 2);

			return replacedString;
		}
	}

	// If no occurrences are found, return the original string
	return str;
}


const replaceBetween = function (string: string, start: number, end: number, what: string): string {
	return string.substring(0, start) + what + string.substring(end);
};

function modifyString(input: string): { modifiedSubstring: string; remainingString: string } {
	// Step 1: Match the first parenthesis and the text inside them
	const matchParenthesis = input.match(/\(([^)]+)\)/);
	let remainingString: string
	let modifiedSubstring: string
	if (!matchParenthesis) {
		modifiedSubstring = input
		remainingString = ''
		return { modifiedSubstring, remainingString }
	}
	const parenhtesisLength = matchParenthesis[0].length
	const parenhtesisStart = matchParenthesis.index!
	const parenhtesisEnd = parenhtesisStart + parenhtesisLength

	//delete matched parenthesis and it's content from string
	input = replaceBetween(input, parenhtesisStart, parenhtesisEnd, '')
	input = replaceLastOccurrence(input, matchParenthesis.index!, matchParenthesis[0] + ":{")
	modifiedSubstring = input.substring(0, parenhtesisEnd)
	remainingString = input.substring(parenhtesisEnd, input.length)
	// Return the original string if no match is found
	return { modifiedSubstring, remainingString };
}

export const generateListOfSubstrings = (string: string): string[] => {
	const substrings: string[] = []
	let reachedTheEnd = false
	while (!reachedTheEnd) {
		const { modifiedSubstring, remainingString } = modifyString(string)
		if (remainingString === '') {
			reachedTheEnd = true
		}
		substrings.push(modifiedSubstring)
		string = remainingString
	}
	return substrings
}

export const gqlArgObjToString = (gqlArgObj: Record<string, unknown>): string => {
	const gqlArgObj_string = JSON.stringify(gqlArgObj)
	if (gqlArgObj_string == '{ }') {
		return ''
	}
	const gqlArgObj_stringModified = gqlArgObj_string
		.replace(/"/g, '')
		.replace(/'/g, `"`)
		.replace(/&Prime;/g, `\\"`)
		.replace(/&prime;/g, `'`)
		.slice(1, -1);
	return gqlArgObj_stringModified;
};

// Functions below this line are not exported in original usefulFunctions.ts but are used internally
// However, modifyString and replaceBetween etc are used by generateListOfSubstrings which is exported.
// I kept them internal to this module unless they were exported.
// generateListOfSubstrings is exported.
// modifyString, replaceBetween, replaceLastOccurrence were NOT exported in original file (except implicitly if used by exported functions).
// Wait, smartModifyStringBasedOnBoundries IS exported.
// formatData IS exported.
// gqlArgObjToString IS exported.
