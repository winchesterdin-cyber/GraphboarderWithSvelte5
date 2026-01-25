<script lang="ts">
	import { onMount } from 'svelte';

	let theme = $state('light');

	onMount(() => {
		const storedTheme = localStorage.getItem('theme');
		if (storedTheme) {
			theme = storedTheme;
		} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			theme = 'dark';
		}
		document.documentElement.setAttribute('data-theme', theme);
	});

	const toggleTheme = () => {
		theme = theme === 'light' ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	};
</script>

<button
	class="btn btn-ghost btn-circle"
	onclick={toggleTheme}
	aria-label="Toggle Theme"
	title="Toggle Theme"
>
	{#if theme === 'light'}
		<i class="bi bi-moon-fill text-lg"></i>
	{:else}
		<i class="bi bi-sun-fill text-lg text-warning"></i>
	{/if}
</button>
