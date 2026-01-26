<script lang="ts">
	import CodeMirror from 'svelte-codemirror-editor';
	import { javascript } from '@codemirror/lang-javascript';
	import { json } from '@codemirror/lang-json';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { graphql } from 'cm6-graphql';

	interface Props {
		rawValue?: string;
		language?: string;
		onChanged?: (detail: { chd_rawValue: string }) => void;
	}

	let { rawValue = $bindable(''), language = 'javascript', onChanged }: Props = $props();

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

<CodeMirror
	bind:value={rawValue}
	lang={lang as any}
	theme={oneDark}
	styles={{
		'&': {
			width: '100%',
			maxWidth: '100%',
			height: '100%'
		}
	}}
/>
