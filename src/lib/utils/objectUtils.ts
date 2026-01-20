import { string_transformer } from '$lib/utils/dataStructureTransformers';

export const getPreciseType = (value: unknown): string => {
	return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
};

export const findNestedChildWithMultipleKeysOrIfLastHasQMSargumentsKey = (obj: unknown): Record<string, unknown> | boolean | null => {
	// Check if the input is an object
	if (typeof obj !== 'object' || obj === null) {
		return null;
	}
	const objectKeys = Object.keys(obj)
	const objectKeysLength = objectKeys.length
	if (objectKeysLength > 1) {
		return obj as Record<string, unknown>
	}
	if (obj.hasOwnProperty("QMSarguments") && objectKeysLength == 1) {
		return true
	}
	if (objectKeysLength == 1) {
		return findNestedChildWithMultipleKeysOrIfLastHasQMSargumentsKey(obj[objectKeys[0]])
	}
    return null;
}

export const deleteIfChildrenHaveOneKeyAndLastKeyIsQMSarguments = (obj: unknown): Record<string, unknown> | null => {
	if (getPreciseType(obj) !== 'object' || obj === null) {
		return null;
	}
	///
	///
	for (const key in obj as Record<string, any>) {

		const keys = Object.keys(obj[key])
		const numberOfKeys = keys.length
		if (numberOfKeys == 1 && obj[key][keys[0]] == 'QMSarguments') {
			delete obj[key]
			return
		}
		const result = findNestedChildWithMultipleKeysOrIfLastHasQMSargumentsKey(obj[key])
		if (result === true) {
			delete obj[key]
		}
		if (getPreciseType(result) == 'object') {
			deleteIfChildrenHaveOneKeyAndLastKeyIsQMSarguments(obj[key])
		}
	}
	return obj as Record<string, unknown>
}

export const objectIsEmpty = (obj: Record<string, unknown>): boolean => {
	if (Object.keys(obj).length === 0 && obj.constructor === Object) {
		return true;
	} else {
		return false;
	}
}

export const sortByName = <T extends { name?: string }>(array: T[]): T[] => {
	array?.sort((a, b) => {
		if (a?.name < b?.name) {
			return -1;
		}
		if (a?.name > b?.name) {
			return 1;
		}
		return 0;
	});

	return array;
};

export const filterElFromArr = <T>(arr: T[], undesiredElements: T[] = []): T[] => {
	return arr.filter((el) => {
		return !undesiredElements.includes(el);
	});
};

export const hasDeepProperty = (obj: Record<string, unknown>, propertyPath: string[]): boolean => {
	let currentObj = obj;
	for (let i = 0; i < propertyPath.length; i++) {
		const prop = propertyPath[i];
		if (!currentObj.hasOwnProperty(prop)) {
			return false;
		}
		currentObj = currentObj[prop] as Record<string, unknown>;
	}
	return true;
}

export const passAllObjectValuesThroughStringTransformerAndReturnNewObject = (obj: Record<string, unknown>): Record<string, unknown> => {
	const newObj = { ...obj };

	Object.keys(newObj).forEach((key) => {
		const value = newObj[key];
		const type = getPreciseType(value);

		if (type === 'string') {
			newObj[key] = string_transformer(value);
		} else if (type === 'object') {
			newObj[key] = passAllObjectValuesThroughStringTransformerAndReturnNewObject(value as Record<string, unknown>);
		} else if (type === 'array') {
			newObj[key] = (value as unknown[]).map((item) => {
				const itemType = getPreciseType(item);
				if (itemType === 'string') {
					return string_transformer(item);
				} else if (itemType === 'object') {
					return passAllObjectValuesThroughStringTransformerAndReturnNewObject(item as Record<string, unknown>);
				}
				// Handle array of arrays if needed, but for now just single level array of objects or strings is common
				return item;
			});
		}
	});
	return newObj;
};


export const getValueAtPath = (obj: Record<string, unknown>, path: string[]): unknown => {
	let current = obj;

	for (let i = 0, len = path.length; i < len; i++) {
		current = current?.[path[i]] as Record<string, unknown>;

		// If the current level is undefined, exit early
		if (current === undefined) {
			return undefined;
		}
	}

	return current;
}

export const deleteValueAtPath = (obj: Record<string, unknown>, path: string[]): Record<string, unknown> | void => {
	if (!obj || !path || path.length === 0) {
		// Check for valid input
		console.error('Invalid input');
		return;
	}

	let currentObj = obj;

	for (let i = 0; i < path.length - 1; i++) {
		// Traverse the object to the specified path
		//if (currentObj?.[path[i]] === undefined) {
		if (currentObj[path[i]] === undefined) {
			// If the path does not exist, return
			console.error('Path does not exist');
			return;
		}
		currentObj = currentObj[path[i]] as Record<string, unknown>;
	}

	// Delete the value at the final key in the path
	delete currentObj[path[path.length - 1]];
	return obj;
}

export const setValueAtPath = (
	obj: Record<string, unknown>,
	path: string[],
	value: unknown,
	addPathIfNotExist: boolean = true
): Record<string, unknown> | void => {
	if (!obj || !path || path.length === 0) {
		// Check for valid input
		console.error('Invalid input');
		return;
	}

	let currentObj = obj;

	for (let i = 0; i < path.length - 1; i++) {
		// Traverse the object to the specified path
		//if (currentObj?.[path[i]] === undefined) {
		if (currentObj[path[i]] === undefined) {
			if (addPathIfNotExist) {
				// If the path does not exist, add it
				currentObj[path[i]] = {}
			}
			if (!addPathIfNotExist) {
				// If the path does not exist, return
				console.error('Path does not exist');
				return;
			}
		}
		currentObj = currentObj[path[i]] as Record<string, unknown>;
	}

	// Set the value at the final key in the path
	currentObj[path[path.length - 1]] = value;
	return obj;
}
