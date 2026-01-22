<script lang="ts">
	// import '../app.postcss';
	import '../app.css';
	import ToastContainer from '$lib/components/UI/ToastContainer.svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<ToastContainer />

<header></header>

{@render children?.()}
<footer></footer>

<style>
</style>
