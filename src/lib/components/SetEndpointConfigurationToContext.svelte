<script lang="ts">
	/**
	 * Component: SetEndpointConfigurationToContext
	 *
	 * This component is responsible for initializing the context for a specific GraphQL query or endpoint interaction.
	 * It handles:
	 * - Retrieving endpoint configuration and schema data from the parent context.
	 * - managing the query execution lifecycle (fetching, error, data).
	 * - Handling pagination logic (next page, infinite scroll).
	 * - Extracting and applying endpoint configuration from the query results (if applicable).
	 * - Rendering the main layout with the sidebar and content area.
	 */

	import { onDestroy, onMount, getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		getDataGivenStepsOfFields,
		getFields_Grouped,
		getRootType,
		stringToJs
	} from '$lib/utils/usefulFunctions';
	import { get_paginationTypes } from '$lib/stores/pagination/paginationTypes';
	import hljs from 'highlight.js/lib/core';
	import graphql from 'highlight.js/lib/languages/graphql';
	import 'highlight.js/styles/base16/solarized-dark.css';
	import MainWraper from './MainWraper.svelte';
	import Sidebar from './Sidebar.svelte';
	import { recentQueries } from '$lib/stores/recentQueriesStore';
	import { page } from '$app/stores';

	import type {
		QMSWraperContext,
		QMSMainWraperContext,
		EndpointConfiguration,
		FieldWithDerivedData,
		PaginationTypeInfo
	} from '$lib/types';

	interface Props {
		prefix?: string;
		QMSName: string;
		children?: import('svelte').Snippet;
	}

	let { prefix = '', QMSName, children }: Props = $props();

	// Retrieve contexts with strict typing
	const QMSMainContext = getContext<QMSMainWraperContext>(`${prefix}QMSMainWraperContext`);
	const endpointInfo = QMSMainContext?.endpointInfo;
	const urqlCoreClient = QMSMainContext?.urqlCoreClient;
	const schemaData = QMSMainContext?.schemaData;

	const QMSContext = getContext<QMSWraperContext>('QMSWraperContext');
	const {
		// QMS_bodyPart_StoreDerived_rowsCount = null, // Unused
		// activeArgumentsDataGrouped_Store, // Unused directly here
		tableColsData_Store,
		// finalGqlArgObj_Store, // Unused directly here
		// QMS_bodyPart_StoreDerived, // Unused directly here
		QMS_bodyPartsUnifier_StoreDerived,
		paginationOptions,
		paginationState
	} = QMSContext;

	let queryName = QMSName;

	onDestroy(() => {
		document.getElementById('my-drawer-3')?.click();
	});

	// Initialize schema info
	let currentQMS_info = schemaData?.get_QMS_Field(queryName, 'query', schemaData);
	let dd_relatedRoot = getRootType(null, currentQMS_info?.dd_rootName, schemaData);

	if (!currentQMS_info) {
		console.warn(
			`[SetEndpointConfigurationToContext] Query '${queryName}' not found. Redirecting.`
		);
		goto('/queries');
	}

	// Pagination Setup
	const paginationTypeInfo = get_paginationTypes(endpointInfo, schemaData).find((pagType) => {
		return pagType.name == currentQMS_info?.dd_paginationType;
	});

	// Get grouped fields for initial scalar fields check
	let { scalarFields } = getFields_Grouped(dd_relatedRoot!, [], schemaData!);

	// State for query data
	interface QueryDataState {
		fetching: boolean;
		error: any;
		data: any;
	}

	let queryData = $state<QueryDataState>({
		fetching: scalarFields.length > 0,
		error: false,
		data: false
	});

	let rows = $state<any[]>([]);
	let rowsCurrent = $state<any[]>([]);

	// Infinite scroll handlers
	let loadedF: (() => void) | undefined;
	let completeF: (() => void) | undefined;
	let infiniteId = $state(Math.random());

	/**
	 * Handles infinite scroll events.
	 * Decides whether to load the next page or complete the loading sequence.
	 */
	function infiniteHandler({ detail: { loaded, complete } }: any) {
		loadedF = loaded;
		completeF = complete;

		const rowLimitingArgNames = paginationTypeInfo?.get_rowLimitingArgNames?.(
			currentQMS_info!.dd_paginationArgs!
		);

		// Logic to check if we should load more pages
		// If rows length is a multiple of page size, we assume there might be more pages
		const isFullPage = rowLimitingArgNames?.some((argName) => {
			const limit = ($paginationState as any)?.[argName as string];
			return limit && rows.length / limit >= 1;
		});

		if (isFullPage || paginationTypeInfo?.name == 'pageBased') {
			console.debug(
				`[SetEndpointConfigurationToContext] Infinite Scroll: Requesting next page for ${queryName}`
			);
			paginationState.nextPage(queryData?.data, queryName, 'query');
		} else {
			console.debug('[SetEndpointConfigurationToContext] Infinite Scroll: Complete');
			loaded();
			complete();
		}
	}

	/**
	 * Executes the GraphQL query using the URQL client.
	 * @param queryBody The GraphQL query string.
	 */
	const runQuery = (queryBody: string) => {
		console.debug(`[SetEndpointConfigurationToContext] Running query: ${queryName}`);
		let fetching = true;
		let error: any = false;
		let data: any = false;

		// Optimistic update for loading state
		queryData = { fetching: true, error: false, data: queryData.data };

		($urqlCoreClient as any)
			.query(queryBody)
			.toPromise()
			.then((result: any) => {
				fetching = false;

				if (result.error) {
					console.error('[SetEndpointConfigurationToContext] Query Error:', result.error);
					error = result.error.message;
				}
				if (result.data) {
					data = result.data;
				}
				queryData = { fetching, error, data };

				if (!data) return;

				let stepsOfFieldsInput = [
					currentQMS_info!.dd_displayName,
					...endpointInfo.get_rowsLocation(currentQMS_info!, schemaData!)
				];

				let newRowsCurrent = getDataGivenStepsOfFields(
					undefined,
					queryData.data,
					stepsOfFieldsInput
				);

				if (newRowsCurrent && !Array.isArray(newRowsCurrent)) {
					newRowsCurrent = [newRowsCurrent];
				}

				rowsCurrent = (newRowsCurrent as any[]) || [];

				if ($paginationOptions.infiniteScroll) {
					if (
						paginationTypeInfo?.isFirstPage?.(
							paginationState,
							currentQMS_info!.dd_paginationArgs!
						) &&
						rowsCurrent?.length > 0
					) {
						infiniteId += 1;
						rows = [...rowsCurrent];
					} else {
						if (rowsCurrent?.[0] != undefined) {
							rows = [...rows, ...rowsCurrent];
						}
						if (
							paginationTypeInfo?.isFirstPage?.(
								paginationState,
								currentQMS_info!.dd_paginationArgs!
							) &&
							rowsCurrent?.length == 0
						) {
							// If first page is empty, rows should be empty
							rows = rowsCurrent;
						}
					}
				} else {
					rows = rowsCurrent;
				}

				// Handle Infinite Loading State
				const rowLimitingArgNames = paginationTypeInfo?.get_rowLimitingArgNames?.(
					currentQMS_info!.dd_paginationArgs!
				);
				const isPageFull =
					rowLimitingArgNames &&
					rowLimitingArgNames.length > 0 &&
					rowLimitingArgNames.some((argName) => {
						return rowsCurrent?.length == ($paginationState as any)?.[argName as string];
					});

				if (isPageFull || paginationTypeInfo?.name == 'pageBased') {
					loadedF && loadedF();
				} else {
					completeF && completeF();
				}

				// Reset current batch
				rowsCurrent = [];
			});
	};

	// Subscribe to body parts to trigger query
	QMS_bodyPartsUnifier_StoreDerived.subscribe((QMS_body: string) => {
		if (QMS_body && QMS_body !== '') {
			runQuery(QMS_body);
		}
	});

	const hideColumn = (e: CustomEvent) => {
		tableColsData_Store.removeColumn(e.detail.column);
	};
	// Just subscribe to keep store active if needed, though empty callback is weird.
	// Leaving it as per original logic but documented.
	tableColsData_Store.subscribe((data) => {});

	onMount(() => {
		hljs.registerLanguage('graphql', graphql);
		hljs.highlightAll();
	});

	let endpointConfiguration = $state<any>();

	// Add to recent queries when query is successfully loaded/initialized
	$effect(() => {
		if (currentQMS_info && endpointInfo) {
			const endpointId = $page.params.endpointid;
			if (endpointId) {
				recentQueries.add({
					name: queryName,
					type: 'query', // Assuming this component handles queries primarily
					endpointId: endpointId
				});
			}
		}
	});

	// Extract endpoint configuration if present in data
	$effect(() => {
		if (queryData?.data) {
			const configurationText = getDataGivenStepsOfFields(undefined, queryData, [
				'data',
				'endpoints_by_pk',
				'extraConfig'
			]);
			const configTemplate = getDataGivenStepsOfFields(undefined, queryData, [
				'data',
				'endpoints_by_pk',
				'configuration',
				'configuration'
			]);

			try {
				let config = stringToJs(configurationText as string) as Record<string, any>;

				if (configTemplate) {
					const template = stringToJs(configTemplate as string) as Record<string, any>;
					config = { ...template, ...config };
				}
				endpointConfiguration = config;
				console.debug('[SetEndpointConfigurationToContext] Configuration extracted:', config);
			} catch (e) {
				console.warn('[SetEndpointConfigurationToContext] Failed to parse configuration:', e);
			}
		}
	});

	let forceVisibleSidebar = $state(false);
