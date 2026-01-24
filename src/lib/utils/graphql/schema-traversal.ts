import { get } from 'svelte/store';
import type {
	GraphQLKind,
	FieldWithDerivedData,
	RootType,
	SchemaData,
	EndpointInfoStore,
	FieldsGrouped
} from '$lib/types';
import { get_paginationTypes } from '$lib/stores/pagination/paginationTypes';
import { sortingFunctionMutipleColumnsGivenArray } from './data-processing';

// Helper to reverse an array without mutating the original
const toReversed = <T>(arr: T[]): T[] => {
	return [...arr].reverse();
};

export const get_KindsArray = (type: Partial<FieldWithDerivedData>): GraphQLKind[] => {
	let kinds: GraphQLKind[] = [];

	let currentType: any = type;
	// Traverse nested type/ofType structure to collect all kinds
	// This replaces the hardcoded if checks with a loop if possible,
	// but sticking to the structure provided in the original code for safety,
	// just made recursive or cleaner.

	// Original logic was manual unrolling. Let's stick to manual unrolling to match exact behavior
	// but ensure we cover enough depth.
	// The original code went up to type.type.ofType.ofType.ofType.kind
	// Let's implement a recursive helper to capture all kinds.

	const collectKinds = (t: any) => {
		if (t?.kind) kinds.push(t.kind);
		if (t?.type) collectKinds(t.type);
		if (t?.ofType) collectKinds(t.ofType);
	};

	// However, the original code had a specific order and selection.
	// e.g. type.kind, type.type.kind, type.ofType.kind...
	// Let's replicate the original explicit checks but formatted cleaner.

	if (type?.kind) kinds.push(type.kind);
	if (type?.type?.kind) kinds.push(type.type.kind);
	if (type?.ofType?.kind) kinds.push(type.ofType.kind);
	if (type?.type?.ofType?.kind) kinds.push(type.type.ofType.kind);
	if (type?.type?.ofType?.ofType?.kind) kinds.push(type.type.ofType.ofType.kind);
	if (type?.type?.ofType?.ofType?.ofType?.kind) kinds.push(type.type.ofType.ofType.ofType.kind);

	// Additional depth from original code
	if (type?.ofType?.ofType?.kind) kinds.push(type.ofType.ofType.kind);
	if (type?.ofType?.ofType?.ofType?.kind) kinds.push(type.ofType.ofType.ofType.kind);
	if (type?.type?.ofType?.ofType?.ofType?.kind) {
		// This check was repeated in original code, likely redundant but harmless
		// kinds.push(type.type.ofType.ofType.ofType.kind);
	}

	return kinds;
};

export const get_NamesArray = (type: Partial<FieldWithDerivedData>): string[] => {
	let names: string[] = [];
	if (type?.name) names.push(type.name);
	if (type?.type?.name) names.push(type.type.name);
	if (type?.ofType?.name) names.push(type.ofType.name);
	if (type?.type?.ofType?.name) names.push(type.type.ofType.name);
	if (type?.type?.ofType?.ofType?.name) names.push(type.type.ofType.ofType.name);
	if (type?.type?.ofType?.ofType?.ofType?.name) names.push(type.type.ofType.ofType.ofType.name);
	return names;
};

export const get_rootName = (namesArray: string[]): string => {
	return namesArray[namesArray.length - 1];
};

export const get_displayName = (namesArray: string[]): string => {
	return namesArray[0];
};

export const getRootType = (
	rootTypes: RootType[] | null,
	RootType_Name: string | undefined,
	schemaData: SchemaData
): RootType | undefined => {
	if (!rootTypes) {
		rootTypes = get(schemaData).rootTypes;
	}

	return rootTypes.find((type) => type.name === RootType_Name);
};

