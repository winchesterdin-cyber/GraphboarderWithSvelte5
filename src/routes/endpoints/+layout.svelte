<script lang="ts">
	import type { LayoutData } from './$types';

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
		prefix?: string;
	}

	let { data, children, prefix = '' }: Props = $props();
</script>

{@render children?.()}
