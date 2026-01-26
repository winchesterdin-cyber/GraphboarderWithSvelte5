import { get } from 'svelte/store';
import type { TableColumnData, ActiveArgumentData, EndpointInfoStore } from '$lib/types';

/**
 * Comparator function for sorting based on multiple columns.
 * @param array An array of [valA, valB] pairs.
 * @returns -1 if A < B, 1 if A > B, 0 if equal.
 */
export const sortingFunctionMutipleColumnsGivenArray = (array: [unknown, unknown][]): number => {
	let maxIndex = array.length - 1;
	const check = (currentIndex: number): number => {
		const column = array[currentIndex];
		const valA = column[0] as any;
		const valB = column[1] as any;

		if (valA < valB) {
			return -1;
		}
		if (valA > valB) {
			return 1;
		}
		if (currentIndex + 1 <= maxIndex) {
			return check(currentIndex + 1);
		}
		return 0;
	};
	return check(0);
};

/**
 * Sorts endpoints by ID and optionally filters out non-maintained ones.
 * @param endpoints Array of endpoint objects.
 * @param filterOutIfNotMaintained Boolean to filter out non-maintained endpoints.
 * @returns Sorted (and filtered) array of endpoints.
 */
export const getSortedAndOrderedEndpoints = <
	T extends { id: string | number; isMaintained?: boolean }
>(
	endpoints: T[],
	filterOutIfNotMaintained: boolean = false
): T[] => {
	const sortedEndpoints = endpoints.sort((a, b) => {
		if (a.id > b.id) {
			return 1;
		}
		if (a.id < b.id) {
			return -1;
		}
		return 0;
	});
	if (!filterOutIfNotMaintained) {
		return sortedEndpoints;
	}
	return sortedEndpoints.filter((endpoint) => {
		return endpoint.isMaintained;
	});
};

/**
 * Creates a copy of an endpoint with a new ID and description.
 * @param endpointToDuplicate The endpoint object to copy.
 * @param existingEndpoints The current list of endpoints (unused in return but likely for context).
 * @returns A new array of endpoints including the duplicate (wait, implementation returns array).
 */
export const duplicateEndpoint = (endpointToDuplicate: any, existingEndpoints: any) => {
	const newEndpoint = {
		...endpointToDuplicate,
		id: Date.now(),
		description: `Copy of ${endpointToDuplicate.description}`
	};
	return [...existingEndpoints, newEndpoint];
};

/**
 * Resolves the steps of fields required to fetch data for a specific column.
 * @param colInfo Column metadata.
 * @param stepsOfFieldsInput Optional override for steps.
 * @returns Array of field names representing the path to data.
 */
export const getStepsOfFieldsForDataGetter = (
	colInfo: TableColumnData | undefined,
	stepsOfFieldsInput?: string[]
): string[] => {
	const stepsOfFieldsOBJ = colInfo?.stepsOfFieldsOBJ;
	const stepsOfFields = colInfo?.stepsOfFields;
	const stepsOfFieldsForDataGetter = colInfo?.stepsOfFieldsForDataGetter;

	if (stepsOfFieldsInput) {
		return stepsOfFieldsInput;
	}
	if (stepsOfFieldsForDataGetter) {
		return stepsOfFieldsForDataGetter;
	}
	if (stepsOfFields) {
		return stepsOfFields;
	}
	// Warning: stepsOfFieldsOBJ path extraction logic removed as per review comment in original code (was empty).
	return [];
};

/**
 * Traverses a result object using a path of field names to extract a specific value.
 * Handles nested arrays by mapping over them.
 * @param colInfo Column metadata (optional).
 * @param row_resultData The data object to traverse.
 * @param stepsOfFieldsInput Path to the data.
 * @returns The extracted value, or null/undefined.
 */