export const getFields_Grouped = (
	node: Partial<FieldWithDerivedData> | RootType,
	dd_displayNameToExclude: string[] = [],
	schemaData: SchemaData
): FieldsGrouped => {
	const node_rootType = schemaData?.get_rootType(
		null,
		node?.dd_rootName || (node as any).parent_node?.dd_rootName,
		schemaData
	);
	let scalarFields: FieldWithDerivedData[] = [];
	let non_scalarFields: FieldWithDerivedData[] = [];
	let enumFields: FieldWithDerivedData[] = [];

	let fieldsArray: FieldWithDerivedData[] | undefined;
	if (node?.args) {
		fieldsArray = node.args;
	} else if (node_rootType?.fields) {
		fieldsArray = node_rootType.fields;
	} else if (node_rootType?.inputFields) {
		fieldsArray = node_rootType.inputFields;
	} else if (node_rootType?.enumValues) {
		// enumValues might have different shape, but treated as fields here
		fieldsArray = node.enumValues as any;
	}

	if (fieldsArray) {
		fieldsArray
			.filter((field) => !dd_displayNameToExclude.includes(field.dd_displayName))
			.forEach((field) => {
				const kinds = get_KindsArray(field);
				if (kinds.includes('ENUM')) {
					enumFields.push({
						...schemaData.get_rootType(null, field.dd_rootName, schemaData),
						...field
					});
				} else if (kinds.includes('SCALAR')) {
					scalarFields.push(field);
				} else {
					non_scalarFields.push(field);
				}
			});
	}

	return {
		scalarFields,
		non_scalarFields,
		enumFields
	};
};

export const get_displayInterface = (
	typeInfo: Partial<FieldWithDerivedData>,
	endpointInfo: EndpointInfoStore
): string | null => {
	const extraData = endpointInfo.get_typeExtraData(typeInfo);
	if (extraData) {
		return extraData.displayInterface;
	}
	return null;
};

export const mark_paginationArgs = (
	args: FieldWithDerivedData[],
	endpointInfo: EndpointInfoStore
): void => {
	const paginationPossibleNames = get(endpointInfo).paginationArgsPossibleNames;
	const paginationPossibleNamesKeys = Object.keys(paginationPossibleNames);
	args.forEach((arg) => {
		let matchingKey = paginationPossibleNamesKeys.find((key) => {
			return paginationPossibleNames[key].includes(arg.dd_displayName);
		});
		if (matchingKey) {
			arg.dd_isPaginationArg = true;
			arg.dd_standsFor = matchingKey;
		} else {
			arg.dd_isPaginationArg = false;
		}
	});
};

export const get_paginationType = (
	paginationArgs: FieldWithDerivedData[],
	endpointInfo: EndpointInfoStore,
	schemaData: SchemaData
): string => {
	const standsForArray = paginationArgs.map((arg) => arg.dd_standsFor);
	const paginationType = get_paginationTypes(endpointInfo, schemaData).find((pt) => {
		return pt.check(standsForArray);
	})?.name;

	return paginationType || 'unknown';
};

const prepareStrForFuseComparison = (str: string): string => {
	return str
		.replace(/(?=[A-Z_])/g, ' ')
		.replace(/_/g, ' ')
		.replace(/s|null/g, '')
		.toLowerCase();
};

