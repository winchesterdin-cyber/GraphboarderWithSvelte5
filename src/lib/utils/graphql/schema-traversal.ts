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

// Helper to reverse an array without mutating the original
const toReversed = <T>(arr: T[]): T[] => {
	return [...arr].reverse();
};

/**
 * Extracts all GraphQL kinds from a nested type definition.
 * Traverses `type` and `ofType` properties.
 * @param type The type object to traverse.
 * @returns Array of GraphQLKind strings.
 */
export const get_KindsArray = (type: any): GraphQLKind[] => {
	let kinds: GraphQLKind[] = [];

	// Manual traversal to match original behavior logic
	if (type?.kind) kinds.push(type.kind);
	if (type?.type?.kind) kinds.push(type.type.kind);
	if (type?.ofType?.kind) kinds.push(type.ofType.kind);
	if (type?.type?.ofType?.kind) kinds.push(type.type.ofType.kind);
	if (type?.type?.ofType?.ofType?.kind) kinds.push(type.type.ofType.ofType.kind);
	if (type?.type?.ofType?.ofType?.ofType?.kind) kinds.push(type.type.ofType.ofType.ofType.kind);

	if (type?.ofType?.ofType?.kind) kinds.push(type.ofType.ofType.kind);
	if (type?.ofType?.ofType?.ofType?.kind) kinds.push(type.ofType.ofType.ofType.kind);

	return kinds;
};

/**
 * Extracts all type names from a nested type definition.
 * @param type The type object.
 * @returns Array of type names.
 */
export const get_NamesArray = (type: any): string[] => {
	let names: string[] = [];
	if (type?.name) names.push(type.name);
	if (type?.type?.name) names.push(type.type.name);
	if (type?.ofType?.name) names.push(type.ofType.name);
	if (type?.type?.ofType?.name) names.push(type.type.ofType.name);
	if (type?.type?.ofType?.ofType?.name) names.push(type.type.ofType.ofType.name);
	if (type?.type?.ofType?.ofType?.ofType?.name) names.push(type.type.ofType.ofType.ofType.name);
	return names;
};

/**
 * Gets the root type name (usually the last in the names array).
 * @param namesArray Array of names.
 * @returns The root name.
 */
export const get_rootName = (namesArray: string[]): string => {
	return namesArray[namesArray.length - 1];
};

/**
 * Gets the display name (usually the first in the names array).
 * @param namesArray Array of names.
 * @returns The display name.
 */
export const get_displayName = (namesArray: string[]): string => {
	return namesArray[0];
};

/**
 * Finds a RootType definition in the schema data by name.
 * @param rootTypes Array of root types (optional, fetches from schemaData if null).
 * @param RootType_Name The name to search for.
 * @param schemaData The schema data store.
 * @returns The found RootType or undefined.
 */
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

/**
 * Groups fields of a type into scalar, non-scalar, and enum fields.
 * @param node The type node (field or root type).
 * @param dd_displayNameToExclude Names to exclude.
 * @param schemaData Schema data store.
 * @returns Object containing grouped fields.
 */
