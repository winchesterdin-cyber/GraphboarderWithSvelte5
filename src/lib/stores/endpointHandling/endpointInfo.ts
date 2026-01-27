import {
	boolean_transformer,
	geojson_transformer,
	ISO8601_transformer,
	string_transformer,
	number_transformer,
	string_transformerREVERSE,
	geojson_transformerREVERSE,
	ISO8601_transformerREVERSE,
	ISO8601_transformerGETDEFAULTVAl
} from '$lib/utils/dataStructureTransformers';
import { writable, get } from 'svelte/store';
import { getDeepField, getFields_Grouped, getRootType } from '$lib/utils/usefulFunctions';
import type {
	EndpointConfiguration,
	EndpointInfoStore,
	FieldWithDerivedData,
	SchemaData,
	QMSObjectiveParams,
	TypeExtraData,
	DisplayInterface
} from '$lib/types';

export const endpointInfoDefaultValues: EndpointConfiguration = {
	description: 'no description',
	rowsLocationPossibilities: [
		{
			get_Val: (QMS_info: FieldWithDerivedData, schemaData: SchemaData) => {
				return ['edges'];
			},
			check: (QMS_info: FieldWithDerivedData, schemaData: SchemaData) => {
				const QMS_infoRootType = getRootType(null, QMS_info.dd_rootName, schemaData);
				if (!QMS_infoRootType?.fields) {
					console.error('QMS_infoRootType.fields is undefined');
					return false;
				}
				return !!QMS_infoRootType.fields.find((field) => field.dd_displayName === 'edges');
			}
		},
		{
			get_Val: (QMS_info: FieldWithDerivedData, schemaData: SchemaData) => {
				return [];
			},
			check: (QMS_info: FieldWithDerivedData, schemaData: SchemaData) => {
				return true;
			}
		}
	],
	rowCountLocationPossibilities: [],
	relayPageInfoFieldsPossibleNames: {
		hasNextPage: ['hasNextPage'],
		hasPreviousPage: ['hasPreviousPage'],
		startCursor: ['previousPage', 'startCursor'],
		endCursor: ['nextPage', 'endCursor'],
		cursor: ['cursor']
	},
	relayCursorPossibleNames: {
		cursor: ['cursor']
	},
	paginationArgsPossibleNames: {
		limit: ['limit'],
		offset: ['offset', 'skip'],
		first: ['first', '_size'],
		last: ['last'],
		after: ['after', '_cursor'],
		before: ['before'],
		from: ['from'],
		page: ['page']
	},
	idFieldPossibilities: [
		{
			get_Val: function (QMS_info: FieldWithDerivedData, schemaData: SchemaData) {
				// The check function returns boolean OR FieldWithDerivedData in the interface I defined?
				// Actually I defined check as returning boolean | FieldWithDerivedData | undefined in types.
				// Here it calls check and returns the result.
				return this.check(QMS_info, schemaData) as FieldWithDerivedData | undefined;
			},
			check: (QMS_info: FieldWithDerivedData, schemaData: SchemaData) => {
				const rootType = getRootType(null, QMS_info.dd_rootName, schemaData);
				if (!rootType) return undefined;

				const fields = rootType?.fields;
				let idField;
				const { scalarFields } = getFields_Grouped(rootType, [], schemaData);
				const nonNullScalarFields = scalarFields.filter((field) => {
					return field.dd_NON_NULL;
				});
				if (nonNullScalarFields.length == 1) {
					return nonNullScalarFields[0];
				}

				const tableNameLowercase = QMS_info.dd_displayName.toLowerCase().replaceAll('s', '');

				const possibleNames = ['id', `${tableNameLowercase}_id`, `${tableNameLowercase}id`];
				// Array.find doesn't return the FOUND element of the inner search, it returns the element of possibleNames.
				// The original code logic was slightly flawed: `possibleNames.find` returns a string, but the callback sets `idField`.
				possibleNames.find((possibleName) => {
					idField = nonNullScalarFields?.find((field) => {
						const fieldDisplayNameLowercase = field.dd_displayName
							.toLowerCase()
							.replaceAll('s', '');
						return possibleName == fieldDisplayNameLowercase;
					});
					return !!idField;
				});
				if (idField) {
					return idField;
				}
				idField = nonNullScalarFields?.find((field) => {
					const fieldDisplayNameLowercase = field.dd_displayName.toLowerCase().replaceAll('s', '');
					return possibleNames.includes(fieldDisplayNameLowercase) || field.dd_rootName == 'ID';
				});
				if (idField) {
					return idField;
				}

				idField = nonNullScalarFields?.find((field) => {
					const fieldDisplayNameLowercase = field.dd_displayName.toLowerCase().replaceAll('s', '');
					return tableNameLowercase.includes(fieldDisplayNameLowercase);
				});
				if (idField) {
					return idField;
				}
				idField = nonNullScalarFields?.find((field) => {
					const fieldDisplayNameLowercase = field.dd_displayName.toLowerCase().replaceAll('s', '');
					return fieldDisplayNameLowercase.includes(tableNameLowercase);
				});
				if (idField) {
					return idField;
				}

				const idFields = nonNullScalarFields?.filter((field) => {
					const fieldDisplayNameLowercase = field.dd_displayName.toLowerCase().replaceAll('s', '');
					return fieldDisplayNameLowercase.includes('id');
				});
				if (idFields.length > 1) {
					console.debug('private key could be a conbination of these columns:', { idFields });
				}
				if (idFields.length == 1) {
					return idFields[0];
				}
				console.debug('id field is one of these', { nonNullScalarFields });
				return undefined;
			}
		}
	],
	typesExtraDataPossibilities: [
		{
			get_Val: () => {
				return {
					displayInterface: 'codeeditor',
					defaultValue: '{}',
					use_transformerREVERSE: (val) => val,
					use_transformer: (val: unknown) => string_transformer(val as string)
				};
			},
			check: function (
				dd_rootName: string,
				dd_displayName: string,
				typeObj: Partial<FieldWithDerivedData>
			) {
				if (!dd_rootName) {
					return null;
				}
				const dd_displayNameLowerCase = dd_displayName.toLowerCase();
				return dd_displayNameLowerCase.includes('config');
			}
		},
		{
			get_Val: () => {
				return {
					displayInterface: 'text',
					defaultValue: ' ',
					use_transformerREVERSE: (val: unknown) => string_transformerREVERSE(val as string),
					use_transformer: (val: unknown) => string_transformer(val as string)
				};
			},
			check: function (
				dd_rootName: string,
				dd_displayName: string,
				typeObj: Partial<FieldWithDerivedData>
			) {
				if (!dd_rootName) {
					return null;
				}
				if (typeObj.dd_kindEl?.toLowerCase() == 'enum') {
					return null;
				}
				const dd_rootNameLowerCase = dd_rootName.toLowerCase();
				return dd_rootNameLowerCase.includes('string') || dd_rootNameLowerCase.includes('text');
			}
		},
		{
			get_Val: () => {
				return {
					displayInterface: 'datetime-local',
					defaultValue: ISO8601_transformerGETDEFAULTVAl(),
					use_transformerREVERSE: (val: unknown) => ISO8601_transformerREVERSE(val),
					use_transformer: (val: unknown) => ISO8601_transformer(val as string)
				};
			},
			check: function (
				dd_rootName: string,
				dd_displayName: string,
				typeObj: Partial<FieldWithDerivedData>
			) {
				if (!dd_rootName) {
					return null;
				}
				if (typeObj.dd_kindEl?.toLowerCase() == 'enum') {
					return null;
				}
				const dd_rootNameLowerCase = dd_rootName.toLowerCase();
				return (
					dd_rootNameLowerCase.includes('timestamp') ||
					dd_rootNameLowerCase.replace('update', '').includes('date') ||
					dd_rootNameLowerCase.includes('time')
				);
			}
		},
		{
			get_Val: () => {
				return {
					displayInterface: 'number',
					defaultValue: 0,
					use_transformerREVERSE: (val) => val,
					use_transformer: (val: unknown) => number_transformer(val as string)
				};
			},
			check: function (
				dd_rootName: string,
				dd_displayName: string,
				typeObj: Partial<FieldWithDerivedData>
			) {
				if (!dd_rootName) {
					return null;
				}
				if (typeObj.dd_kindEl?.toLowerCase() == 'enum') {
					return null;
				}
				const dd_rootNameLowerCase = dd_rootName.toLowerCase();
				return (
					dd_rootNameLowerCase.replace('constraint', '').includes('int') ||
					dd_rootNameLowerCase.includes('float')
				);
			}
		},
		{
			get_Val: () => {
				return {
					displayInterface: 'geo',
					defaultValue: undefined,
					use_transformerREVERSE: (val: unknown) => geojson_transformerREVERSE(val as any),
					use_transformer: (val: unknown) => geojson_transformer(val as any)
				};
			},
			check: function (
				dd_rootName: string,
				dd_displayName: string,
				typeObj: Partial<FieldWithDerivedData>
			) {
				if (!dd_rootName) {
					return null;
				}
				if (typeObj.dd_kindEl?.toLowerCase() == 'enum') {
					return null;
				}
				const dd_rootNameLowerCase = dd_rootName.toLowerCase();
				return dd_rootNameLowerCase.includes('geo');
			}
		},
		{
			get_Val: () => {
				return {
					displayInterface: 'boolean',
					defaultValue: true,
					use_transformerREVERSE: (val) => val,
					use_transformer: boolean_transformer
				};
			},
			check: function (
				dd_rootName: string,
				dd_displayName: string,
				typeObj: Partial<FieldWithDerivedData>
			) {
				if (!dd_rootName) {
					return null;
				}
				if (typeObj.dd_kindEl?.toLowerCase() == 'enum') {
					return null;
				}
				const dd_rootNameLowerCase = dd_rootName.toLowerCase();
				return dd_rootNameLowerCase.includes('bool');
			}
		},
		{
			get_Val: () => {
				return {
					displayInterface: 'ENUM',
					defaultValue: [],
					use_transformerREVERSE: (val) => val,
					use_transformer: (val) => val
				};
			},
			check: function (
				dd_rootName: string,
				dd_displayName: string,
				typeObj: Partial<FieldWithDerivedData>
			) {
				if (!dd_rootName) {
					return null;
				}
				const dd_rootNameLowerCase = dd_rootName.toLowerCase();
				return dd_rootNameLowerCase.includes('enum') || dd_rootNameLowerCase.includes('constraint');
			}
		},
		{
			get_Val: () => {
				return {
					displayInterface: null,
					defaultValue: null,
					use_transformerREVERSE: (val) => val,
					use_transformer: (val) => val
				};
			},
			check: function (
				dd_rootName: string,
				dd_displayName: string,
				typeObj: Partial<FieldWithDerivedData>
			) {
				return true;
			}
		}
	],
	idDecoderPossibilities: [
		{
			get_Val: (QMS_info: FieldWithDerivedData, schemaData: SchemaData, id: string) => {
				return id;
			},
			check: (QMS_info: FieldWithDerivedData, schemaData: SchemaData) => {
				return true;
			}
		}
	],
	returningColumnsPossibleLocationsInMutations: [[]],
	returningColumnsPossibleLocationsInQueriesPerRow: [['node'], []],
	inputColumnsPossibleLocationsInArg: [[]],
	pageInfoFieldsLocation: ['pageInfo']
};

