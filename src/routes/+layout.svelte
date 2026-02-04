<script lang="ts">
	// import '../app.postcss';
	import '../app.css';
	import ToastContainer from '$lib/components/UI/ToastContainer.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import PinnedResponseViewer from '$lib/components/PinnedResponseViewer.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<ToastContainer />
<CommandPalette />
<PinnedResponseViewer />

<header></header>

{@render children?.()}
<footer></footer>

<style>
</style>