export const getFields_Grouped = (
	node: Partial<FieldWithDerivedData> | RootType,
	dd_displayNameToExclude: string[] = [],
	schemaData: SchemaData
): FieldsGrouped => {
	const node_rootType = schemaData?.get_rootType(
		null,
		node?.dd_rootName || (node as any).parent_node?.dd_rootName || 'unknown',
		schemaData
	);
	let scalarFields: FieldWithDerivedData[] = [];
	let non_scalarFields: FieldWithDerivedData[] = [];
	let enumFields: (RootType & FieldWithDerivedData)[] = [];

	let fieldsArray: FieldWithDerivedData[] | undefined;
	if ((node as FieldWithDerivedData)?.args) {
		fieldsArray = (node as FieldWithDerivedData).args as unknown as FieldWithDerivedData[];
	} else if (node_rootType?.fields) {
		fieldsArray = node_rootType.fields;
	} else if (node_rootType?.inputFields) {
		// Casting to match the expected array type, though input fields differ slightly they are treated similarly here
		fieldsArray = node_rootType.inputFields as unknown as FieldWithDerivedData[];
	} else if (node_rootType?.enumValues) {
		// enumValues might have different shape, but treated as fields here
		fieldsArray = (node as any).enumValues as unknown as FieldWithDerivedData[];
	}

	if (fieldsArray) {
		fieldsArray
			.filter((field) => !dd_displayNameToExclude.includes(field.dd_displayName))
			.forEach((field) => {
				const kinds = get_KindsArray(field);
				if (kinds.includes('ENUM')) {
					const rootType = schemaData.get_rootType(null, field.dd_rootName, schemaData);
					if (rootType) {
						enumFields.push({
							...rootType,
							...field
						});
					}
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

/**
 * Determines the display interface for a type based on endpoint configuration.
 * @param typeInfo Type information.
 * @param endpointInfo Endpoint configuration store.
 * @returns Display interface string or null.
 */
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

/**
 * Marks fields as pagination arguments if they match configured names.
 * @param args List of arguments.
 * @param endpointInfo Endpoint configuration store.
 */
export const mark_paginationArgs = (
	args: FieldWithDerivedData[],
	endpointInfo: EndpointInfoStore
): void => {
	const paginationPossibleNames = get(endpointInfo).paginationArgsPossibleNames || {};
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

/**
 * Identifies the pagination type (e.g., limit/offset, cursor) based on arguments.
 * @param paginationArgs List of pagination arguments.
 * @param endpointInfo Endpoint configuration store.
 * @param schemaData Schema data store.
 * @returns The name of the pagination strategy.
 */
export const get_paginationType = (
	paginationArgs: FieldWithDerivedData[],
	endpointInfo: EndpointInfoStore,
	schemaData: SchemaData
): string => {
	const standsForArray = paginationArgs.map((arg) => arg.dd_standsFor || '');
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

/**
 * Enhances a field with derived data (dd_) used for UI logic.
 * Calculates kinds, root names, display interfaces, and expandability.
 * @param type The raw field/type object.
 * @param rootTypes Available root types.
 * @param isQMSField Whether it's a top-level Query/Mutation/Subscription field.
 * @param endpointInfo Endpoint configuration.
 * @param schemaData Schema data.
 * @returns FieldWithDerivedData object.
 */
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
	derivedData.dd_relatedRoot =
		getRootType(rootTypes, derivedData.dd_rootName, schemaData) || 'unknown';

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

	if (!derivedData.dd_displayInterface || ['text'].includes(derivedData.dd_displayInterface)) {
		derivedData.dd_displayInterface = (displayInterface as any) || undefined; // Normalize null to undefined if interface expects it
	}

	derivedData.dd_isArg = !type?.args;

	const relatedRoot =
		typeof derivedData.dd_relatedRoot === 'string' ? null : derivedData.dd_relatedRoot;
	derivedData.dd_relatedRoot_inputFields_allScalar =
		relatedRoot?.inputFields?.every((field) => get_KindsArray(field).includes('SCALAR')) || false;

	derivedData.dd_canExpand =
		!derivedData.dd_kindsArray?.includes('SCALAR') && derivedData.dd_kindsArray.length > 0;

	if (derivedData.dd_isArg) {
		const baseFilterOperatorNames = ['_and', '_or', '_not', 'and', 'or', 'not'];
		let dd_baseFilterOperators: string[] = [];
		let dd_nonBaseFilterOperators: string[] = [];
		if ((type as any)?.inputFields) {
			(type as any).inputFields.forEach((inputField: any) => {
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

		derivedData.dd_isRootArg = !(derivedData.dd_canExpand && !relatedRoot?.enumValues);
	}

	derivedData.dd_shouldExpand = derivedData.dd_canExpand && !relatedRoot?.enumValues;
	derivedData.dd_isQMSField = isQMSField;

	derivedData.dd_castType = 'implement this.possible values:string,number,graphqlGeoJson...';
	derivedData.dd_derivedTypeBorrowed = 'implement this? maybe not?';

	if (derivedData?.dd_baseFilterOperators) {
		let defaultdisplayInterface = get_displayInterface(derivedData, endpointInfo);
		if ((type as any)?.inputFields !== undefined) {
			(type as any).inputFields.forEach((inputField: any) => {
				Object.assign(inputField, { dd_displayInterface: defaultdisplayInterface });
			});
		}
	}
	if (derivedData.args) {
		mark_paginationArgs(derivedData.args as any, endpointInfo);
		derivedData.dd_paginationArgs = (derivedData.args as any).filter(
			(arg: any) => arg.dd_isPaginationArg
		);
		derivedData.dd_paginationType = get_paginationType(
			derivedData.dd_paginationArgs as any,
			endpointInfo,
			schemaData
		);
	}

	derivedData.dd_StrForFuseComparison = `${prepareStrForFuseComparison(`${derivedData.dd_displayName}   `)} `;
	return derivedData;
};

/**
 * Traverses a property path to find a deeply nested field.
 * @param obj Starting object (field).
 * @param propertyPath Path to follow.
 * @param schemaData Schema data.
 * @param fieldsType Type of fields to look in (fields/inputFields).
 * @returns The found field or null.
 */
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
		const currentObjRootType = schemaData.get_rootType(
			null,
			currentObj?.dd_rootName || '',
			schemaData
		);
		const currentObjRootTypeFields = currentObjRootType?.[fieldsType] as
			| FieldWithDerivedData[]
			| undefined;
		const nextObj = currentObjRootTypeFields?.find((field) => field.dd_displayName === prop);

		if (!nextObj) {
			return null;
		}
		currentObj = nextObj;
	}
	return currentObj as FieldWithDerivedData;
};

/**
 * Follows a path of row locations to find the target QMS info.
 * @param QMS_info Starting info.
 * @param rowsLocation Path.
 * @param schemaData Schema data.
 * @returns Target field info.
 */
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
/**
 * Generates column data for scalar fields of a given QMS info.
 * @param currentQMS_info Current field info.
 * @param prefixStepsOfFields Prefix for steps.
 * @param schemaData Schema data.
 * @returns Array of column data objects.
 */
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
	let queryObject: any = {};
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