export const create_endpointInfo_Store = (
	endpointConfiguration: Partial<EndpointConfiguration> = {}
): EndpointInfoStore => {
	const store = writable<EndpointConfiguration>({
		...endpointInfoDefaultValues,
		...endpointConfiguration
	});

	const get_fieldsNames = (
		currentQMS_info: FieldWithDerivedData,
		fieldsLocation: string[],
		schemaData: SchemaData,
		FieldsPossibleNamesName: keyof EndpointConfiguration
	): Record<string, string> | null => {
		const storeVal = get(store);
		if (!storeVal || !storeVal[FieldsPossibleNamesName]) {
			return null;
		}

		const possibleNamesRecord = storeVal[FieldsPossibleNamesName] as Record<string, string[]>;
		const fieldsNames: Record<string, string> = {};

		const QMSInfo = getDeepField(currentQMS_info, fieldsLocation, schemaData, 'fields');
		if (!QMSInfo) return null;

		const QMSInfoROOT = getRootType(null, QMSInfo.dd_rootName, schemaData);
		if (!QMSInfoROOT?.fields) return null;

		const QMSInfoROOTFieldNames = QMSInfoROOT.fields.map((field) => field.dd_displayName);

		for (const [name, possibilities] of Object.entries(possibleNamesRecord)) {
			const found = possibilities.find((possibility) =>
				QMSInfoROOTFieldNames.includes(possibility)
			);
			if (found) {
				fieldsNames[name] = found;
			}
		}
		return fieldsNames;
	};

	return {
		...store,
		get_thisContext: function (): EndpointInfoStore {
			return this;
		},
		smartSet: (newEndpoint: EndpointConfiguration) => {
			store.set({ ...endpointInfoDefaultValues, ...newEndpoint });
		},
		get_inputFieldsContainerLocation: function (
			QMS_info: FieldWithDerivedData,
			schemaData: SchemaData
		) {
			const storeVal = get(store);
			if (
				!storeVal?.inputColumnsPossibleLocationsInArg ||
				storeVal.inputColumnsPossibleLocationsInArg.length === 0
			) {
				return [];
			}

			const inputColumnsLocationInArg = storeVal.inputColumnsPossibleLocationsInArg.find(
				(currPossibility) => {
					if (currPossibility.length == 0) {
						return true;
					}
					const deepField = getDeepField(QMS_info, currPossibility, schemaData, 'inputFields');
					if (deepField) {
						return true;
					}
					return false;
				}
			);

			if (inputColumnsLocationInArg) {
				return inputColumnsLocationInArg;
			}
			return [];
		},
		get_rowsLocation: function (QMS_info: FieldWithDerivedData, schemaData: SchemaData) {
			const storeVal = get(store);
			if (!storeVal?.rowsLocationPossibilities || storeVal.rowsLocationPossibilities.length === 0) {
				return [];
			}

			const rowsLocationPossibilitiy = storeVal.rowsLocationPossibilities.find(
				(rowsLocationPossibilitiy) => {
					return rowsLocationPossibilitiy.check(QMS_info, schemaData);
				}
			);
			if (rowsLocationPossibilitiy) {
				const val = rowsLocationPossibilitiy.get_Val(QMS_info, schemaData);
				return val || [];
			}
			return [];
		},
		get_rowCountLocation: function (QMS_info: FieldWithDerivedData, schemaData: SchemaData) {
			const storeVal = get(store);
			if (
				!storeVal ||
				!storeVal.rowCountLocationPossibilities ||
				storeVal.rowCountLocationPossibilities.length === 0
			) {
				return null;
			}

			const rowCountLocationPossibility = storeVal.rowCountLocationPossibilities.find(
				(rowCountLocationPossibility) => {
					return rowCountLocationPossibility.check(QMS_info, schemaData);
				}
			);

			if (rowCountLocationPossibility) {
				return rowCountLocationPossibility.get_Val(QMS_info, schemaData);
			}
			console.debug('no rowCountLocation found', QMS_info.dd_displayName);
			return null;
		},
		get_idField: (QMS_info: FieldWithDerivedData, schemaData: SchemaData) => {
			const storeVal = get(store);
			if (
				!storeVal ||
				!storeVal.idFieldPossibilities ||
				storeVal.idFieldPossibilities.length === 0
			) {
				console.warn('no idFieldPossibilities found or endpointInfo value is null/undefined');
				return null;
			}
			const idFieldPossibility = storeVal.idFieldPossibilities.find((idFieldPossibility) => {
				return !!idFieldPossibility.check(QMS_info, schemaData);
			});

			if (idFieldPossibility) {
				return idFieldPossibility.get_Val(QMS_info, schemaData) || null;
			}
			console.debug('no idField found', {
				QMS_info: QMS_info.dd_displayName
			});

			return null;
		},
		get_typeExtraData: (
			typeInfo: Partial<FieldWithDerivedData>,
			choosenDisplayInterface?: DisplayInterface
		) => {
			const storeVal = get(store);
			if (
				!storeVal ||
				!storeVal.typesExtraDataPossibilities ||
				storeVal.typesExtraDataPossibilities.length === 0
			) {
				return null;
			}
			let typesExtraDataPossibility;
			if (choosenDisplayInterface) {
				typesExtraDataPossibility = storeVal.typesExtraDataPossibilities.find((possibility) => {
					return possibility.get_Val().displayInterface == choosenDisplayInterface;
				});
			} else {
				typesExtraDataPossibility = storeVal.typesExtraDataPossibilities.find(
					(typesExtraDataPossibility) => {
						return (
							typesExtraDataPossibility.check(
								typeInfo.dd_kindEl || '',
								typeInfo.dd_displayName || '',
								typeInfo
							) ||
							typesExtraDataPossibility.check(
								typeInfo.dd_rootName || '',
								typeInfo.dd_displayName || '',
								typeInfo
							)
						);
					}
				);
			}

			if (typesExtraDataPossibility) {
				return typesExtraDataPossibility.get_Val(typeInfo as FieldWithDerivedData);
			}
			return null;
		},
		get_tableName: (QMS_info: FieldWithDerivedData, schemaData: SchemaData) => {
			const storeVal = get(store);
			if (
				!storeVal ||
				!storeVal.tableNamePossibilities ||
				storeVal.tableNamePossibilities.length === 0
			) {
				return null;
			}
			const tableNamePossibility = storeVal.tableNamePossibilities.find((tableNamePossibility) => {
				return tableNamePossibility.check(QMS_info, schemaData);
			});

			if (tableNamePossibility) {
				return tableNamePossibility.get_Val(QMS_info, schemaData);
			}
			console.debug('no tableName found');

			return null;
		},
		get_qmsNameForObjective: function (
			QMS_info: FieldWithDerivedData,
			schemaData: SchemaData,
			qmsObjective: string
		) {
			const thisContext = this;
			const tableName = this.get_tableName(QMS_info, schemaData);
			if (!tableName) {
				console.debug('no qmsNameForObjective found because tableName is null');
				return null;
			}
			const storeVal = get(store);
			if (
				!storeVal ||
				!storeVal.qmsNameForObjectivePossibilities ||
				storeVal.qmsNameForObjectivePossibilities.length === 0
			) {
				return null;
			}
			const qmsNameForObjectivePossibility = storeVal.qmsNameForObjectivePossibilities.find(
				(qmsNameForObjectivePossibility) => {
					return qmsNameForObjectivePossibility.check({
						QMS_info,
						schemaData,
						thisContext,
						tableName,
						qmsObjective
					});
				}
			);

			if (qmsNameForObjectivePossibility) {
				return qmsNameForObjectivePossibility.get_Val({
					QMS_info,
					schemaData,
					thisContext,
					tableName,
					qmsObjective
				});
			}
			console.debug('no qmsNameForObjective found');

			return null;
		},
		get_decodedId: (QMS_info: FieldWithDerivedData, schemaData: SchemaData, id: string) => {
			const storeVal = get(store);
			if (
				!storeVal ||
				!storeVal.idDecoderPossibilities ||
				storeVal.idDecoderPossibilities.length === 0
			) {
				return null;
			}
			const idDecoderPossibility = storeVal.idDecoderPossibilities.find((idDecoderPossibility) => {
				return idDecoderPossibility.check(QMS_info, schemaData);
			});

			if (idDecoderPossibility) {
				return idDecoderPossibility.get_Val(QMS_info, schemaData, id);
			}
			console.debug('no idDecoder found');

			return null;
		},

		get_relayPageInfoFieldsNames: (
			currentQMS_info: FieldWithDerivedData,
			pageInfoFieldsLocation: string[],
			schemaData: SchemaData
		) => {
			const storeVal = get(store);
			if (!storeVal || !storeVal.relayPageInfoFieldsPossibleNames) {
				return null;
			}
			return get_fieldsNames(
				currentQMS_info,
				pageInfoFieldsLocation,
				schemaData,
				'relayPageInfoFieldsPossibleNames'
			);
		},
		get_relayCursorFieldName: (
			currentQMS_info: FieldWithDerivedData,
			rowsLocation: string[],
			schemaData: SchemaData
		) => {
			const storeVal = get(store);
			if (!storeVal || !storeVal.relayCursorPossibleNames) {
				return null;
			}
			return get_fieldsNames(currentQMS_info, rowsLocation, schemaData, 'relayCursorPossibleNames');
		}
	};
};
