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
		stringToQMSString_transformer,
		outsideTextModifier
	);

	const QMS_bodyPart = modifiedString.slice(1, -1);

	return QMS_bodyPart;
};

export const generate_gqlArgObj = (group_argumentsData: ActiveArgumentData[]): GQLArgObj => {
	// check for group if expects list and treat it accordingly like here --->https://stackoverflow.com/questions/69040911/hasura-order-by-date-with-distinct
	let gqlArgObj = {};
	let canRunQuery = true;
	group_argumentsData.every((argData) => {
		let _argumentCanRunQuery = argumentCanRunQuery(argData);
		if (!_argumentCanRunQuery) {
			canRunQuery = false;
			return false;
		}
		let { chd_dispatchValue, stepsOfFields, dd_displayName } = argData;

		let curr_gqlArgObj: any = gqlArgObj;
		curr_gqlArgObj[dd_displayName] = chd_dispatchValue;
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

export const generate_group_gqlArgObj = (
	group: ActiveArgumentGroup
): {
	group_gqlArgObj: Record<string, unknown>;
	group_gqlArgObj_string: string;
	group_canRunQuery: boolean;
} => {
	//if is where/filter (its related_root has filter_operators  ,like __or,__and,_not) handle differently after implementing the new ui
	let group_gqlArgObj = {};

	let group_argumentsData = group.group_args.filter((arg) => {
		return arg.inUse;
	});
	let group_canRunQuery = group_argumentsData.every((arg) => {
		return arg.canRunQuery;
	});
	if (group_argumentsData?.length > 0) {
		if (group.group_isRoot) {
			group_gqlArgObj = generate_group_gqlArgObjForRoot(group_argumentsData);
		} else {
			// Logic for non-root group is missing, but error suppression was requested.
		}
	}

	let group_gqlArgObj_string = gqlArgObjToString(group_gqlArgObj);
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
		let itemData = nodes[item.id];
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
	let itemsResultingData: Record<string, unknown>[] = [];
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
		let itemData = nodes[item.id];
		const isContainer = itemData.hasOwnProperty('items');
		const nodeStep = itemData?.stepsOfNodes[itemData?.stepsOfNodes.length - 1];
		const nodeStepClean = filterElFromArr(nodeStep, [null, undefined, 'bonded', 'list']);

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
		resultingGqlArgObj = setValueAtPath({}, nodeStepClean, dataToAssign, true) as Record<
			string,
			unknown
		>;
		let itemObjectTestCurr = setValueAtPath({}, nodeStepClean, dataToAssign, true);
		let itemObjectTest2 = 'not set';
		if (resultingGqlArgObj == undefined) {
			// let itemObjectTest2 = 'set'
			//itemObjectTest2 = dataToAssign
			resultingGqlArgObj = dataToAssign;
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
				itemObj = dataToAssign;
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
	let { group_argsNode, group_name, group_hasAllArgs } = group;

	let group_canRunQuery = true;
	let nodes = JSON.parse(JSON.stringify(group_argsNode));
	let nodesArray = Object.values(nodes);
	let mainContainer = (nodesArray as any).filter((node) => {
		return node.isMain;
	})[0];

	const generate_group_gqlArgObj_forHasOperatorsRESULT = generate_group_gqlArgObj_forHasOperators(
		[mainContainer],
		group_name,
		nodes
	);

	let group_argumentsData = group.group_args.filter((arg) => {
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
	let group_gqlArgObj_string = gqlArgObjToString(group_gqlArgObj as Record<string, unknown>);
	return {
		group_gqlArgObj: group_gqlArgObj as Record<string, unknown>,
		group_gqlArgObj_string,
		group_canRunQuery
	};
};

export const generate_finalGqlArgObj_fromGroups = (
	activeArgumentsDataGrouped: ActiveArgumentGroup[]
): FinalGQLArgObj => {
	let finalGqlArgObj = {};
	let final_canRunQuery = activeArgumentsDataGrouped.every((group) => {
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
	let $page = get(page);
	// let origin = $page.url.origin; // Unused
	let queryLinks: { url: string; title: string }[] = [];
	let $schemaData = get(schemaData);
	const sortIt = (QMSFields: FieldWithDerivedData[]): FieldWithDerivedData[] => {
		return QMSFields?.sort((a, b) => {
			let ea = a.dd_rootName;
			let eb = b.dd_rootName;
			let fa = a.dd_displayName.substring(6);
			let fb = b.dd_displayName.substring(6);
			let ga = a.dd_displayName;
			let gb = b.dd_displayName;
			return sortingFunctionMutipleColumnsGivenArray([
				[ea, eb],
				[fa, fb],
				[ga, gb]
			]);
		});
	};

	queryLinks = sortIt($schemaData?.[`${QMSName}Fields`])?.map((query) => {
		let queryName = query.name;
		let queryNameDisplay = queryName;

		let currentQMS_info = schemaData.get_QMS_Field(queryName, QMSName, schemaData);
		const rowsLocation = endpointInfo.get_rowsLocation(currentQMS_info, schemaData);
		const nodeFieldsQMS_info = get_nodeFieldsQMS_info(currentQMS_info, rowsLocation, schemaData);
		let scalarFields = get_scalarColsData(
			nodeFieldsQMS_info,
			[currentQMS_info.dd_displayName, ...rowsLocation],
			schemaData
		);

		let mandatoryArgs = query?.args?.filter((arg) => {
			return arg.dd_NON_NULL;
		});
		let ID_Args = query?.args?.filter((arg) => {
			return arg.dd_rootName == 'ID';
		});
		if (mandatoryArgs?.length > 0) {
			queryNameDisplay = `${queryNameDisplay} (${mandatoryArgs.length}) `;
		}
		if (ID_Args?.length > 0) {
			queryNameDisplay = `${queryNameDisplay} <${ID_Args.length}> `;
		}
		if (scalarFields.length == 0) {
			queryNameDisplay = queryNameDisplay + ' (no scalar)';
		}
		let queryLink = { url: `${parentURL}/${queryName}`, title: queryNameDisplay };
		return queryLink;
	});
	return queryLinks;
};

export const stepsOfFieldsToQueryFragmentObject = (
	stepsOfFields: string[],
	excludeFirstStep: boolean = true,
	dataForLastStep: string = 'novaluehere'
): StepsOfFieldsObject => {
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

	const dd_displayNameToExclude = [
		...node.items.map((item) => {
			return group_argsNode?.[item.id]?.dd_displayName;
		}),
		'_and',
		'_or',
		'_not',
		'and',
		'or',
		'not'
	];

	let fields_Grouped = getFields_Grouped(node, dd_displayNameToExclude, schemaData);
	let scalarFields = fields_Grouped.scalarFields;
	let non_scalarFields = fields_Grouped.non_scalarFields;
	let enumFields = fields_Grouped.enumFields;

	[...scalarFields, ...enumFields].forEach((element) => {
		let stepsOfFields = [
			group.group_name || node.dd_displayName || node.parent_node.dd_displayName,
			element.dd_displayName
		];
		let newArgData = {
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

	let baseFilterOperators = ['_and', '_or', '_not', 'and', 'or', 'not'];

	non_scalarFields
		?.filter((arg) => {
			return !baseFilterOperators.includes(arg.dd_displayName);
		})
		?.forEach((element) => {
			let stepsOfFields = [
				group.group_name || node.dd_displayName || node.parent_node.dd_displayName,
				element.dd_displayName
			];

			let newContainerData = {
				stepsOfFields,
				stepsOfFieldsStringified: JSON.stringify(stepsOfFields),
				id: `${JSON.stringify(stepsOfFields)}${Math.random()}`,
				...element
			};
			let randomNr = Math.random();
			let newContainerDataRootType = schemaData.get_rootType(
				null,
				newContainerData.dd_rootName,
				schemaData
			);

			let isListContainer = newContainerData?.dd_kindList;
			let operator;
			if (!operator && isListContainer) {
				operator = 'list';
			}

			if (!operator) {
				operator = 'bonded';
			}

			group.group_argsNode[`${randomNr}`] = {
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
			} else {
				group.group_argsNode['mainContainer'].items.push({ id: randomNr });
			}
		});
	activeArgumentsDataGrouped_Store.update((data) => {
		return data;
	}); //force update

	node.addDefaultFields = false;
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
	return generate_finalGqlArgObj_fromGroups(groups_gqlArgObj);
};
