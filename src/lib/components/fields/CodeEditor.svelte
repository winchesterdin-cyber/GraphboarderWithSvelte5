<script lang="ts">
	import CodeMirror from 'svelte-codemirror-editor';
	import { javascript } from '@codemirror/lang-javascript';
	import { json } from '@codemirror/lang-json';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { graphql } from 'cm6-graphql';

	/**
	 * Props for CodeEditor component.
	 */
	interface Props {
		/** The raw value to be edited or displayed. */
		rawValue?: string;
		/** The language mode for the editor (javascript, json, graphql). Default: 'javascript'. */
		language?: string;
		/** Callback function triggered when the content changes. */
		onChanged?: (detail: { chd_rawValue: string }) => void;
		/** Whether the editor is in read-only mode. Default: false. */
		readonly?: boolean;
	}

	let {
		rawValue = $bindable(''),
		language = 'javascript',
		onChanged,
		readonly = false
	}: Props = $props();

	let lang = $derived(
		language === 'javascript' || language === 'typescript'
			? javascript()
			: language === 'json'
				? json()
				: language === 'graphql'
					? graphql()
					: javascript()
	);

	$effect(() => {
		if (onChanged) {
			onChanged({ chd_rawValue: rawValue });
		}
	});
</script>

<!--
  CodeMirror component wrapping the underlying editor.
  Handles syntax highlighting and editing capabilities.
-->
<CodeMirror
	bind:value={rawValue}
	lang={lang as any}
	theme={oneDark}
	{readonly}
	styles={{
		'&': {
			width: '100%',
			maxWidth: '100%',
			height: '100%'
		}
	}}
/>
