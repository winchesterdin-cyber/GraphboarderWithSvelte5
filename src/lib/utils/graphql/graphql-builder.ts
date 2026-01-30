import _ from 'lodash';
import { get } from 'svelte/store';
import { page } from '$app/stores';
import { stringToQMSString_transformer } from '$lib/utils/dataStructureTransformers';
import {
	deleteIfChildrenHaveOneKeyAndLastKeyIsQMSarguments,
	filterElFromArr,
	setValueAtPath
} from '$lib/utils/objectUtils';
import {
	generateListOfSubstrings,
	gqlArgObjToString,
	smartModifyStringBasedOnBoundries
} from '$lib/utils/stringUtils';

import type {
	QMSType,
	FieldWithDerivedData,
	SchemaData,
	EndpointInfoStore,
	ActiveArgumentData,
	ActiveArgumentGroup,
	ContainerData,
	GQLArgObj,
	FinalGQLArgObj,
	TableColumnData,
	StepsOfFieldsObject,
	PaginationStateStore,
	ActiveArgumentsDataGroupedStore
} from '$lib/types';

import { argumentCanRunQuery, sortingFunctionMutipleColumnsGivenArray } from './data-processing';
import {
	getFields_Grouped,
	getRootType,
	get_nodeFieldsQMS_info,
	get_scalarColsData
} from './schema-traversal';

/**
 * Constructs the body part of a GraphQL query/mutation string.
 * @param QMS_name The name of the query/mutation.
 * @param QMS_fields The fields to select.
 * @param QMS_args The arguments for the operation.
 * @param QMS_type The type of operation ('query' | 'mutation').
 * @param mergedChildren_finalGqlArgObj Arguments from child components/nodes.
 * @returns The constructed GraphQL string body part or null if no fields selected.
 */
