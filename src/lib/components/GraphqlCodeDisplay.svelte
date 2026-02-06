<script lang="ts">
	import CodeEditor from './fields/CodeEditor.svelte';
	import { format } from 'graphql-formatter';
	import hljs from 'highlight.js/lib/core';
	import { onMount, getContext } from 'svelte';
	import graphql from 'highlight.js/lib/languages/graphql';
	import 'highlight.js/styles/base16/solarized-dark.css';
	import { getPreciseType } from '$lib/utils/usefulFunctions';
	import { updateStoresFromAST } from '$lib/utils/astToUIState';
	import { generateTypeScript } from '$lib/utils/graphql/typescript-generator';
	import { calculateComplexity } from '$lib/utils/graphql/complexity';
	import {
		generateCurlCommand,
		generateFetchCommand,
		generateApolloCommand,
		generatePythonCommand,
		generateGoCommand,
		generateRustCommand
	} from '$lib/utils/graphql/codegen';
	import { parse, print } from 'graphql';
	import JSON5 from 'json5';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import Modal from '$lib/components/Modal.svelte';
	import { favoriteQueries } from '$lib/stores/favoriteQueriesStore';
	import { addToast } from '$lib/stores/toastStore';
	import { encodeState } from '$lib/utils/stateEncoder';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { downloadText } from '$lib/utils/downloadUtils';
	import { logger } from '$lib/utils/logger';
	import { pinnedResponseStore } from '$lib/stores/pinnedResponseStore';
	import JsonDiffViewer from './JsonDiffViewer.svelte';

	/**
	 * Props for GraphqlCodeDisplay component.
	 */
	interface Props {
		/** Whether to show the raw (non-prettified) query body initially. */
		showNonPrettifiedQMSBody?: boolean;
		/** The code value to display (GraphQL query or JSON). */
		value: string;
		/** Whether to enable synchronization from the code editor back to the UI stores. */
		enableSyncToUI?: boolean;
		/** Prefix for context keys. */
		prefix?: string;
		/** The language to display/highlight. Default: 'graphql'. */
		language?: string;
		/** Whether the editor should be read-only. Default: false. */
		readonly?: boolean;
		/** Name of the query, used for pinning responses. */
		queryName?: string;
	}

	let {
		showNonPrettifiedQMSBody = $bindable(false),
		value,
		enableSyncToUI = true,
		prefix = '',
		language = 'graphql',
		readonly = false,
		queryName
	}: Props = $props();

	let valueModifiedManually = $state<string>();
	let lastSyncedValue = $state(value);

	// Favorites State
	let showFavoriteModal = $state(false);
	let favoriteName = $state('');
	let favoriteFolder = $state('');

	let existingFolders = $derived(
		Array.from(new Set($favoriteQueries.map((q) => q.folder).filter(Boolean))).sort()
	);

	// Export Code State
	let showExportModal = $state(false);
	let exportLanguage = $state('curl');
	let exportCopyFeedback = $state(false);

	const exportOptions = [
		{ id: 'curl', label: 'cURL' },
		{ id: 'fetch', label: 'Fetch' },
		{ id: 'ts', label: 'TypeScript' },
		{ id: 'apollo', label: 'Apollo' },
		{ id: 'python', label: 'Python' },
		{ id: 'go', label: 'Go' },
		{ id: 'rust', label: 'Rust' }
	];

	/**
	 * Saves the current query as a favorite.
	 * Checks for a valid name and endpoint ID before saving to the store.
	 */
	const handleSaveFavorite = () => {
		if (!favoriteName.trim()) return;

		const endpointId = $page.params.endpointid;
		if (!endpointId) {
			addToast('Could not determine endpoint ID', 'error');
			return;
		}

		favoriteQueries.add({
			name: favoriteName,
			query: value,
			type: value.trim().startsWith('mutation') ? 'mutation' : 'query',
			endpointId: endpointId,
			folder: favoriteFolder.trim() || undefined
		});

		addToast(`Saved favorite: ${favoriteName}`, 'success');
		showFavoriteModal = false;
		favoriteName = '';
		favoriteFolder = '';
	};

	// Try to get context if available
	let QMSWraperContext: any = $state();
	let QMSMainWraperContext: any = $state();

	try {
		QMSWraperContext = getContext(`${prefix}QMSWraperContext`);
		QMSMainWraperContext = getContext(`${prefix}QMSMainWraperContext`);
	} catch {
		// Context might not be available in all usages
	}

	onMount(() => {
		hljs.registerLanguage('graphql', graphql);
		hljs.highlightAll();
	});

	let astAsString = $state('');
	let ast: any = $state();
	let astPrinted = $state('');
	let complexity = $state(0);
	let copyFeedback = $state(false);
	let shareFeedback = $state(false);
	let downloadFeedback = $state(false);

	let showDiff = $state(false);
	let pinnedResponse = $state<any>(null);

	$effect(() => {
		const unsubscribe = pinnedResponseStore.subscribe((val) => {
			pinnedResponse = val;
		});
		return unsubscribe;
	});

	/**
	 * Copies the raw content string to the clipboard.
	 */
	const copyToClipboard = () => {
		console.debug('Copying content to clipboard');
		navigator.clipboard.writeText(value);
		copyFeedback = true;
		setTimeout(() => {
			copyFeedback = false;
		}, 2000);
	};

	/**
	 * Downloads the current content as a JSON file.
	 */
	const handleDownloadJSON = () => {
		if (!value) return;
		console.debug('Downloading JSON response');
		// Generate filename with timestamp
		const filename = `response-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
		downloadText(value, filename);
		downloadFeedback = true;
		setTimeout(() => {
			downloadFeedback = false;
		}, 2000);
	};

	/**
	 * Generates a shareable URL containing the encoded state and copies it to the clipboard.
	 * Updates the browser's URL without reloading.
	 */
	const handleShare = () => {
		if (!QMSWraperContext) {
			console.warn('Cannot share: QMSWraperContext not available');
			addToast('Cannot share: Context unavailable', 'error');
			return;
		}

		try {
			const { finalGqlArgObj_Store, tableColsData_Store } = QMSWraperContext;
			const args = get(finalGqlArgObj_Store);
			const cols = get(tableColsData_Store);

			const state = { args, cols };
			const encodedState = encodeState(state);

			if (!encodedState) {
				addToast('Failed to encode state', 'error');
				return;
			}

			const url = new URL(window.location.href);
			url.searchParams.set('state', encodedState);

			// Update URL without reloading
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			void goto(url.toString(), { replaceState: true, noScroll: true, keepFocus: true });

			navigator.clipboard.writeText(url.toString());

			shareFeedback = true;
			addToast('Share link copied to clipboard!', 'success');
			setTimeout(() => {
				shareFeedback = false;
			}, 2000);
		} catch (e) {
			console.error('Error sharing link:', e);
			addToast('Error generating share link', 'error');
		}
	};

	/**
	 * Helper function to retrieve the current value of a Svelte store.
	 * @param store The store to get the value from.
	 * @returns The current value of the store.
	 */
	function getStoreValue(store: any) {
		let storeVal;
		store.subscribe(($: any) => (storeVal = $))();
		return storeVal;
	}

	function getEndpointDetails() {
		let url = 'http://localhost:4000/graphql'; // Default fallback
		let headers: Record<string, string> = {};

		if (QMSMainWraperContext) {
			const { endpointInfo } = QMSMainWraperContext;
			// Access store value
			const endpoint = (endpointInfo as any)?.subscribe
				? (getStoreValue(endpointInfo) as any)
				: endpointInfo;
			if (endpoint?.url) {
				url = endpoint.url;
			}
			if (endpoint?.headers) {
				headers = { ...endpoint.headers };
			}
		}

		// Also try localStorage headers if not found in endpoint
		if (Object.keys(headers).length === 0 && browser) {
			const headersStr = localStorage.getItem('headers');
			if (headersStr) {
				try {
					const storedHeaders = JSON.parse(headersStr);
					headers = { ...storedHeaders };
				} catch {
					// ignore
				}
			}
		}
		return { url, headers };
	}

	let exportCode = $derived.by(() => {
		// Dependency on exportLanguage, value, and showExportModal
		// We explicitly access them to ensure reactivity
		const lang = exportLanguage;
		const query = value;
		// Ensure we re-generate when modal opens to capture latest endpoint details
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _ = showExportModal;

		const { url, headers } = getEndpointDetails();

		switch (lang) {
			case 'curl':
				return generateCurlCommand(url, headers, query);
			case 'fetch':
				return generateFetchCommand(url, headers, query);
			case 'ts':
				if (ast && QMSMainWraperContext?.schemaData) {
					try {
						return generateTypeScript(ast, QMSMainWraperContext.schemaData) || '';
					} catch (e: any) {
						return `// Error generating TypeScript: ${e.message}`;
					}
				} else {
					return '// Schema or AST missing for TypeScript generation';
				}
			case 'apollo':
				return generateApolloCommand(query);
			case 'python':
				return generatePythonCommand(url, headers, query);
			case 'go':
				return generateGoCommand(url, headers, query);
			case 'rust':
				return generateRustCommand(url, headers, query);
			default:
				return '';
		}
	});

	const copyExportCode = () => {
		navigator.clipboard.writeText(exportCode);
		exportCopyFeedback = true;
		logger.info('User copied generated code', { language: exportLanguage });
		setTimeout(() => {
			exportCopyFeedback = false;
		}, 2000);
	};

	/**
	 * Synchronizes the parsed AST back to the UI state stores.
	 * This allows the Visual Query Builder to update when the code is manually edited.
	 * @param newAst The parsed GraphQL AST.
	 */
	const syncQueryToUI = (newAst: any) => {
		try {
			if (!QMSWraperContext || !QMSMainWraperContext) {
				console.warn('GraphqlCodeDisplay: Cannot sync to UI - context not available');
				return;
			}

			const { activeArgumentsDataGrouped_Store, tableColsData_Store, paginationState, QMSName } =
				QMSWraperContext;

			const { endpointInfo, schemaData } = QMSMainWraperContext;

			// Get the current QMS info
			const qmsInfo = schemaData.get_QMS_Field(QMSName, 'query', schemaData);

			if (!qmsInfo) {
				console.warn('GraphqlCodeDisplay: QMS info not found');
				return;
			}

			// Update stores from AST
			updateStoresFromAST(
				newAst,
				qmsInfo,
				schemaData,
				endpointInfo,
				activeArgumentsDataGrouped_Store,
				tableColsData_Store,
				paginationState
			);
		} catch (e) {
			console.error('GraphqlCodeDisplay: Error syncing query to UI:', e);
		}
	};

	$effect(() => {
		try {
			// Only parse as GraphQL if language is graphql
			if (value && language === 'graphql') {
				ast = parse(value);
				complexity = calculateComplexity(ast);
			}
		} catch {
			// Failed to parse, ignore
		}
	});

	$effect(() => {
		if (valueModifiedManually && valueModifiedManually !== lastSyncedValue) {
			try {
				if (language === 'graphql') {
					ast = parse(valueModifiedManually);

					// Sync to UI if enabled and context is available
					if (enableSyncToUI && QMSWraperContext && QMSMainWraperContext) {
						syncQueryToUI(ast);
						lastSyncedValue = valueModifiedManually;
					}
				}
			} catch (e) {
				console.error('Error parsing manually modified query:', e);
			}
		}
	});

	$effect(() => {
		if (ast) {
			try {
				astPrinted = print(ast);
			} catch {
				// Failed to print, ignore
			}
		}
	});

	$effect(() => {
		if (ast && getPreciseType(ast) == 'object') {
			astAsString = JSON5.stringify(ast);
		}
	});
