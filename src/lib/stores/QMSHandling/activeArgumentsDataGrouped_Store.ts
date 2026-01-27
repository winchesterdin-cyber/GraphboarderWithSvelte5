import {
	argumentCanRunQuery,
	generate_gqlArgObj,
	getPreciseType,
	getRootType
} from '$lib/utils/usefulFunctions';
import { get, writable } from 'svelte/store';
import _ from 'lodash';
import type {
	ActiveArgumentsDataGroupedStore,
	ActiveArgumentGroup,
	ActiveArgumentData,
	ContainerData,
	FieldWithDerivedData,
	SchemaData,
	EndpointInfoStore
} from '$lib/types';

/**
 * Creates a store to manage grouped active arguments for GraphQL operations.
 * @param initialValue Initial state of the store.
 * @param rootGroupArgsVisible Whether root group arguments are visible.
 * @returns The active arguments data grouped store.
 */
export const Create_activeArgumentsDataGrouped_Store = (
	initialValue: ActiveArgumentGroup[] = [],
	rootGroupArgsVisible: boolean = true
): ActiveArgumentsDataGroupedStore => {
	const store = writable<ActiveArgumentGroup[]>(initialValue);
	const { subscribe, set, update } = store;

	return {
		subscribe,
		set,
		update,
		set_groups: (
			QMS_info: FieldWithDerivedData,
			schemaData: SchemaData,
			QMSarguments: Record<string, unknown> | null,
			endpointInfo: EndpointInfoStore
		) => {
			console.debug('Setting active argument groups', { QMS_info, QMSarguments });
			const argsInfo = QMS_info?.args;
			//handle generating activeArgumentsDataGrouped
			const activeArgumentsDataGrouped: ActiveArgumentGroup[] = [];
			const hasRootArgs = argsInfo?.find((el) => {
				return el.dd_isRootArg;
			});

			////-------- all encompassing group !!!put this first to have it overriden by other groups,or last for opposite result
			const addAllArgsGroup = () => {
				const newGroupData: ActiveArgumentGroup = {
					originType: QMS_info,
					group_name: 'all',
					group_hasAllArgs: true,
					group_isRoot: false,
					// group_info: el,
					...QMS_info,
					group_args: [],
					group_argsNode: {
						mainContainer: {
							...QMS_info,
							operator: 'bonded',
							isMain: true,
							not: false,
							items: [],
							id: 'mainContainer',
							stepsOfFields: [],
							stepsOfFieldsStringified: '[]'
						} as unknown as ContainerData // Type assertion needed as FieldWithDerivedData vs ContainerData properties differ
					}
				};
				activeArgumentsDataGrouped.push(newGroupData);
			};
			////-----------
			//////////////////////////----------Smart groups
			const addSmartGroups = () => {
				if (hasRootArgs) {
					const rootGroup: ActiveArgumentGroup = {
						originType: QMS_info,
						group_name: 'root',
						group_isRoot: true,
						group_args: [],
						...QMS_info,
						dd_kindList: false
					};
					activeArgumentsDataGrouped.push(rootGroup);
				}

				argsInfo?.forEach((el) => {
					if (!el.dd_isRootArg) {
						const newGroupData: ActiveArgumentGroup = {
							originType: QMS_info,
							group_name: el.dd_displayName || 'unknown',
							group_isRoot: false,
							...el,
							group_args: [],
							group_argsNode: {
								mainContainer: {
									...el,
									operator: 'bonded',
									isMain: true,
									not: false,
									items: [],
									id: 'mainContainer',
									stepsOfFields: [],
									stepsOfFieldsStringified: '[]'
								} as unknown as ContainerData
							}
						};

						const expectsList = el.dd_kindList;
						if (expectsList && newGroupData.group_argsNode) {
							newGroupData.group_argsNode.mainContainer.operator = 'list';
						}

						activeArgumentsDataGrouped.push(newGroupData);
					}
				});
			};
			//////////////////////////----------
			//addSmartGroups()
			addAllArgsGroup(); //!!!put this first to have it's result overriden by other groups, or last for opposite result

			//filter out duplicate groups:
			const seenGroupNames: string[] = [];
			const uniqueGroups: ActiveArgumentGroup[] = [];
			activeArgumentsDataGrouped.forEach((group) => {
				if (!seenGroupNames.includes(group.group_name)) {
					uniqueGroups.push(group);
					seenGroupNames.push(group.group_name);
				}
			});

			// Clear original array and repopulate to maintain reference if needed, or just reassign
			activeArgumentsDataGrouped.length = 0;
			activeArgumentsDataGrouped.push(...uniqueGroups);

			//Handle QMSarguments data if present
			if (QMSarguments) {
				gqlArgObjToActiveArgumentsDataGrouped(
					QMSarguments,
					activeArgumentsDataGrouped,
					schemaData,
					endpointInfo
				);
			}

			addAllRootArgs(activeArgumentsDataGrouped, schemaData, endpointInfo);
			set(activeArgumentsDataGrouped);
		},
		update_groups: (groupNewData: ActiveArgumentGroup) => {
			update((activeArgumentsDataGrouped) => {
				const index = activeArgumentsDataGrouped.findIndex((group) => {
					return group.group_name == groupNewData.group_name;
				});
				if (index !== -1) {
					activeArgumentsDataGrouped[index] = groupNewData;
				}
				return activeArgumentsDataGrouped;
			});
		},
		update_activeArgument: (activeArgumentData: ActiveArgumentData, groupName: string) => {
			update((activeArgumentsDataGrouped) => {
				const gqlArgObj = generate_gqlArgObj([activeArgumentData]);
				const canRunQuery = argumentCanRunQuery(activeArgumentData);
				Object.assign(activeArgumentData, { ...gqlArgObj, canRunQuery });
				const group = activeArgumentsDataGrouped?.find((group) => {
					return group.group_name == groupName;
				});

				if (!group) {
					console.warn('Group not found for update_activeArgument', {
						groupName,
						activeArgumentData
					});
					return activeArgumentsDataGrouped;
				}

				const activeArgumentIndex = group.group_args?.findIndex((arg) => {
					return arg.id == activeArgumentData.id;
				});
				const activeArgument =
					activeArgumentIndex >= 0 && group.group_args
						? group.group_args[activeArgumentIndex]
						: null;
				const activeArgumentNode = group?.group_argsNode?.[activeArgumentData.id];

				if (!activeArgument && !activeArgumentNode) {
					console.warn('Argument not found in group, cannot update', {
						groupName,
						argumentId: activeArgumentData.id
					});
					return activeArgumentsDataGrouped;
				}

				if (activeArgumentNode && group.group_argsNode) {
					// Create new object to maintain immutability for better reactivity
					group.group_argsNode[activeArgumentData.id] = {
						...activeArgumentNode,
						...activeArgumentData
					} as ContainerData;
				}
				if (activeArgument && activeArgumentIndex >= 0 && group.group_args) {
					// Replace the argument in the array to maintain immutability
					group.group_args[activeArgumentIndex] = { ...activeArgument, ...activeArgumentData };
				}

				return activeArgumentsDataGrouped;
			});
		},
		delete_activeArgument: (activeArgumentData: ActiveArgumentData, groupName: string) => {
			update((activeArgumentsDataGrouped) => {
				const group = activeArgumentsDataGrouped?.find((group) => {
					return group.group_name == groupName;
				});

				if (!group) {
					console.warn('Group not found for delete_activeArgument', {
						groupName,
						activeArgumentData
					});
					return activeArgumentsDataGrouped;
				}

				const activeArgumentIndex = group.group_args?.findIndex((arg) => {
					return arg.id == activeArgumentData.id;
				});

				if (activeArgumentIndex === undefined || activeArgumentIndex < 0) {
					console.warn('Argument not found in group, cannot delete', {
						groupName,
						argumentId: activeArgumentData.id
					});
					return activeArgumentsDataGrouped;
				}

				if (group.group_argsNode) {
					const containers = Object.values(group.group_argsNode).filter((container) => {
						return container?.items;
					});
					const argumentParentContainer = containers.find((container) => {
						return container.items.find((item) => {
							return item.id == activeArgumentData.id;
						});
					});

					if (argumentParentContainer) {
						group.group_argsNode[argumentParentContainer.id].items = group.group_argsNode[
							argumentParentContainer.id
						].items.filter((item) => {
							return item.id != activeArgumentData.id;
						});
					}

					// Remove from group_args array
					if (activeArgumentIndex >= 0 && group.group_args) {
						group.group_args.splice(activeArgumentIndex, 1);
					}

					// Remove from group_argsNode
					delete group.group_argsNode[activeArgumentData.id];
				} else {
					// Simple case: no argsNode structure
					if (activeArgumentIndex >= 0 && group.group_args) {
						group.group_args.splice(activeArgumentIndex, 1);
					}
				}
				return activeArgumentsDataGrouped;
			});
		},
		get_activeArgument: (stepsOfFields: string[], group_name: string = 'root') => {
			const storeValue = get(store);
			return storeValue
				.find((group) => {
					return group.group_name == group_name;
				})
				?.group_args?.find((arg) => {
					return arg.stepsOfFieldsStringified == JSON.stringify(stepsOfFields);
				});
		},
		add_activeArgument: (
			newArgumentOrContainerData: ActiveArgumentData | ContainerData,
			groupName: string,
			parentContainerId: string | null,
			endpointInfo: EndpointInfoStore
		) => {
			update((activeArgumentsDataGrouped) => {
				const result = add_activeArgumentOrContainerTo_activeArgumentsDataGrouped(
					newArgumentOrContainerData,
					groupName,
					parentContainerId,
					activeArgumentsDataGrouped,
					endpointInfo
				);
				// Return a new array to trigger reactivity
				return [...result];
			});
		}
	};
};

