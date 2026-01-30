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
	import { parse, print } from 'graphql';
	import JSON5 from 'json5';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import Modal from '$lib/components/Modal.svelte';
	import { favoriteQueries } from '$lib/stores/favoriteQueriesStore';
	import { addToast } from '$lib/stores/toastStore';

	interface Props {
		showNonPrettifiedQMSBody?: boolean;
		value: string;
		enableSyncToUI?: boolean;
		prefix?: string;
	}

	let {
		showNonPrettifiedQMSBody = $bindable(false),
		value,
		enableSyncToUI = true,
		prefix = ''
	}: Props = $props();

	let valueModifiedManually = $state<string>();
	let lastSyncedValue = $state(value);

	// Favorites State
	let showFavoriteModal = $state(false);
	let favoriteName = $state('');

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
			endpointId: endpointId
		});

		addToast(`Saved favorite: ${favoriteName}`, 'success');
		showFavoriteModal = false;
		favoriteName = '';
	};

	// Try to get context if available
	let QMSWraperContext: any = $state();
	let QMSMainWraperContext: any = $state();

	try {
		QMSWraperContext = getContext(`${prefix}QMSWraperContext`);
		QMSMainWraperContext = getContext(`${prefix}QMSMainWraperContext`);
	} catch (e) {
		// Context might not be available in all usages
	}

	onMount(() => {
		hljs.registerLanguage('graphql', graphql);
		hljs.highlightAll();
	});

	let astAsString = $state('');
	let ast: any = $state();
	let astPrinted = $state('');
	let copyFeedback = $state(false);
	let curlCopyFeedback = $state(false);
	let fetchCopyFeedback = $state(false);
	let tsCopyFeedback = $state(false);

	const copyToClipboard = () => {
		navigator.clipboard.writeText(value);
		copyFeedback = true;
		setTimeout(() => {
			copyFeedback = false;
		}, 2000);
	};

	const generateCurlCommand = () => {
		let url = 'http://localhost:4000/graphql'; // Default fallback
		let headers = {};

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
				headers = endpoint.headers;
			}
		}

		// Also try localStorage headers if not found in endpoint
		if (Object.keys(headers).length === 0 && browser) {
			const headersStr = localStorage.getItem('headers');
			if (headersStr) {
				try {
					headers = JSON.parse(headersStr);
				} catch (e) {
					// ignore
				}
			}
		}

		let headerString = '';
		for (const [key, val] of Object.entries(headers)) {
			headerString += ` -H "${key}: ${val}"`;
		}

		// Properly escape single quotes for shell
		const queryJson = JSON.stringify({ query: value }).replace(/'/g, "'\\''");

		return `curl -X POST "${url}" -H "Content-Type: application/json"${headerString} -d '${queryJson}'`;
	};

	const generateFetchCommand = () => {
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
				} catch (e) {
					// ignore
				}
			}
		}

		// Add Content-Type if not present
		if (!headers['Content-Type']) {
			headers['Content-Type'] = 'application/json';
		}

		const body = { query: value };

		return `fetch("${url}", {
  method: "POST",
  headers: ${JSON.stringify(headers, null, 2)},
  body: JSON.stringify(${JSON.stringify(body, null, 2)})
});`;
	};

	// Helper to get store value safely
	function getStoreValue(store: any) {
		let storeVal;
		store.subscribe(($: any) => (storeVal = $))();
		return storeVal;
	}

	const copyCurlToClipboard = () => {
		const curl = generateCurlCommand();
		console.debug('Copying cURL command to clipboard');
		navigator.clipboard.writeText(curl);
		curlCopyFeedback = true;
		setTimeout(() => {
			curlCopyFeedback = false;
		}, 2000);
	};

	const copyFetchToClipboard = () => {
		const fetchCmd = generateFetchCommand();
		console.debug('Copying fetch command to clipboard');
		navigator.clipboard.writeText(fetchCmd);
		fetchCopyFeedback = true;
		setTimeout(() => {
			fetchCopyFeedback = false;
		}, 2000);
	};

	/**
	 * Generates a TypeScript interface based on the current AST and Schema.
	 * Copies the result to the clipboard and shows feedback.
	 */
	const copyTypeScriptToClipboard = () => {
		if (!ast || !QMSMainWraperContext?.schemaData) {
			console.warn('Cannot generate TypeScript: missing AST or SchemaData');
			addToast('Cannot generate TypeScript: Schema data missing', 'warning');
			return;
		}

		try {
			console.debug('Generating TypeScript interface...');
			const tsCode = generateTypeScript(ast, QMSMainWraperContext.schemaData);
			if (tsCode) {
				navigator.clipboard.writeText(tsCode);
				tsCopyFeedback = true;
				addToast('TypeScript interface copied!', 'success');
				setTimeout(() => {
					tsCopyFeedback = false;
				}, 2000);
			} else {
				addToast('Generated TypeScript was empty', 'warning');
			}
		} catch (e: any) {
			console.error('Error generating TypeScript:', e);
			addToast(`Failed to generate TypeScript: ${e.message}`, 'error');
		}
	};

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
			if (value) {
				ast = parse(value);
			}
		} catch (e) {
			// Failed to parse, ignore
		}
	});

	$effect(() => {
		if (valueModifiedManually && valueModifiedManually !== lastSyncedValue) {
			try {
				ast = parse(valueModifiedManually);

				// Sync to UI if enabled and context is available
				if (enableSyncToUI && QMSWraperContext && QMSMainWraperContext) {
					syncQueryToUI(ast);
					lastSyncedValue = valueModifiedManually;
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
			} catch (e) {
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
		{#if showNonPrettifiedQMSBody}
			<code class="px-10">{value}</code>
			<div class="mt-4">
				<code class="px-10">{astAsString}</code>
			</div>
		{:else}
			<code class="language-graphql"
				>{@html hljs.highlight(format(value), { language: 'graphql' }).value.trim()}</code
			>
			<div class="mx-4 mt-2">
				<CodeEditor
					rawValue={value}
					language="graphql"
					onChanged={(detail) => {
						valueModifiedManually = detail.chd_rawValue;
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
		<button
			class="btn normal-case btn-xs btn-warning"
			onclick={() => (showFavoriteModal = true)}
			aria-label="Save to Favorites"
			title="Save this query to favorites"
		>
			<i class="bi bi-star-fill"></i> Save
		</button>
		<button
			class="btn normal-case btn-xs btn-primary"
			onclick={copyCurlToClipboard}
			aria-label="Copy cURL"
		>
			{#if curlCopyFeedback}
				<i class="bi bi-check"></i> Copied cURL!
			{:else}
				<i class="bi bi-terminal"></i> Copy cURL
			{/if}
		</button>
		<button
			class="btn normal-case btn-xs btn-primary"
			onclick={copyFetchToClipboard}
			aria-label="Copy Fetch"
			title="Generate and copy Fetch request"
		>
			{#if fetchCopyFeedback}
				<i class="bi bi-check"></i> Copied Fetch!
			{:else}
				<i class="bi bi-code-slash"></i> Copy Fetch
			{/if}
		</button>
		<button
			class="btn normal-case btn-xs btn-primary"
			onclick={copyTypeScriptToClipboard}
			aria-label="Copy TypeScript Interface"
			title="Generate and copy TypeScript interface"
		>
			{#if tsCopyFeedback}
				<i class="bi bi-check"></i> Copied TS!
			{:else}
				<i class="bi bi-filetype-ts"></i> Copy TS
			{/if}
		</button>
		<button
			class="btn normal-case btn-xs btn-primary"
			onclick={copyToClipboard}
			aria-label="Copy Query"
			title="Copy raw query string"
		>
			{#if copyFeedback}
				<i class="bi bi-check"></i> Copied!
			{:else}
				<i class="bi bi-clipboard"></i> Copy
			{/if}
		</button>
		<button
			class="mx-atuo btn normal-case btn-xs btn-accent"
			onclick={() => {
				showNonPrettifiedQMSBody = !showNonPrettifiedQMSBody;
			}}
			title="Toggle between prettified and raw view"
		>
			{showNonPrettifiedQMSBody ? ' show prettified ' : ' show non-prettified '}</button
		>
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
</Modal>