export const generate_derivedData = (
	type: Partial<FieldWithDerivedData>,
	rootTypes: RootType[] | null,
	isQMSField: boolean,
	endpointInfo: EndpointInfoStore,
	schemaData: SchemaData
): FieldWithDerivedData => {
	let derivedData = { ...type } as FieldWithDerivedData;
	derivedData.dd_kindsArray = get_KindsArray(type);
	derivedData.dd_namesArray = get_NamesArray(type);
	derivedData.dd_rootName = get_rootName(derivedData.dd_namesArray);
	derivedData.dd_displayName = get_displayName(derivedData.dd_namesArray);
	derivedData.dd_relatedRoot = getRootType(rootTypes, derivedData.dd_rootName, schemaData);

	derivedData.dd_kindEl = undefined;
	derivedData.dd_kindEl_NON_NULL = false;
	derivedData.dd_kindList = false;
	derivedData.dd_kindList_NON_NULL = false;
	derivedData.dd_NON_NULL = derivedData.dd_kindsArray[0] === 'NON_NULL';

	// Logic to determine list/element properties
	const dd_kindsArray_REVERSE = toReversed(derivedData.dd_kindsArray);
	dd_kindsArray_REVERSE.forEach((el) => {
		if (el === 'LIST') {
			derivedData.dd_kindList = true;
		} else if (el === 'NON_NULL') {
			if (derivedData.dd_kindList) {
				derivedData.dd_kindList_NON_NULL = true;
			} else {
				derivedData.dd_kindEl_NON_NULL = true;
			}
		} else {
			derivedData.dd_kindEl = el;
		}
	});

	let displayInterface = get_displayInterface(derivedData, endpointInfo);

	if (['text', undefined].includes(derivedData.dd_displayInterface)) {
		derivedData.dd_displayInterface = displayInterface || undefined; // Normalize null to undefined if interface expects it
	}

	derivedData.dd_isArg = !type?.args;
	derivedData.dd_relatedRoot_inputFields_allScalar = derivedData.dd_relatedRoot?.inputFields?.every(
		(field) => get_KindsArray(field).includes('SCALAR')
	);
	derivedData.dd_canExpand =
		!derivedData.dd_kindsArray?.includes('SCALAR') && derivedData.dd_kindsArray.length > 0;

	if (derivedData.dd_isArg) {
		const baseFilterOperatorNames = ['_and', '_or', '_not', 'and', 'or', 'not'];
		let dd_baseFilterOperators: string[] = [];
		let dd_nonBaseFilterOperators: string[] = [];
		if (type?.inputFields) {
			type.inputFields.forEach((inputField) => {
				if (baseFilterOperatorNames.includes(inputField.name)) {
					dd_baseFilterOperators.push(inputField.name);
				}
				if (inputField.name.startsWith('_')) {
					dd_nonBaseFilterOperators.push(inputField.name);
				}
			});

			derivedData.dd_baseFilterOperators =
				dd_baseFilterOperators.length > 0 ? dd_baseFilterOperators : undefined;
			derivedData.dd_nonBaseFilterOperators =
				dd_nonBaseFilterOperators.length > 0 ? dd_nonBaseFilterOperators : undefined;
		}

		derivedData.dd_isRootArg = !(
			derivedData.dd_canExpand && !derivedData?.dd_relatedRoot?.enumValues
		);
	}

	derivedData.dd_shouldExpand = derivedData.dd_canExpand && !derivedData.dd_relatedRoot?.enumValues;
	derivedData.dd_isQMSField = isQMSField;

	derivedData.dd_castType = 'implement this.possible values:string,number,graphqlGeoJson...';
	derivedData.dd_derivedTypeBorrowed = 'implement this? maybe not?';

	if (derivedData?.dd_baseFilterOperators) {
		let defaultdisplayInterface = get_displayInterface(derivedData, endpointInfo);
		if (type?.inputFields !== undefined) {
			type.inputFields.forEach((inputField) => {
				Object.assign(inputField, { dd_displayInterface: defaultdisplayInterface });
			});
		}
	}
	if (derivedData.args) {
		mark_paginationArgs(derivedData.args, endpointInfo);
		derivedData.dd_paginationArgs = derivedData.args.filter((arg) => arg.dd_isPaginationArg);
		derivedData.dd_paginationType = get_paginationType(
			derivedData.dd_paginationArgs,
			endpointInfo,
			schemaData
		);
	}

	derivedData.dd_StrForFuseComparison = `${prepareStrForFuseComparison(`${derivedData.dd_displayName}   `)} `;
	return derivedData;
};

export const getDeepField = (
	obj: Partial<FieldWithDerivedData>,
	propertyPath: string[],
	schemaData: SchemaData,
	fieldsType: 'fields' | 'inputFields' = 'fields'
): FieldWithDerivedData | null => {
	if (propertyPath.length === 0 || propertyPath[propertyPath.length - 1] === obj.dd_displayName) {
		return obj as FieldWithDerivedData;
	}
	let currentObj: Partial<FieldWithDerivedData> | undefined = obj;
	for (let i = 0; i < propertyPath.length; i++) {
		const prop = propertyPath[i];
		const currentObjRootType = schemaData.get_rootType(null, currentObj?.dd_rootName, schemaData);
		const currentObjRootTypeFields = currentObjRootType?.[fieldsType];
		const nextObj = currentObjRootTypeFields?.find((field) => field.dd_displayName === prop);

		if (!nextObj) {
			return null;
		}
		currentObj = nextObj;
	}
	return currentObj as FieldWithDerivedData;
};