</script>

{#if endpointConfiguration}
	<MainWraper endpointInfoProvided={endpointConfiguration}>
		<main class="flex w-[100vw] overflow-hidden bg-base-300">
			<div class="md:max-w-[300px]">
				<Sidebar bind:forceVisibleSidebar />
			</div>
			<div class="flex h-screen w-full grow flex-col md:w-[65vw]">
				<div class="flex min-h-[50px] bg-base-100">
					<button
						class="btn btn-square btn-ghost md:hidden"
						onclick={() => {
							forceVisibleSidebar = true;
						}}
						aria-label="Open Sidebar"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="inline-block h-6 w-6 stroke-current"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</button>
					<div></div>
				</div>
				{@render children?.()}
			</div>
		</main>
	</MainWraper>
{:else if queryData.fetching}
	<div class="flex h-screen w-full items-center justify-center bg-base-100">
		<span class="loading loading-lg loading-spinner text-primary"></span>
		<span class="ml-4 text-lg font-semibold opacity-70">Loading configuration...</span>
	</div>
{:else if queryData.error}
	<div class="flex h-screen w-full flex-col items-center justify-center bg-base-100 text-error">
		<i class="bi bi-exclamation-triangle text-4xl"></i>
		<h3 class="mt-2 text-lg font-bold">Error loading configuration</h3>
		<p class="mt-1 opacity-80">{queryData.error}</p>
		<button class="btn mt-4 btn-primary" onclick={() => location.reload()}>Retry</button>
	</div>
{/if}