export const build_QMS_bodyPart = (
	QMS_name: string,
	QMS_fields: Record<string, unknown>,
	QMS_args: Record<string, unknown>,
	QMS_type: QMSType = 'query',
	mergedChildren_finalGqlArgObj: Record<string, unknown>
): string | null => {
	if (Object.keys(QMS_fields).length == 0) {
		console.error('no cols data,choose at least one field');
		return null;
	}
	// Warning: console.info removed to reduce noise

	const QMSarguments = { [QMS_name]: { QMSarguments: QMS_args } };
	const fullObject = JSON.parse(
		JSON.stringify(
			deleteIfChildrenHaveOneKeyAndLastKeyIsQMSarguments(
				_.mergeWith({}, QMSarguments, mergedChildren_finalGqlArgObj, QMS_fields)
			)
		)
	);

	const inputString = JSON.stringify(fullObject, function (key, value) {
		if (key === 'QMSarguments') {
			return '(' + JSON.stringify(value) + ')';
		}
		return value;
	}).replaceAll('\"QMSarguments\":', '');
	const listOfSubstrings = generateListOfSubstrings(inputString);
	const outsideTextModifier = (text: string): string => {
		return text.replaceAll(/novaluehere|"|:/gi, '');
	};

	const modifiedString = smartModifyStringBasedOnBoundries(
		listOfSubstrings.join(''),
		'(',
		')',
		stringToQMSString_transformer as any,
		outsideTextModifier
	);

	const QMS_bodyPart = modifiedString.slice(1, -1);

	return QMS_bodyPart;
};

/**
 * Generates the GraphQL argument object from active argument data.
 * @param group_argumentsData List of active arguments.
 * @returns Object containing the generated argument object and validity status.
 */
export const generate_gqlArgObj = (group_argumentsData: ActiveArgumentData[]): GQLArgObj => {
	// check for group if expects list and treat it accordingly like here --->https://stackoverflow.com/questions/69040911/hasura-order-by-date-with-distinct
	const gqlArgObj = {};
	let canRunQuery = true;
	group_argumentsData.every((argData) => {
		const _argumentCanRunQuery = argumentCanRunQuery(argData);
		if (!_argumentCanRunQuery) {
			canRunQuery = false;
			return false;
		}
		const { chd_dispatchValue, stepsOfFields, dd_displayName } = argData;

		const curr_gqlArgObj: any = gqlArgObj;
		if (dd_displayName) {
			curr_gqlArgObj[dd_displayName] = chd_dispatchValue;
		}
		return true;
	});

	return {
		arg_gqlArgObj: gqlArgObj,
		arg_canRunQuery: canRunQuery,
		gqlArgObj,
		canRunQuery,
		note: 'these are repeated for easy refactoring while keeping the old working: arg_gqlArgObj: gqlArgObj, arg_canRunQuery: canRunQuery, gqlArgObj,canRunQuery'
	};
};

export const generate_group_gqlArgObjForRoot = (
	group_argumentsData: ActiveArgumentData[]
): Record<string, unknown> => {
	return _.merge(
		{},
		...group_argumentsData.map((arggumentData) => {
			return arggumentData.gqlArgObj;
		})
	);
};

/**
 * Generates the GraphQL argument object for a group of arguments.
 * @param group The active argument group.
 * @returns Object containing the group's argument object, string representation, and validity.
 */
export const generate_group_gqlArgObj = (
	group: ActiveArgumentGroup
): {
	group_gqlArgObj: Record<string, unknown>;
	group_gqlArgObj_string: string;
	group_canRunQuery: boolean;
} => {
	//if is where/filter (its related_root has filter_operators  ,like __or,__and,_not) handle differently after implementing the new ui
	let group_gqlArgObj = {};

	const group_argumentsData = group.group_args.filter((arg) => {
		return arg.inUse;
	});
	const group_canRunQuery = group_argumentsData.every((arg) => {
		return arg.canRunQuery;
	});
	if (group_argumentsData?.length > 0) {
		if (group.group_isRoot) {
			group_gqlArgObj = generate_group_gqlArgObjForRoot(group_argumentsData);
		} else {
			// Logic for non-root group is missing, but error suppression was requested.
		}
	}

	const group_gqlArgObj_string = gqlArgObjToString(group_gqlArgObj);
	return {
		group_gqlArgObj,
		group_gqlArgObj_string,
		group_canRunQuery
	};
};

const validItems = (
	items: { id: string }[],
	nodes: Record<string, ContainerData>
): { id: string }[] => {
	return items.filter((item) => {
		const itemData = nodes[item.id];
		return (
			itemData.inUse ||
			(itemData.operator && validItems(itemData.items, nodes).length > 0) ||
			itemData.selectedRowsColValues
		);
	});
};

export const generate_group_gqlArgObj_forHasOperators = (
	items: { id: string }[],
	group_name: string,
	nodes: Record<string, ContainerData>
): {
	resultingGqlArgObj: Record<string, unknown> | undefined;
	itemsResultingData: Record<string, unknown>[];
} => {
	let resultingGqlArgObj: Record<string, unknown> | undefined;
	const itemsResultingData: Record<string, unknown>[] = [];
	const spreadItemsIfInSpreadContainers = (items: { id: string }[]): { id: string }[] => {
		const spreadOutItems: { id: string }[] = [];
		items.forEach((item) => {
			if ((item as any)?.operator == '~spread~') {
				const validItemsResult = validItems((item as any).items, nodes);
				spreadOutItems.push(...validItemsResult);
			} else {
				spreadOutItems.push(item);
			}
		});
		return spreadOutItems;
	};

	const spreadOutItems = spreadItemsIfInSpreadContainers(items);
	spreadOutItems.forEach((item) => {
		const itemData = nodes[item.id];
		const isContainer = itemData.hasOwnProperty('items');
		const nodeStep = itemData?.stepsOfNodes?.[itemData?.stepsOfNodes.length - 1];
		const nodeStepClean = filterElFromArr(nodeStep as any, [null, undefined, 'bonded', 'list']);

		const operator = itemData.operator;
		let itemObj = {};
		let itemObjCurr: any = itemObj;
		const displayName = itemData?.dd_displayName;
		let dataToAssign;

		if (isContainer) {
			const validItemsResult = validItems(spreadItemsIfInSpreadContainers(itemData.items), nodes);
			const gqlArgObjForItems = generate_group_gqlArgObj_forHasOperators(
				validItemsResult,
				group_name,
				nodes
			).itemsResultingData;
			if (operator == 'bonded' || !itemData?.dd_kindList) {
				const merged_gqlArgObjForItems = _.merge({}, ...gqlArgObjForItems);
				dataToAssign = merged_gqlArgObjForItems;
			} else {
				dataToAssign = gqlArgObjForItems;
			}
		} else {
			dataToAssign = nodes[item.id]?.gqlArgObj;
		}
		if (itemData.selectedRowsColValues) {
			if (Array.isArray(dataToAssign)) {
				dataToAssign = [...itemData.selectedRowsColValues, ...dataToAssign];
			} else {
				dataToAssign = _.merge({}, itemData.selectedRowsColValues[0], dataToAssign);
			}
		}
		resultingGqlArgObj = setValueAtPath(
			{},
			nodeStepClean as string[],
			dataToAssign,
			true
		) as Record<string, unknown>;
		let itemObjectTestCurr = setValueAtPath({}, nodeStepClean as string[], dataToAssign, true);
		const itemObjectTest2 = 'not set';
		if (resultingGqlArgObj == undefined) {
			// let itemObjectTest2 = 'set'
			//itemObjectTest2 = dataToAssign
			resultingGqlArgObj = dataToAssign as Record<string, unknown>;
			itemObjectTestCurr = dataToAssign;
		}

		if (isContainer) {
			if (itemData.not) {
				itemObjCurr['_not'] = displayName ? {} : dataToAssign;
				itemObjCurr = itemObjCurr['_not'];
			}
			if (displayName) {
				itemObjCurr[displayName] = dataToAssign;
				itemObjCurr = itemObjCurr[displayName];
			} else {
				itemObjCurr = _.merge(itemObjCurr, dataToAssign);
			}
		}

		if (!isContainer && displayName) {
			if (itemData.not) {
				itemObjCurr['_not'] = dataToAssign;
				itemObjCurr = itemObjCurr['_not'];
			} else {
				itemObj = dataToAssign as any;
			}
		}

		itemsResultingData.push(itemObj);
	});
	return {
		resultingGqlArgObj,
		itemsResultingData
	};
};

export const generate_group_gqlArgObjAndCanRunQuery_forHasOperators = (
	group: ActiveArgumentGroup
): {
	group_gqlArgObj: Record<string, unknown> | undefined;
	group_gqlArgObj_string: string;
	group_canRunQuery: boolean;
} => {
	const { group_argsNode, group_name, group_hasAllArgs } = group;

	let group_canRunQuery = true;
	if (!group_argsNode) {
		return { group_gqlArgObj: {}, group_gqlArgObj_string: '{}', group_canRunQuery: true };
	}

	const nodes = JSON.parse(JSON.stringify(group_argsNode));
	const nodesArray = Object.values(nodes);
	const mainContainer = (nodesArray as any).filter((node: any) => {
		return node.isMain;
	})[0];

	const generate_group_gqlArgObj_forHasOperatorsRESULT = generate_group_gqlArgObj_forHasOperators(
		[mainContainer],
		group_name,
		nodes
	);

	const group_argumentsData = group.group_args.filter((arg) => {
		return arg.inUse;
	});
	group_canRunQuery = group_argumentsData.every((arg) => {
		return arg.canRunQuery;
	});
	let group_gqlArgObj;
	if (group_hasAllArgs) {
		group_gqlArgObj =
			generate_group_gqlArgObj_forHasOperatorsRESULT.resultingGqlArgObj?.[
				mainContainer.dd_displayName
			];
	} else {
		group_gqlArgObj = generate_group_gqlArgObj_forHasOperatorsRESULT.resultingGqlArgObj;
	}
	const group_gqlArgObj_string = gqlArgObjToString(group_gqlArgObj as Record<string, unknown>);
	return {
		group_gqlArgObj: group_gqlArgObj as Record<string, unknown>,
		group_gqlArgObj_string,
		group_canRunQuery
	};
};

/**
 * Generates the final GraphQL argument object by combining all groups.
 * @param activeArgumentsDataGrouped All active argument groups.
 * @returns The final GraphQL argument object and overall validity.
 */
export const generate_finalGqlArgObj_fromGroups = (
	activeArgumentsDataGrouped: ActiveArgumentGroup[]
): FinalGQLArgObj => {
	const finalGqlArgObj = {};
	const final_canRunQuery = activeArgumentsDataGrouped.every((group) => {
		return group.group_canRunQuery;
	});

	activeArgumentsDataGrouped.forEach((group) => {
		Object.assign(finalGqlArgObj, group.group_gqlArgObj);
	});

	return { finalGqlArgObj, final_canRunQuery };
};

export const getQMSLinks = (
	QMSName: QMSType = 'query',
	parentURL: string,
	endpointInfo: EndpointInfoStore,
	schemaData: SchemaData
): { url: string; title: string }[] => {
	const $page = get(page);
	// let origin = $page.url.origin; // Unused
	let queryLinks: { url: string; title: string }[] = [];
	const $schemaData = get(schemaData);
	const sortIt = (QMSFields: FieldWithDerivedData[]): FieldWithDerivedData[] => {
		return QMSFields?.sort((a, b) => {
			const ea = a.dd_rootName;
			const eb = b.dd_rootName;
			const fa = a.dd_displayName.substring(6);
			const fb = b.dd_displayName.substring(6);
			const ga = a.dd_displayName;
			const gb = b.dd_displayName;
			return sortingFunctionMutipleColumnsGivenArray([
				[ea, eb],
				[fa, fb],
				[ga, gb]
			]);
		});
	};

	const fieldsKey = `${QMSName}Fields` as keyof typeof $schemaData;
	const fields = $schemaData[fieldsKey] as FieldWithDerivedData[];

	queryLinks = sortIt(fields)?.map((query) => {
		const queryName = query.name;
		let queryNameDisplay = queryName;

		const currentQMS_info = schemaData.get_QMS_Field(queryName, QMSName, schemaData);
		if (!currentQMS_info) return { url: '', title: '' };

		const rowsLocation = endpointInfo.get_rowsLocation(currentQMS_info, schemaData);
		const nodeFieldsQMS_info = get_nodeFieldsQMS_info(currentQMS_info, rowsLocation, schemaData);
		const scalarFields = get_scalarColsData(
			nodeFieldsQMS_info,
			[currentQMS_info.dd_displayName, ...rowsLocation],
			schemaData
		);

		const mandatoryArgs = query?.args?.filter((arg) => {
			return arg.dd_NON_NULL;
		});
		const ID_Args = query?.args?.filter((arg) => {
			return arg.dd_rootName == 'ID';
		});
		if (mandatoryArgs && mandatoryArgs.length > 0) {
			queryNameDisplay = `${queryNameDisplay} (${mandatoryArgs.length}) `;
		}
		if (ID_Args && ID_Args.length > 0) {
			queryNameDisplay = `${queryNameDisplay} <${ID_Args.length}> `;
		}
		if (scalarFields.length == 0) {
			queryNameDisplay = queryNameDisplay + ' (no scalar)';
		}
		const queryLink = { url: `${parentURL}/${queryName}`, title: queryNameDisplay };
		return queryLink;
	});
	return queryLinks || [];
};

export const stepsOfFieldsToQueryFragmentObject = (
	stepsOfFields: string[],
	excludeFirstStep: boolean = true,
	dataForLastStep: string = 'novaluehere'
): StepsOfFieldsObject => {
	const _stepsOfFields = [...stepsOfFields];
	if (excludeFirstStep) {
		_stepsOfFields.shift();
	}
	const _stepsOfFields_length = _stepsOfFields.length;
	const queryObject: any = {};
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

export const tableColsDataToQueryFields = (
	tableColsData: TableColumnData[]
): StepsOfFieldsObject | string => {
	if ((tableColsData.length as any) == '') {
		return ``;
	}
	const queryFragmentsObjects = tableColsData
		.filter((colData) => {
			return colData.stepsOfFieldsOBJ !== undefined;
		})
		.map((colData) => {
			return colData.stepsOfFieldsOBJ;
		});
	const _queryFragmentsObjects = JSON.parse(JSON.stringify(queryFragmentsObjects));

	const merged = _.merge({}, ..._queryFragmentsObjects);
	return merged;
};

export const nodeAddDefaultFields = (
	node: ContainerData,
	prefix: string = '',
	group: ActiveArgumentGroup,
	activeArgumentsDataGrouped_Store: ActiveArgumentsDataGroupedStore,
	schemaData: SchemaData,
	endpointInfo: EndpointInfoStore
): void => {
	const group_argsNode = group.group_argsNode;
	if (!group_argsNode) return;

	const dd_displayNameToExclude = [
		...node.items.map((item) => {
			return group_argsNode[item.id]?.dd_displayName;
		}),
		'_and',
		'_or',
		'_not',
		'and',
		'or',
		'not'
	];

	const fields_Grouped = getFields_Grouped(node, dd_displayNameToExclude as string[], schemaData);
	const scalarFields = fields_Grouped.scalarFields;
	const non_scalarFields = fields_Grouped.non_scalarFields;
	const enumFields = fields_Grouped.enumFields;

	[...scalarFields, ...enumFields].forEach((element) => {
		const stepsOfFields = [
			group.group_name ||
				node.dd_displayName ||
				(node as any).parent_node?.dd_displayName ||
				'unknown',
			element.dd_displayName
		];
		const newArgData = {
			stepsOfFields,
			stepsOfFieldsStringified: JSON.stringify(stepsOfFields),
			id: `${JSON.stringify(stepsOfFields)}${Math.random()}`,
			...element
		};
		activeArgumentsDataGrouped_Store.add_activeArgument(
			newArgData,
			group.group_name,
			node?.id,
			endpointInfo
		);
	});

	const baseFilterOperators = ['_and', '_or', '_not', 'and', 'or', 'not'];

	non_scalarFields
		?.filter((arg) => {
			return !baseFilterOperators.includes(arg.dd_displayName);
		})
		?.forEach((element) => {
			const stepsOfFields = [
				group.group_name ||
					node.dd_displayName ||
					(node as any).parent_node?.dd_displayName ||
					'unknown',
				element.dd_displayName
			];

			const newContainerData: any = {
				stepsOfFields,
				stepsOfFieldsStringified: JSON.stringify(stepsOfFields),
				id: `${JSON.stringify(stepsOfFields)}${Math.random()}`,
				...element
			};
			const randomNr = Math.random().toString();
			const newContainerDataRootType = schemaData.get_rootType(
				null,
				newContainerData.dd_rootName,
				schemaData
			);

			const isListContainer = newContainerData?.dd_kindList;
			let operator: any;
			if (!operator && isListContainer) {
				operator = 'list';
			}

			if (!operator) {
				operator = 'bonded';
			}

			group.group_argsNode![`${randomNr}`] = {
				items: [],
				...newContainerData,
				inputFields: newContainerDataRootType?.inputFields,
				id: randomNr,
				operator,
				not: false,
				isMain: false
			};
			if (node?.items) {
				node.items.push({ id: randomNr });
			} else if (group.group_argsNode?.['mainContainer']) {
				group.group_argsNode['mainContainer'].items.push({ id: randomNr });
			}
		});
	activeArgumentsDataGrouped_Store.update((data) => {
		return data;
	}); //force update

	(node as any).addDefaultFields = false;
};

export const generate_finalGqlArgObjAndCanRunQuery = (
	activeArgumentsDataGrouped: ActiveArgumentGroup[],
	_paginationState_Store: PaginationStateStore | null,
	resetPaginationState: boolean = true
): FinalGQLArgObj => {
	//reset pagination state too !!!THIS MIGHT TRIGGER 1 EXTRA SERVER REQUEST,seems not from what i saw
	if (resetPaginationState && _paginationState_Store) {
		_paginationState_Store.resetToDefault();
	}
	//
	const groups_gqlArgObj = activeArgumentsDataGrouped.map((group) => {
		if (group.group_argsNode) {
			return generate_group_gqlArgObjAndCanRunQuery_forHasOperators(group);
		} else {
			return generate_group_gqlArgObj(group);
		}
	});
	return generate_finalGqlArgObj_fromGroups(groups_gqlArgObj as any);
};
