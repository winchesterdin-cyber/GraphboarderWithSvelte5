<script lang="ts">
	import { run } from 'svelte/legacy';
	import { get, writable } from 'svelte/store';
	import { getContext, setContext } from 'svelte';
	import { Create_paginationOptions } from '$lib/stores/pagination/paginationOptions';
	import { Create_activeArgumentsDataGrouped_Store } from '$lib/stores/QMSHandling/activeArgumentsDataGrouped_Store';
	import { Create_finalGqlArgObj_Store } from '$lib/stores/QMSHandling/finalGqlArgObj_Store';
	import { Create_tableColsData_Store } from '$lib/stores/QMSHandling/tableColsData_Store';
	import { Create_QMS_bodyPart_StoreDerived } from '$lib/stores/QMSHandling/QMS_bodyPart_StoreDerived';
	import { Create_QMS_bodyPartsUnifier_StoreDerived } from '$lib/stores/QMSHandling/QMS_bodyPartsUnifier_StoreDerived';
	import { Create_paginationState } from '$lib/stores/QMSHandling/paginationState';
	import { Create_paginationState_derived } from '$lib/stores/QMSHandling/paginationState_derived';
	import { get_paginationTypes } from '$lib/stores/pagination/paginationTypes';
	import {
		get_scalarColsData,
		get_nodeFieldsQMS_info,
		getDeepField
	} from '$lib/utils/usefulFunctions';
	import {
		findReturningColumnsLocation,
		buildPrefixStepsOfFields,
		getIdColumnName,
		getPaginationTypeInfo,
		mergeColumnData
	} from '$lib/utils/qmsContextUtils';
	import type {
		QMSType as QMSTypeType,
		FieldWithDerivedData,
		ActiveArgumentGroup,
		TableColumnData,
		SchemaData,
		EndpointInfoStore,
		PaginationTypeInfo,
		QMSWraperContext as QMSWraperContextType,
		QMSMainWraperContext as QMSMainWraperContextType,
		ActiveArgumentsDataGroupedStore
	} from '$lib/types/index';
	import { Create_mergedChildren_finalGqlArgObj_Store } from '$lib/stores/QMSHandling/mergedChildren_finalGqlArgObj_Store';
	//import { Create_mergedChildren_activeArgumentsDataGrouped_Store } from '$lib/stores/QMSHandling/mergedChildren_activeArgumentsDataGrouped_Store';
	import { Create_mergedChildren_QMSWraperCtxData_Store } from '$lib/stores/QMSHandling/mergedChildren_QMSWraperCtxData_Store';
	import { Create_mergedChildren_controlPanel_Store } from '$lib/stores/QMSHandling/mergedChildren_controlPanel_Store';
	import QMSWraperCtxDataCurrentComputations from './QMSWraperCtxDataCurrentComputations.svelte';
	import { Create_QMSFieldToQMSGetMany_Store } from '$lib/stores/QMSFieldToQMSGetMany_Store';

	/**
	 * Props for QMSWraper.
	 */
	interface Props {
		/** Prefix for context keys. */
		prefix?: string;
		/** Extra info dictionary. */
		extraInfo?: Record<string, unknown>;
		/** Initial arguments for the query. */
		initialGqlArgObj?: Record<string, unknown>;
		/** Whether this is the outermost wrapper. */
		isOutermostQMSWraper?: boolean;
		/** The type of QMS operation (query/mutation). */
		QMSType?: QMSTypeType;
		/** The name of the query/mutation. */
		QMSName?: string;
		/** Metadata about the QMS field. */
		QMS_info?: FieldWithDerivedData | undefined;
		/** The context object (output). */
		QMSWraperContext?: QMSWraperContextType | Record<string, unknown>;
		/** Initial value for arguments store. */
		activeArgumentsDataGrouped_StoreInitialValue?: ActiveArgumentGroup[] | undefined;
		/** The arguments store itself. */
		activeArgumentsDataGrouped_Store?: ActiveArgumentsDataGroupedStore;
		/** Initial value for table columns. */
		tableColsData_StoreInitialValue?: TableColumnData[];
		/** The final GraphQL arguments store. */
		finalGqlArgObj_Store?: any;
		/** An existing context to use (overrides internal creation). */
		QMSWraperContextGiven?: QMSWraperContextType | any;
		/** Whether to prefer the given context over creating a new one. */
		preferGivenQMSWraperContext?: boolean;
		/** Child components. */
		children?: import('svelte').Snippet;
	}

	/**
	 * Core component that wraps a Query/Mutation/Subscription (QMS) context.
	 * Manages state for arguments, columns, pagination, and query generation.
	 * It sets up the `QMSWraperContext` used by child components.
	 */
	let {
		prefix = '',
		extraInfo = {},
		initialGqlArgObj = {},
		isOutermostQMSWraper = undefined,
		QMSType = 'query',
		QMSName = `${Math.random()}`,
		QMS_info = $bindable(),
		QMSWraperContext = $bindable(),
		activeArgumentsDataGrouped_StoreInitialValue,
		activeArgumentsDataGrouped_Store = undefined,
		tableColsData_StoreInitialValue = $bindable(),
		finalGqlArgObj_Store = undefined,
		QMSWraperContextGiven,
		preferGivenQMSWraperContext = true,
		children
	}: Props = $props();

	// Set default values for bindable props if not provided
	if (QMS_info === undefined) {
		QMS_info = undefined;
	}
	if (QMSWraperContext === undefined) {
		QMSWraperContext = {};
	}
	if (tableColsData_StoreInitialValue === undefined) {
		tableColsData_StoreInitialValue = [];
	}

	// Now we can use the props
	let QMSMainWraperContext = getContext(
		`${prefix}QMSMainWraperContext`
	) as QMSMainWraperContextType;
	const endpointInfo: EndpointInfoStore = QMSMainWraperContext?.endpointInfo;
	const schemaData: SchemaData = QMSMainWraperContext?.schemaData;

	console.debug('QMSWraper initialized', {
		QMSName,
		QMSType,
		isOutermostQMSWraper,
		prefix
	});

	// Set default value for isOutermostQMSWraper after we have prefix
	if (isOutermostQMSWraper === undefined) {
		isOutermostQMSWraper = getContext(`${prefix}QMSWraperContext`) ? false : true;
	}

	// Initialize QMS_info if not provided
	if (!QMS_info) {
		QMS_info = schemaData.get_QMS_Field(QMSName, QMSType, schemaData);
	}

	// If QMS_info is still not defined, we can't proceed with dependent logic
	// But we must initialize variables to avoid TS errors in the template
	// Realistically, QMS_info should be present if QMSName is valid.
	if (!QMS_info) {
		console.warn(`QMSWraper: QMS_info could not be resolved for ${QMSName}`);
	}

	const dd_paginationType: string | undefined = QMS_info?.dd_paginationType;
	const paginationTypes = get_paginationTypes(endpointInfo, schemaData);
	let paginationTypeInfo = getPaginationTypeInfo(dd_paginationType, paginationTypes);
	const paginationOptions = Create_paginationOptions();

	const paginationState = Create_paginationState(
		null,
		QMS_info?.dd_paginationArgs || [],
		QMS_info?.dd_paginationType || '',
		endpointInfo,
		schemaData
	);
	const paginationState_derived = Create_paginationState_derived(
		paginationState,
		QMS_info?.dd_paginationArgs || [],
		QMS_info?.dd_paginationType || '',
		endpointInfo,
		schemaData
	);

	const rowsLocation = QMS_info ? endpointInfo.get_rowsLocation(QMS_info, schemaData) : [];
	const nodeFieldsQMS_info = QMS_info
		? get_nodeFieldsQMS_info(QMS_info, rowsLocation, schemaData)
		: undefined;
	// let scalarColsData = get_scalarColsData(
	// 	nodeFieldsQMS_info,
	// 	[QMS_info.dd_displayName, ...rowsLocation],
	// 	schemaData
	// );

	const possibleLocations =
		QMSType == 'query'
			? $endpointInfo.returningColumnsPossibleLocationsInQueriesPerRow
			: $endpointInfo.returningColumnsPossibleLocationsInMutations;

	const returningColumnsResult = findReturningColumnsLocation(
		nodeFieldsQMS_info,
		possibleLocations || [],
		schemaData,
		'fields'
	);

	let returningColumnsLocationQMS_Info = returningColumnsResult?.info;
	let returningColumnsLocation = returningColumnsResult?.location || [];

	let nodeFieldsQMS_info_Root = schemaData.get_rootType(
		null,
		nodeFieldsQMS_info?.dd_rootName || '',
		schemaData
	);

	let prefixStepsOfFields = buildPrefixStepsOfFields(
		QMSType,
		QMS_info?.dd_displayName || '',
		rowsLocation,
		returningColumnsLocation
	);

	let scalarColsData = get_scalarColsData(
		returningColumnsLocationQMS_Info,
		prefixStepsOfFields,
		schemaData
	);

	const dependencyColsData =
		paginationTypeInfo?.get_dependencyColsData(QMSName, 'query', schemaData) || [];

	tableColsData_StoreInitialValue = mergeColumnData(
		scalarColsData,
		tableColsData_StoreInitialValue,
		dependencyColsData
	);
	const tableColsData_Store = Create_tableColsData_Store(
		paginationState,
		tableColsData_StoreInitialValue
	);

	const mergedChildren_finalGqlArgObj_Store = Create_mergedChildren_finalGqlArgObj_Store({});
	// const mergedChildren_activeArgumentsDataGrouped_Store =
	// 	Create_mergedChildren_activeArgumentsDataGrouped_Store({});
	const mergedChildren_QMSWraperCtxData_Store = Create_mergedChildren_QMSWraperCtxData_Store([]);
	const mergedChildren_controlPanel_Store = Create_mergedChildren_controlPanel_Store([]);
	const QMSFieldToQMSGetMany_Store = Create_QMSFieldToQMSGetMany_Store([]);

	// Initialize stores that weren't provided via props
	if (!activeArgumentsDataGrouped_Store) {
		activeArgumentsDataGrouped_Store = Create_activeArgumentsDataGrouped_Store(
			activeArgumentsDataGrouped_StoreInitialValue
		);
	}

	if (!finalGqlArgObj_Store) {
		finalGqlArgObj_Store = Create_finalGqlArgObj_Store(
			activeArgumentsDataGrouped_Store,
			paginationState
		);
	}

	// Removed unused run blocks

	const QMS_bodyPart_StoreDerived = Create_QMS_bodyPart_StoreDerived(
		finalGqlArgObj_Store,
		tableColsData_Store,
		QMSType,
		QMSName,
		paginationOptions,
		paginationState_derived,
		mergedChildren_finalGqlArgObj_Store,
		initialGqlArgObj
	);

	const QMS_bodyPartsUnifier_StoreDerived = Create_QMS_bodyPartsUnifier_StoreDerived(
		[QMS_bodyPart_StoreDerived],
		QMSType
	);
	let QMS_bodyPart_StoreDerived_rowsCount = null;
	const rowCountLocation = QMS_info
		? endpointInfo.get_rowCountLocation(QMS_info, schemaData)
		: undefined;
	if (rowCountLocation) {
		const tableColsData_Store_rowsCount = writable([
			{ stepsOfFields: rowCountLocation, title: 'count' }
		]);

		QMS_bodyPart_StoreDerived_rowsCount = Create_QMS_bodyPart_StoreDerived(
			finalGqlArgObj_Store,
			tableColsData_Store_rowsCount,
			QMSType,
			rowCountLocation[0],
			paginationOptions,
			paginationState_derived,
			mergedChildren_finalGqlArgObj_Store,
			{}
		);
	}

	//
	//
	//set to QMSWraperContext
	const tableName = QMS_info ? endpointInfo.get_tableName(QMS_info, schemaData) : '';
	const thisContext = endpointInfo.get_thisContext();
	const objective = 'getOne';
	const qmsNameForObjective = QMS_info
		? endpointInfo.get_qmsNameForObjective(QMS_info, schemaData, objective)
		: '';

	let idColName = getIdColumnName(
		returningColumnsLocationQMS_Info,
		QMS_info,
		endpointInfo,
		schemaData
	);

	// Build the context object
	QMSWraperContext = {
		idColName,
		returningColumnsLocationQMS_Info,
		rowsLocation,
		returningColumnsLocation,
		QMS_info,
		QMSType,
		QMSName,
		activeArgumentsDataGrouped_Store,
		tableColsData_Store,
		finalGqlArgObj_Store,
		QMS_bodyPart_StoreDerived,
		QMS_bodyPart_StoreDerived_rowsCount,
		QMS_bodyPartsUnifier_StoreDerived,
		paginationOptions,
		paginationState,
		paginationState_derived,
		mergedChildren_finalGqlArgObj_Store,
		//mergedChildren_activeArgumentsDataGrouped_Store,
		mergedChildren_QMSWraperCtxData_Store,
		mergedChildren_controlPanel_Store,
		QMSFieldToQMSGetMany_Store,
		extraInfo,
		initialGqlArgObj
	};
	if (preferGivenQMSWraperContext && QMSWraperContextGiven) {
		QMSWraperContext = QMSWraperContextGiven;
	}
	setContext(`${prefix}QMSWraperContext`, QMSWraperContext);
	if (isOutermostQMSWraper) {
		setContext(`${prefix}OutermostQMSWraperContext`, QMSWraperContext);
	}
</script>

{#if isOutermostQMSWraper}
	{#each $mergedChildren_QMSWraperCtxData_Store as any[] as QMSWraperCtxDataCurrent (QMSWraperCtxDataCurrent?.stepsOfFields?.join() || Math.random())}
		<QMSWraperCtxDataCurrentComputations {QMSWraperCtxDataCurrent} />
	{/each}
{/if}

{#if QMS_info || (preferGivenQMSWraperContext && QMSWraperContextGiven)}
	<!-- content here -->
	{@render children?.()}
{/if}