</script>

<div class="bg-base text-content mockup-code mx-2 my-1 px-2">
	<div class="max-h-[50vh] overflow-y-auto">
		{#if language === 'json'}
			<div class="mx-4 mt-2">
				{#if showDiff && pinnedResponse}
					<JsonDiffViewer left={pinnedResponse.response} right={value} />
				{:else}
					<CodeEditor
						rawValue={value}
						language="json"
						{readonly}
						onChanged={(detail) => {
							if (!readonly) valueModifiedManually = detail.chd_rawValue;
						}}
					/>
				{/if}
			</div>
		{:else if showNonPrettifiedQMSBody}
			<code class="px-10">{value}</code>
			<div class="mt-4">
				<code class="px-10">{astAsString}</code>
			</div>
		{:else}
			<!-- eslint-disable svelte/no-at-html-tags -->
			<code class="language-graphql"
				>{@html hljs.highlight(format(value), { language: 'graphql' }).value.trim()}</code
			>
			<!-- eslint-enable svelte/no-at-html-tags -->
			<div class="mx-4 mt-2">
				<CodeEditor
					rawValue={value}
					language="graphql"
					{readonly}
					onChanged={(detail) => {
						if (!readonly) valueModifiedManually = detail.chd_rawValue;
					}}
				/>
			</div>
			<div class="mx-4 mt-2">
				<CodeEditor rawValue={astAsString} language="javascript" />
			</div>
			{#if astPrinted}
				<div class="mx-4 mt-2">
					<CodeEditor rawValue={astPrinted} language="graphql" />
				</div>
			{/if}
		{/if}
	</div>
	<div class="absolute top-3 right-4 flex gap-2">
		{#if language === 'graphql'}
			<div class="badge h-6 badge-outline text-xs">
				Complexity: {complexity}
			</div>
			<button
				class="btn normal-case btn-xs btn-warning"
				onclick={() => (showFavoriteModal = true)}
				aria-label="Save to Favorites"
				title="Save this query to favorites"
			>
				<i class="bi bi-star-fill"></i> Save
			</button>
			<button
				class="btn normal-case btn-xs btn-info"
				onclick={handleShare}
				aria-label="Share Link"
				title="Generate and copy a shareable link"
			>
				{#if shareFeedback}
					<i class="bi bi-check"></i> Copied!
				{:else}
					<i class="bi bi-share-fill"></i> Share
				{/if}
			</button>
			<button
				class="btn normal-case btn-xs btn-primary"
				onclick={() => (showExportModal = true)}
				aria-label="Export Code"
				title="Export query as code"
			>
				<i class="bi bi-code-slash"></i> Export Code
			</button>
		{/if}
		{#if language === 'json'}
			{#if pinnedResponse}
				<button
					class="btn normal-case btn-xs {showDiff ? 'btn-active' : 'btn-ghost'}"
					onclick={() => {
						showDiff = !showDiff;
						logger.info('User toggled diff view', { showDiff });
					}}
					aria-label={showDiff ? 'Show Code' : 'Compare with Pinned'}
					title={showDiff ? 'Back to code view' : 'Compare with pinned response'}
				>
					<i class="bi bi-code-square"></i>
					{showDiff ? 'Show Code' : 'Diff'}
				</button>
			{/if}
			<button
				class="btn normal-case btn-xs btn-secondary"
				onclick={() => {
					pinnedResponseStore.pin(value, queryName || 'Response');
					addToast('Response pinned!', 'success');
				}}
				aria-label="Pin Response"
				title="Pin this response for comparison"
			>
				<i class="bi bi-pin-angle-fill"></i> Pin
			</button>
			<button
				class="btn normal-case btn-xs btn-primary"
				onclick={handleDownloadJSON}
				aria-label="Download JSON"
				title="Download response as JSON file"
			>
				{#if downloadFeedback}
					<i class="bi bi-check"></i> Downloaded!
				{:else}
					<i class="bi bi-download"></i> Download JSON
				{/if}
			</button>
		{/if}
		<button
			class="btn normal-case btn-xs btn-primary"
			onclick={copyToClipboard}
			aria-label="Copy Content"
			title="Copy raw content string"
		>
			{#if copyFeedback}
				<i class="bi bi-check"></i> Copied!
			{:else}
				<i class="bi bi-clipboard"></i> Copy
			{/if}
		</button>
		{#if language === 'graphql'}
			<button
				class="mx-atuo btn normal-case btn-xs btn-accent"
				onclick={() => {
					showNonPrettifiedQMSBody = !showNonPrettifiedQMSBody;
				}}
				title="Toggle between prettified and raw view"
			>
				{showNonPrettifiedQMSBody ? ' show prettified ' : ' show non-prettified '}</button
			>
		{/if}
	</div>
</div>

<Modal
	bind:show={showFavoriteModal}
	modalIdentifier="favorite-query-modal"
	onApply={handleSaveFavorite}
	showApplyBtn={true}
>
	<h3 class="text-lg font-bold">Save Favorite Query</h3>
	<div class="form-control mt-4 w-full">
		<label class="label" for="fav-name">
			<span class="label-text">Name</span>
		</label>
		<input
			id="fav-name"
			type="text"
			placeholder="My Awesome Query"
			class="input-bordered input w-full"
			bind:value={favoriteName}
			onkeydown={(e) => e.key === 'Enter' && handleSaveFavorite()}
		/>
	</div>
	<div class="form-control mt-4 w-full">
		<label class="label" for="fav-folder">
			<span class="label-text">Folder (Optional)</span>
		</label>
		<input
			id="fav-folder"
			type="text"
			placeholder="e.g. Auth, Users"
			class="input-bordered input w-full"
			bind:value={favoriteFolder}
			list="folder-suggestions"
			onkeydown={(e) => e.key === 'Enter' && handleSaveFavorite()}
		/>
		<datalist id="folder-suggestions">
			{#each existingFolders as folder}
				<option value={folder}></option>
			{/each}
		</datalist>
	</div>
</Modal>

<Modal bind:show={showExportModal} modalIdentifier="export-code-modal" showApplyBtn={false}>
	<h3 class="mb-4 text-lg font-bold">Export Code</h3>

	<div class="tabs-boxed mb-4 tabs">
		{#each exportOptions as option (option.id)}
			<button
				class="tab"
				class:tab-active={exportLanguage === option.id}
				onclick={() => (exportLanguage = option.id)}
			>
				{option.label}
			</button>
		{/each}
	</div>

	<div class="relative h-64 overflow-hidden rounded-lg border border-base-300">
		<CodeEditor rawValue={exportCode} language="javascript" readonly={true} />
		<button class="btn absolute top-2 right-2 btn-sm btn-primary" onclick={copyExportCode}>
			{#if exportCopyFeedback}
				<i class="bi bi-check"></i> Copied!
			{:else}
				<i class="bi bi-clipboard"></i> Copy
			{/if}
		</button>
	</div>
</Modal>
