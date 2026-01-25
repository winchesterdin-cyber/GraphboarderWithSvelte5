<script lang="ts">
	import CodeEditor from './fields/CodeEditor.svelte';
	import { format } from 'graphql-formatter';
	import hljs from 'highlight.js/lib/core';
	import { onMount, getContext } from 'svelte';
	import graphql from 'highlight.js/lib/languages/graphql';
	import 'highlight.js/styles/base16/solarized-dark.css';
	import { getPreciseType } from '$lib/utils/usefulFunctions';
	import { updateStoresFromAST } from '$lib/utils/astToUIState';
	import { parse, print } from 'graphql';

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

	const copyToClipboard = () => {
		navigator.clipboard.writeText(value);
		copyFeedback = true;
		setTimeout(() => {
			copyFeedback = false;
		}, 2000);
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
			class="btn btn-xs btn-primary normal-case"
			onclick={copyToClipboard}
			aria-label="Copy Query"
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
		>
			{showNonPrettifiedQMSBody ? ' show prettified ' : ' show non-prettified '}</button
		>
	</div>
</div>