export const getDataGivenStepsOfFields = (
	colInfo: TableColumnData | undefined,
	row_resultData: unknown,
	stepsOfFieldsInput?: string[]
): unknown => {
	const stepsOfFields = getStepsOfFieldsForDataGetter(colInfo, stepsOfFieldsInput);
	if (stepsOfFields.length === 0) {
		return row_resultData;
	}

	const handleStep = (step: string, colResultData: unknown): unknown => {
		// Handle null/undefined cases explicitly
		if (colResultData === undefined && row_resultData === null) return null;
		if (colResultData === undefined && Array.isArray(row_resultData)) return row_resultData[0];
		if (colResultData !== undefined && colResultData === null) return null;

		// Fallback to row_resultData check if colResultData is undefined
		if (colResultData === undefined && (row_resultData as any)?.[step] !== undefined) {
			return (row_resultData as any)[step];
		}

		if (colResultData === undefined) return row_resultData;
		if (colResultData === null) return null;

		if (Array.isArray(colResultData)) {
			if (colResultData.length === 0 && colResultData?.[0]?.[step] !== undefined) {
				return colResultData[0][step];
			}

			// Map over array if it has elements
			if (colResultData.length > 0) {
				return colResultData.map((element) => {
					// Recursive call for each element
					return handleStep(step, element?.[step]);
				});
			}
		}

		if ((colResultData as any)?.[step] !== undefined) {
			return (colResultData as any)[step];
		}
		return colResultData;
	};

	let colResultData: unknown;
	// Iterate steps
	stepsOfFields.every((step) => {
		colResultData = handleStep(step, colResultData);
		return true;
	});

	return colResultData;
};

/**
 * Helper to get cell data for a table.
 * @param rowData The full row object.
 * @param colData The column definition.
 * @param index Index of the row (or column? usage implies row index access if rowData is array-like).
 * @returns The cell value.
 */
export const getTableCellData = (
	rowData: unknown,
	colData: TableColumnData,
	index: number
): unknown => {
	let data;
	if (rowData) {
		if ((rowData as any)[index] !== undefined) {
			data = getDataGivenStepsOfFields(colData, (rowData as any)[index]);
		} else {
			data = getDataGivenStepsOfFields(colData, rowData);
		}
	} else {
		data = 'loading...';
	}
	return data;
};

/**
 * Checks if an active argument is valid to run in a query.
 * Validates against list/non-null constraints.
 * @param arg The active argument data.
 * @returns True if valid, false otherwise.
 */
export const argumentCanRunQuery = (arg: ActiveArgumentData): boolean => {
	const {
		inUse,
		chd_dispatchValue,
		dd_kindEl,
		dd_kindEl_NON_NULL,
		dd_kindList,
		dd_kindList_NON_NULL
	} = arg;

	if (!inUse) {
		return true;
	}
	if (dd_kindList && !Array.isArray(chd_dispatchValue)) {
		return false;
	}
	if (dd_kindList_NON_NULL && chd_dispatchValue == null) {
		return false;
	}
	if (dd_kindEl && (chd_dispatchValue == undefined || (chd_dispatchValue as any).length == 0)) {
		return false;
	}
	if (chd_dispatchValue == undefined) {
		return false;
	}
	return true;
};

/**
 * Generates a new active argument data object.
 * @param stepsOfFields Path to the argument field.
 * @param type Type information.
 * @param extraData Additional properties.
 * @returns A new ActiveArgumentData object.
 */
export const generateNewArgData = (
	stepsOfFields: string[],
	type: Partial<any>, // Partial<FieldWithDerivedData>
	extraData: Record<string, unknown> = {}
): ActiveArgumentData => {
	let infoToCast = {
		stepsOfFields,
		stepsOfFieldsStringified: JSON.stringify(stepsOfFields),
		id: `${JSON.stringify(stepsOfFields)}${Math.random()}`,
		...type,
		...extraData
	} as ActiveArgumentData;
	return infoToCast;
};

/**
 * Retrieves the QMS context data for a specific control panel item.
 * @param CPItem Control Panel Item.
 * @param OutermostQMSWraperContext The main wrapper context.
 * @returns The specific context data.
 */
export const getQMSWraperCtxDataGivenControlPanelItem = (
	CPItem: { stepsOfFieldsThisAppliesTo: string[] },
	OutermostQMSWraperContext: { mergedChildren_QMSWraperCtxData_Store: any }
): any => {
	const { mergedChildren_QMSWraperCtxData_Store } = OutermostQMSWraperContext;

	let mergedChildren_QMSWraperCtxData_Value = get(mergedChildren_QMSWraperCtxData_Store);

	const QMSWraperCtxData = (mergedChildren_QMSWraperCtxData_Value as any[]).find((currCtx: any) => {
		return currCtx.stepsOfFields.join() == CPItem.stepsOfFieldsThisAppliesTo.join();
	});
	return QMSWraperCtxData;
};
