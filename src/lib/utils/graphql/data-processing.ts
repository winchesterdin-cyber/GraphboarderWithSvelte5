import { get } from 'svelte/store';
import type {
	TableColumnData,
	ActiveArgumentData,
	EndpointInfoStore,
} from '$lib/types';

export const sortingFunctionMutipleColumnsGivenArray = (array: [unknown, unknown][]): number => {
	let maxIndex = array.length - 1;
	const check = (currentIndex: number): number => {
		const column = array[currentIndex];
		if (column[0] < column[1]) {
			return -1;
		}
		if (column[0] > column[1]) {
			return 1;
		}
		if (currentIndex + 1 <= maxIndex) {
			return check(currentIndex + 1);
		}
		return 0;
	};
	return check(0);
};

export const getSortedAndOrderedEndpoints = <T extends { id: string | number; isMaintained?: boolean }>(
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

export const duplicateEndpoint = (endpointToDuplicate: any, existingEndpoints: any) => {
	const newEndpoint = {
		...endpointToDuplicate,
		id: Date.now(),
		description: `Copy of ${endpointToDuplicate.description}`
	};
	return [...existingEndpoints, newEndpoint];
};

export const getStepsOfFieldsForDataGetter = (
	colInfo: TableColumnData,
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

export const getDataGivenStepsOfFields = (
	colInfo: TableColumnData,
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

export const getTableCellData = (rowData: unknown, colData: TableColumnData, index: number): unknown => {
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
	if (dd_kindEl && (chd_dispatchValue == undefined || chd_dispatchValue.length == 0)) {
		return false;
	}
	if (chd_dispatchValue == undefined) {
		return false;
	}
	return true;
};

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

export const getQMSWraperCtxDataGivenControlPanelItem = (
	CPItem: { stepsOfFieldsThisAppliesTo: string[] },
	OutermostQMSWraperContext: { mergedChildren_QMSWraperCtxData_Store: any }
): any => {
	const { mergedChildren_QMSWraperCtxData_Store } = OutermostQMSWraperContext;

	let mergedChildren_QMSWraperCtxData_Value = get(mergedChildren_QMSWraperCtxData_Store);

	const QMSWraperCtxData = mergedChildren_QMSWraperCtxData_Value.find((currCtx: any) => {
		return currCtx.stepsOfFields.join() == CPItem.stepsOfFieldsThisAppliesTo.join();
	});
	return QMSWraperCtxData;
};
