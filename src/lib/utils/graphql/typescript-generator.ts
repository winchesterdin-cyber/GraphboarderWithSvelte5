import { get } from 'svelte/store';
import type { SchemaDataStore, RootType, FieldWithDerivedData, GraphQLKind } from '$lib/types';
import { getRootType, get_KindsArray } from './schema-traversal';

/**
 * Maps GraphQL scalar types to TypeScript types.
 * @param scalarName The name of the GraphQL scalar.
 * @returns The corresponding TypeScript type string.
 */
const mapScalarToTS = (scalarName: string): string => {
	switch (scalarName) {
		case 'Int':
		case 'Float':
			return 'number';
		case 'String':
		case 'ID':
			return 'string';
		case 'Boolean':
			return 'boolean';
		case 'JSON':
			return 'any';
		default:
			return 'any'; // Fallback for custom scalars
	}
};

/**
 * Recursive function to generate TypeScript interface properties from AST SelectionSet.
 * @param selectionSet The AST SelectionSet node.
 * @param parentType The Schema type of the parent object.
 * @param schemaData The resolved SchemaData value.
 * @param indentLevel Current indentation level.
 * @returns A string representing the properties of the interface.
 */
const generateProperties = (
	selectionSet: any,
	parentType: RootType | FieldWithDerivedData,
	schemaData: any, // Resolved SchemaDataValue
	indentLevel: number
): string => {
	if (!selectionSet || !selectionSet.selections) return '';

	const indent = '  '.repeat(indentLevel);
	const properties: string[] = [];

	selectionSet.selections.forEach((selection: any) => {
		if (selection.kind === 'Field') {
			const fieldName = selection.name.value;
			const alias = selection.alias ? selection.alias.value : fieldName;

			console.debug(`[TS Gen] Processing field: ${fieldName} (alias: ${alias})`);

			// Find the field definition in the parent type
			let fieldDef: FieldWithDerivedData | undefined;

			// Handle RootType (has fields array) vs FieldWithDerivedData (might have args, but type is what matters)
			// Actually, we need to look up the field in the parent's type definition.

			// If parentType is a RootType, it has .fields
			// If parentType is a Field, we need to find its return type (RootType) first.

			let parentRootType: RootType | undefined;

			if ('fields' in parentType && parentType.fields) {
				// It's a RootType or similar
				parentRootType = parentType as RootType;
			} else if ('dd_rootName' in parentType) {
				// It's a field, we need to resolve its type
				parentRootType = getRootType(null, parentType.dd_rootName, { subscribe: () => {} } as any) ||
                                 schemaData.rootTypes.find((r: RootType) => r.name === parentType.dd_rootName);
			}

            // Fallback: If we can't find parentRootType, try to find it in schemaData using the name directly if available
            if (!parentRootType && (parentType as any).name) {
                 parentRootType = schemaData.rootTypes.find((r: RootType) => r.name === (parentType as any).name);
            }

			if (parentRootType && parentRootType.fields) {
				fieldDef = parentRootType.fields.find((f) => f.name === fieldName);
			}

			if (!fieldDef) {
				console.warn(`[TS Gen] Could not find definition for field: ${fieldName}`);
				properties.push(`${indent}${alias}: any; // Field definition not found`);
				return;
			}

			// Determine the TS type of this field
			let tsType = 'any';
			const kinds = get_KindsArray(fieldDef);
			const isList = kinds.includes('LIST');
			const isNonNull = kinds[0] === 'NON_NULL'; // Top level non-null
            // Check inner non-null for list elements if list
            // Simple logic:
            // If SCALAR -> mapScalar
            // If OBJECT -> recurse
            // If ENUM -> string (for now)

			const typeName = fieldDef.dd_displayName || fieldDef.type?.name || 'unknown';

            if (kinds.includes('SCALAR')) {
                const scalarName = fieldDef.dd_rootName; // e.g., 'String' or 'Int'
                tsType = mapScalarToTS(scalarName);
            } else if (kinds.includes('ENUM')) {
                tsType = 'string'; // Simplification
            } else if (kinds.includes('OBJECT') || kinds.includes('INTERFACE') || kinds.includes('UNION')) {
                // Recurse
                if (selection.selectionSet) {
                    // We need to pass the type of this field as the new parentType.
                    // fieldDef is the definition of the field, so fieldDef.dd_rootName refers to the return type name.
                    const returnTypeRoot = schemaData.rootTypes.find((r: RootType) => r.name === fieldDef!.dd_rootName);

                    if (returnTypeRoot) {
                         const nestedProps = generateProperties(selection.selectionSet, returnTypeRoot, schemaData, indentLevel + 1);
                         tsType = `{\n${nestedProps}${indent}}`;
                    } else {
                        tsType = 'any'; // Could not resolve return type
                    }
                } else {
                    tsType = 'any'; // Missing selection set for object
                }
            }

            if (isList) {
                tsType = `${tsType}[]`;
            }

            if (!isNonNull) {
                tsType = `${tsType} | null`;
            }

			properties.push(`${indent}${alias}: ${tsType};`);

		} else if (selection.kind === 'InlineFragment') {
             // TODO: Support Inline Fragments better
             properties.push(`${indent}// Inline Fragments not fully supported yet`);
        } else if (selection.kind === 'FragmentSpread') {
             properties.push(`${indent}// Fragment Spreads not supported yet`);
        }
	});

	return properties.join('\n');
};