export const add_activeArgumentOrContainerTo_activeArgumentsDataGrouped = (
	newArgumentOrContainerData: ActiveArgumentData | ContainerData,
	groupName: string,
	parentContainerId: string | null,
	activeArgumentsDataGrouped: ActiveArgumentGroup[],
	endpointInfo: EndpointInfoStore,
	group?: ActiveArgumentGroup
): ActiveArgumentGroup[] => {
	const dataIsForContainer = (newArgumentOrContainerData as ContainerData)?.items;
	if (!group) {
		group = activeArgumentsDataGrouped?.find((currGroup) => {
			return currGroup.group_name == groupName;
		});
	}
	if (!group) {
		console.warn('group not found', { groupName, newArgumentOrContainerData });
		return activeArgumentsDataGrouped;
	}
	(function () {
		if (dataIsForContainer) {
			return;
		}
		if (!endpointInfo) {
			return;
		}
		const typeExtraData = endpointInfo.get_typeExtraData(newArgumentOrContainerData);
		if (!typeExtraData) {
			return;
		}
		const gqlArgObj = generate_gqlArgObj([newArgumentOrContainerData]);
		newArgumentOrContainerData = _.merge({}, newArgumentOrContainerData, gqlArgObj);
		if (typeExtraData.defaultValue == undefined) {
			return;
		}

		if (newArgumentOrContainerData.chd_rawValue == undefined) {
			newArgumentOrContainerData.chd_rawValue = typeExtraData.defaultValue;
		}
		if (newArgumentOrContainerData.chd_dispatchValue == undefined) {
			newArgumentOrContainerData.chd_dispatchValue = typeExtraData.use_transformer(
				typeExtraData.defaultValue
			);
		}
	})();

	{
		if (group.group_argsNode) {
			//to prevent --> Uncaught TypeError: Converting circular structure to JSON
			newArgumentOrContainerData.dd_relatedRoot =
				'overwritten to evade error: Uncaught TypeError: Converting circular structure to JSON' as any;
			newArgumentOrContainerData.not = false;
			group.group_argsNode[newArgumentOrContainerData.id] =
				newArgumentOrContainerData as ContainerData;

			if (parentContainerId && group.group_argsNode[parentContainerId]) {
				group.group_argsNode[parentContainerId].items.push(newArgumentOrContainerData as any);
			} else if (group.group_argsNode.mainContainer) {
				group.group_argsNode.mainContainer.items.push(newArgumentOrContainerData as any);
			}
			group.group_args.push(newArgumentOrContainerData);
		} else {
			if (
				!group.group_args.some((el) => {
					return el.stepsOfFieldsStringified == newArgumentOrContainerData.stepsOfFieldsStringified;
				})
			) {
				group.group_args.push(newArgumentOrContainerData);
			} else {
			}
		}
	}
	return activeArgumentsDataGrouped;
};

