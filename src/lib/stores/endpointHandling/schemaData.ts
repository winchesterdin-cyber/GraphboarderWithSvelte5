import {
	get_NamesArray,
	get_KindsArray,
	sortByName,
	get_rootName,
	get_displayName,
	generate_derivedData
} from '$lib/utils/usefulFunctions';
import { get, writable } from 'svelte/store';
import type {
	SchemaDataValue,
	SchemaDataStore,
	EndpointInfoStore,
	RootType,
	FieldWithDerivedData,
	QMSType
} from '$lib/types';

/**
 * Creates a store to manage the GraphQL schema data and its derived metadata.
 * @returns An object conforming to the SchemaDataStore interface.
 */
export const create_schemaData = (): SchemaDataStore => {
	const store = writable<SchemaDataValue>({
		rootTypes: [],
		queryFields: [],
		mutationFields: [],
		subscriptionFields: [], // Initialize missing property
		schema: {},
		isReady: false
	});
	const { subscribe, set, update } = store;

	const returnObject: SchemaDataStore = {
		subscribe,
		set,
		update,
		/**
		 * Sets the raw schema object.
		 * @param schema The raw GraphQL schema.
		 */
		set_schema: (schema: any) => {
			// This was empty in original, maybe implementation is missing or it's a placeholder?
			// Assuming it should update the store if needed, but original was empty.
			// Ideally we should update the store.
			update((val) => ({ ...val, schema }));
		},

		/**
		 * Processes and sets the root types of the schema.
		 * @param withDerivedData Whether to generate derived data for fields.
		 * @param set_storeVal Whether to update the store value immediately.
		 * @param endpointInfo The endpoint configuration store.
		 * @returns The processed root types.
		 */
		set_rootTypes: (
			withDerivedData: boolean,
			set_storeVal: boolean = true,
			endpointInfo: EndpointInfoStore
		): RootType[] => {
			console.debug('set_rootTypes called', { withDerivedData, set_storeVal });
			const storeValue = get(store);
			const { schema } = storeValue;

			// Ensure schema.types exists before proceeding
			if (!schema || !schema.types) {
				console.warn('Schema or schema.types is missing in set_rootTypes');
				return [];
			}

			const new_rootTypes = sortByName([...schema.types]);
			if (withDerivedData) {
				new_rootTypes.forEach((el: any) => {
					Object.assign(
						el,
						generate_derivedData(el, new_rootTypes, false, endpointInfo, returnObject)
					);
					el?.args?.forEach((arg: any) => {
						Object.assign(
							arg,
							generate_derivedData(arg, new_rootTypes, false, endpointInfo, returnObject)
						);
					});
					el?.fields?.forEach((field: any) => {
						Object.assign(
							field,
							generate_derivedData(field, new_rootTypes, false, endpointInfo, returnObject)
						);
						field?.args?.forEach((arg: any) => {
							Object.assign(
								arg,
								generate_derivedData(arg, new_rootTypes, false, endpointInfo, returnObject)
							);
						});
					});
					el?.inputFields?.forEach((inputField: any) => {
						Object.assign(
							inputField,
							generate_derivedData(inputField, new_rootTypes, false, endpointInfo, returnObject)
						);
					});
					el?.enumValues?.forEach((enumValue: any) => {
						Object.assign(
							enumValue,
							generate_derivedData(enumValue, new_rootTypes, false, endpointInfo, returnObject)
						);
					});
				});
			}

			if (set_storeVal) {
				storeValue.rootTypes = new_rootTypes;
				set(storeValue);
			}

			return new_rootTypes;
		},

		set_rootTypes_DerivedData: () => {
			// Placeholder implementation from original
		},

		/**
		 * Sets the fields for Query, Mutation, and Subscription types.
		 * @param withDerivedData Whether to generate derived data.
		 * @param set_storeVal Whether to update the store.
		 * @param QMS Array of operation type names ('query', 'mutation', 'subscription').
		 * @param endpointInfo The endpoint configuration store.
		 * @returns An object containing the new fields for each operation type.
		 */
		set_QMSFields: (
			withDerivedData: boolean,
			set_storeVal: boolean = true,
			QMS: string[] = ['query', 'mutation', 'subscription'],
			endpointInfo: EndpointInfoStore
		): Record<string, unknown> => {
			console.debug('set_QMSFields called', { withDerivedData, set_storeVal, QMS });
			const storeValue = get(store);
			const { rootTypes, schema } = storeValue;
			const result: Record<string, any> = {};
			const isQMSField = true;

			QMS.forEach((_QMS_) => {
				// _QMS_ -> current QMS (one of: Query,Mutation,Subscription) - normalized to lowercase usually
				// But schema lookup might need different casing.
				// Assuming standard "queryType", "mutationType", "subscriptionType" in schema
				const schemaTypeProp = `${_QMS_.toLowerCase()}Type`;
				const _QMS_Type_name = (schema as any)?.[schemaTypeProp]?.name;
				let new_QMS_Fields: any[] | undefined;

				if (_QMS_Type_name) {
					const rootType = rootTypes?.find((type) => {
						return type?.name == _QMS_Type_name;
					});
					if (rootType && rootType.fields) {
						new_QMS_Fields = sortByName([...rootType.fields]);
					}
				}

				if (withDerivedData && new_QMS_Fields) {
					new_QMS_Fields.forEach((el) => {
						Object.assign(
							el,
							generate_derivedData(el, rootTypes, isQMSField, endpointInfo, returnObject)
						);
						el?.args?.forEach((arg: any) => {
							Object.assign(
								arg,
								generate_derivedData(arg, rootTypes, false, endpointInfo, returnObject) // 'is QMS sub-field' passed as boolean false/true in signature? Check util.
							);
						});
						el?.fields?.forEach((field: any) => {
							Object.assign(
								field,
								generate_derivedData(field, rootTypes, false, endpointInfo, returnObject)
							);
							field?.args?.forEach((arg: any) => {
								Object.assign(
									arg,
									generate_derivedData(arg, rootTypes, false, endpointInfo, returnObject)
								);
							});
						});
						el?.inputFields?.forEach((inputField: any) => {
							Object.assign(
								inputField,
								generate_derivedData(inputField, rootTypes, false, endpointInfo, returnObject)
							);
						});
						el?.enumValues?.forEach((enumValue: any) => {
							Object.assign(
								enumValue,
								generate_derivedData(enumValue, rootTypes, false, endpointInfo, returnObject)
							);
						});
					});
				}

				if (set_storeVal) {
					// We need to update the specific QMS field in the store
					// mapping 'query' -> 'queryFields', etc.
					const fieldKey = `${_QMS_}Fields`;
					(storeValue as any)[fieldKey] = new_QMS_Fields || [];
				}
				result[`${_QMS_}Fields`] = new_QMS_Fields;
			});

			if (set_storeVal) {
				set(storeValue);
			}

			return result;
		},

		/**
		 * Orchestrates the setting of all fields (root types and QMS fields).
		 * @param endpointInfo The endpoint configuration store.
		 */
		set_fields: (endpointInfo: EndpointInfoStore) => {
			//set rootTypes,queryFields,mutationFields,subscriptionFields
			const rootTypes = returnObject.set_rootTypes(true, true, endpointInfo);
			// Update store value ref after set_rootTypes potentially modified it
			const storeValue = get(store);

			const QMSFields = returnObject.set_QMSFields(
				true,
				false, // Don't set individually, we set all at once below
				['query', 'mutation', 'subscription'],
				endpointInfo
			);

			set({
				...storeValue,
				rootTypes,
				...QMSFields,
				isReady: true
			} as SchemaDataValue);
		},

		/**
		 * Retrieves a root type by name.
		 * @param rootTypes Optional array of root types to search in.
		 * @param RootType_Name The name of the root type.
		 * @param schemaData The schema data store (for fallback).
		 * @returns The found RootType or undefined.
		 */
		get_rootType: (
			rootTypes: RootType[] | null,
			RootType_Name: string,
			schemaData: SchemaDataStore
		): RootType | undefined => {
			if (!rootTypes) {
				rootTypes = get(schemaData).rootTypes;
			}

			return rootTypes.find((type) => {
				return type.name == RootType_Name;
			});
		},

		/**
		 * Retrieves a specific field from a QMS operation type.
		 * @param name The name of the field.
		 * @param _QMS_ The operation type ('query', 'mutation', 'subscription').
		 * @param schemaData The schema data store.
		 * @returns The found field or undefined.
		 */
		get_QMS_Field: (
			name: string,
			_QMS_: QMSType,
			schemaData: SchemaDataStore
		): FieldWithDerivedData | undefined => {
			const storeValue = get(schemaData);
			const fieldKey = `${_QMS_}Fields` as keyof SchemaDataValue;

			// Safe access with type guard logic if needed, but casting relies on structure
			const fields = storeValue[fieldKey] as FieldWithDerivedData[] | undefined;

			const QMSField = fields?.find((field) => {
				return field.name == name;
			});

			if (!QMSField) {
				console.debug('get_QMS_Field: Field not found', { name, _QMS_ });
			}
			return QMSField;
		}
	};
	return returnObject;
};