/**
 * Generates a TypeScript interface for a given GraphQL query AST.
 * @param ast The parsed GraphQL AST.
 * @param schemaDataStore The SchemaData store.
 * @param operationName Optional name for the interface.
 * @returns The generated TypeScript code.
 */
export const generateTypeScript = (
	ast: any,
	schemaDataStore: SchemaDataStore,
	operationName: string = 'Response'
): string => {
	console.debug('[TS Gen] Starting TypeScript generation...');

	if (!ast || !schemaDataStore) {
		console.error('[TS Gen] Missing AST or SchemaData');
		return '';
	}

	const schemaData = get(schemaDataStore);
    if(!schemaData.isReady) {
        console.warn('[TS Gen] Schema data is not ready');
        return '// Schema not ready';
    }

	let result = '';

	// Find the operation definition
	const operation = ast.definitions.find((d: any) => d.kind === 'OperationDefinition');
	if (!operation) {
		console.warn('[TS Gen] No OperationDefinition found');
		return '// No operation found';
	}

    const type = operation.operation; // 'query', 'mutation', 'subscription'
    const name = operation.name ? operation.name.value : operationName;

    // Determine the root type (Query, Mutation, Subscription)
    let rootType: RootType | undefined;
    if (type === 'query') {
        // Typically 'Query' but strictly should check schema. But schemaData.rootTypes usually has it.
        // We can assume schemaData.queryFields comes from the root Query type.
        // Or find the type named 'Query' (or whatever standard)
        // Let's search for "Query" or use the first root type if not found? No, that's risky.
        // schemaData doesn't explicitly point to Root Query Type object, but it has queryFields.
        // We can construct a fake parent type for the root.

        // Better: Find the type that contains `queryFields`.
        // schemaData.rootTypes contains all types.
        // We can look for the type named 'Query' usually.
        rootType = schemaData.rootTypes.find(t => t.name === 'Query');
    } else if (type === 'mutation') {
        rootType = schemaData.rootTypes.find(t => t.name === 'Mutation');
    } else if (type === 'subscription') {
        rootType = schemaData.rootTypes.find(t => t.name === 'Subscription');
    }

    if (!rootType) {
        // Fallback: Try to guess or just use queryFields to populate a dummy Root
         console.warn(`[TS Gen] Could not find Root Type for ${type}. using fallback.`);
         if (type === 'query') {
             rootType = { name: 'Query', kind: 'OBJECT', fields: schemaData.queryFields } as any;
         } else if (type === 'mutation') {
             rootType = { name: 'Mutation', kind: 'OBJECT', fields: schemaData.mutationFields } as any;
         } else if (type === 'subscription') {
             rootType = { name: 'Subscription', kind: 'OBJECT', fields: schemaData.subscriptionFields } as any;
         }
    }

    if (!rootType) {
        return '// Could not resolve Root Type';
    }

	const props = generateProperties(operation.selectionSet, rootType, schemaData, 1);

	result = `export interface ${name} {\n${props}\n}`;

    console.debug('[TS Gen] Generation complete.');
	return result;
};