export const generateContainerData = (
	stepsOfFields: string[],
	type: Partial<FieldWithDerivedData>,
	extraData: Record<string, unknown> = {}
): ContainerData => {
	const dd_displayName = type.dd_displayName || 'unknown';

	const stepsOfFieldsCopy = [...stepsOfFields];
	if (stepsOfFieldsCopy[stepsOfFieldsCopy.length - 1] !== dd_displayName) {
		stepsOfFieldsCopy.push(dd_displayName);
	}

	const lastDefiningData: any = {};
	if (type && type.dd_kindList) {
		lastDefiningData.operator = 'list';
	}

	return {
		///inputFields,
		///enumValues,
		items: [],
		stepsOfFields: stepsOfFieldsCopy,
		stepsOfFieldsStringified: JSON.stringify(stepsOfFieldsCopy),
		id: `qqqqqq${Math.random()}`,
		...type,
		...extraData,
		...lastDefiningData
	} as ContainerData;
};

export const generateArgData = (
	stepsOfFields: string[],
	type: Partial<FieldWithDerivedData>,
	schemaData: SchemaData,
	extraData: Record<string, unknown> = {}
): ActiveArgumentData => {
	const dd_displayName = type.dd_displayName || 'unknown';

	const RootType = getRootType(null, type.dd_rootName, schemaData);
	const inputFields = RootType?.inputFields;
	const enumValues = RootType?.enumValues;

	const stepsOfFieldsCopy = [...stepsOfFields];
	if (stepsOfFieldsCopy[stepsOfFieldsCopy.length - 1] !== dd_displayName) {
		stepsOfFieldsCopy.push(dd_displayName);
	}

	return {
		not: false,
		inputFields,
		enumValues,
		stepsOfFields: stepsOfFieldsCopy,
		stepsOfFieldsStringified: JSON.stringify(stepsOfFieldsCopy),
		id: `qqqqqq${Math.random()}`,
		...type,
		...extraData
	};
};