export const get_nodeFieldsQMS_info = (
	QMS_info: FieldWithDerivedData,
	rowsLocation: string[],
	schemaData: SchemaData
): FieldWithDerivedData => {
	if (rowsLocation?.length === 0) {
		return QMS_info;
	}

	let nodeFieldsQMS_info = QMS_info;
	if (!getRootType(null, nodeFieldsQMS_info?.dd_rootName, schemaData)?.fields) {
		return nodeFieldsQMS_info;
	}

	for (const curr_rowsLocation of rowsLocation) {
		if (!nodeFieldsQMS_info?.dd_rootName) {
			break;
		}
		const rootType = getRootType(null, nodeFieldsQMS_info.dd_rootName, schemaData);
		if (!rootType?.fields) {
			break;
		}
		const nextNode = rootType.fields.find((field) => field.dd_displayName === curr_rowsLocation);
		if (nextNode) {
			nodeFieldsQMS_info = nextNode;
		} else {
			// Path broken
			break;
		}
	}
	return nodeFieldsQMS_info;
};

// Re-implemented to avoid circular dependency
export const get_scalarColsData = (
	currentQMS_info: FieldWithDerivedData | null,
	prefixStepsOfFields: string[] = [],
	schemaData: SchemaData
): any[] => {
	if (!currentQMS_info) {
		return [];
	}
	let keep_currentQMS_info_dd_displayName = true;
	if (prefixStepsOfFields.length > 0) {
		keep_currentQMS_info_dd_displayName = false;
	}
	let dd_relatedRoot = getRootType(null, currentQMS_info.dd_rootName, schemaData);
	// Note: getFields_Grouped is available in this module
	let { scalarFields } = getFields_Grouped(dd_relatedRoot!, [], schemaData);
	let currentQuery_fields_SCALAR_names = scalarFields.map((field) => field.name);

	let scalarColsData = currentQuery_fields_SCALAR_names.map((name) => {
		let stepsOfFields;
		if (keep_currentQMS_info_dd_displayName) {
			stepsOfFields = [...prefixStepsOfFields, currentQMS_info.dd_displayName, name];
		} else {
			stepsOfFields = [...prefixStepsOfFields, name];
		}

		// stepsOfFieldsToQueryFragmentObject logic is in data-processing or builder?
		// It was in builder. But we need it here.
		// It's a simple function, maybe I can duplicate it or move it to a shared place?
		// Or import it from data-processing if I put it there.
		// But data-processing might depend on schema-traversal.
		// Let's defer stepsOfFieldsOBJ creation or assume it's handled by caller if possible.
		// But the original code returned it.

		// Let's implement a simple version of stepsOfFieldsToQueryFragmentObject here or make it shared.
		// It seems purely structural, no schema dependency.

		let scalarColData = {
			title: name,
			stepsOfFields: stepsOfFields,
			// stepsOfFieldsOBJ: stepsOfFieldsToQueryFragmentObject(stepsOfFields, false) // Circular dep potentially
			// I'll leave stepsOfFieldsOBJ out for now or define a local helper.
			stepsOfFieldsOBJ: _localStepsOfFieldsToQueryFragmentObject(stepsOfFields, false)
		};
		return scalarColData;
	});
	return scalarColsData;
};

// Local helper to avoid circular dependency with builder/processing
const _localStepsOfFieldsToQueryFragmentObject = (
	stepsOfFields: string[],
	excludeFirstStep: boolean = true,
	dataForLastStep: string = 'novaluehere'
): Record<string, any> => {
	let _stepsOfFields = [...stepsOfFields];
	if (excludeFirstStep) {
		_stepsOfFields.shift();
	}
	let _stepsOfFields_length = _stepsOfFields.length;
	let queryObject = {};
	let queryObjectCurrLevel: any = queryObject;
	_stepsOfFields.forEach((fieldName, index) => {
		if (_stepsOfFields_length == index + 1) {
			queryObjectCurrLevel[fieldName] = dataForLastStep;
		} else {
			queryObjectCurrLevel[fieldName] = {};
			queryObjectCurrLevel = queryObjectCurrLevel[fieldName];
		}
	});
	return queryObject;
};