const addAllRootArgs = (
	activeArgumentsDataGrouped: ActiveArgumentGroup[],
	schemaData: SchemaData,
	endpointInfo: EndpointInfoStore
): void => {
	const group = activeArgumentsDataGrouped.find((group) => {
		return group.group_name == 'root';
	});
	if (!group) {
		return;
	}
	const groupName = group.group_name;
	const groupOriginType = group.originType;
	if (!groupOriginType.args) return;

	const groupArgs = groupOriginType.args.filter((arg) => {
		return arg.dd_isRootArg;
	});
	groupArgs.forEach((argType, i) => {
		const argData = generateArgData([argType.dd_displayName || 'unknown'], argType, schemaData);
		add_activeArgumentOrContainerTo_activeArgumentsDataGrouped(
			argData,
			groupName,
			null,
			activeArgumentsDataGrouped,
			endpointInfo
		);
	});
};

const gqlArgObjToActiveArgumentsDataGrouped = (
	object: Record<string, unknown>,
	activeArgumentsDataGrouped: ActiveArgumentGroup[],
	schemaData: SchemaData,
	endpointInfo: EndpointInfoStore
): ActiveArgumentGroup[] => {
	const getGroupGqlArgObj = (
		object: Record<string, unknown>,
		rootGroupGqlArgObj: Record<string, unknown>,
		group: ActiveArgumentGroup
	): Record<string, unknown> | undefined => {
		if (!group.group_isRoot) {
			return object?.[group.group_name] as Record<string, unknown>;
		}
		return rootGroupGqlArgObj;
	};
	//object is QMSarguments object
	const nonRootGroupNames = activeArgumentsDataGrouped.map((group) => {
		if (!group.group_isRoot) {
			return group.group_name;
		}
	});

	const rootGroupGqlArgObj: Record<string, unknown> = {};
	Object.keys(object).forEach((key) => {
		if (!nonRootGroupNames.includes(key)) {
			rootGroupGqlArgObj[key] = object[key];
		}
	});
	//iterate through groups
	activeArgumentsDataGrouped.forEach((group) => {
		const groupName = group.group_name;
		const group_isRoot = group.group_isRoot;
		const groupGqlArgObj = getGroupGqlArgObj(object, rootGroupGqlArgObj, group);
		const groupOriginType = group.originType;

		if (!groupGqlArgObj) {
			return;
		}

		//Do the magic here:
		if (group_isRoot && groupOriginType.args) {
			const groupArgNames = Object.keys(groupGqlArgObj);
			//!!!this block should work correctly,you will see some errors only because root group is not handled correctly in generating gqlArgObj after ui changes,test it and see,it only handles one argument even if u set multiple.
			groupArgNames.forEach((argName, i) => {
				const argType = groupOriginType.args!.filter((type) => {
					return type.dd_displayName == argName;
				})[0];
				if (!argType) return;

				const argValue = groupGqlArgObj[argName];
				const argData = generateArgData([argName], argType, schemaData, {
					chd_rawValue: argValue,
					chd_dispatchValue: argValue,
					inUse: true
				});

				add_activeArgumentOrContainerTo_activeArgumentsDataGrouped(
					argData,
					groupName,
					null,
					activeArgumentsDataGrouped,
					endpointInfo,
					undefined
				);
			});
		} else {
			// Handle non-root groups
			if (!group.group_argsNode) {
				// For groups without argsNode structure, we skip for now
				return;
			}

			// For groups with argsNode (like "all" group), process all arguments
			const groupArgNames = Object.keys(groupGqlArgObj);
			groupArgNames.forEach((argName) => {
				// Find the argument type from the origin type
				const argType = groupOriginType.args?.find((type) => {
					return type.dd_displayName === argName;
				});

				if (!argType) {
					console.warn(`Argument type not found for: ${argName}`);
					return;
				}

				const argValue = groupGqlArgObj[argName];

				// Create argument data with the value from the query
				const argData = generateArgData([argName], argType, schemaData, {
					chd_rawValue: argValue,
					chd_dispatchValue: argValue,
					inUse: true
				});

				// Add the argument to the group
				add_activeArgumentOrContainerTo_activeArgumentsDataGrouped(
					argData,
					groupName,
					null,
					activeArgumentsDataGrouped,
					endpointInfo,
					group
				);
			});
		}
	});
	return activeArgumentsDataGrouped;
};

const gqlArgObjToActiveArgumentsDataGroupedForHasArgsNode = (
	gqlArgObj: any[],
	type: Partial<FieldWithDerivedData>,
	groupName: string,
	group: ActiveArgumentGroup,
	activeArgumentsDataGrouped: ActiveArgumentGroup[],
	schemaData: SchemaData,
	endpointInfo: EndpointInfoStore
): void => {
	let group_argsNode;
	const gqlArgObjTypeOf = getPreciseType(gqlArgObj);
	const isContainer = type.dd_shouldExpand;
	(function () {
		//handle containers only
		if (!isContainer) {
			return;
		}
		if (gqlArgObjTypeOf == 'array') {
			gqlArgObj.forEach((element) => {});
		}
	})();
};
