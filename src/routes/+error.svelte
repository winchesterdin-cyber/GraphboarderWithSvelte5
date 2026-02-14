<script lang="ts">
	import { page } from '$app/stores';
	import { logEvent } from '$lib/observability/logger';

	const reloadPage = () => {
		logEvent('warn', 'error.recovery.reload', {
			feature: 'error-boundary',
			traceId: $page.data?.traceId
		});
		window.location.reload();
	};
</script>

<svelte:head>
	<title>Something went wrong</title>
</svelte:head>

<main class="mx-auto max-w-2xl p-8" role="alert" aria-live="assertive">
	<h1 class="mb-4 text-2xl font-bold">Something went wrong</h1>
	<p class="mb-4">Try reloading the page. If this continues, share the trace id with support.</p>
	<p class="mb-6 rounded bg-base-200 p-3 font-mono text-sm">
		Trace ID: {$page.data?.traceId ?? 'unknown'}
	</p>
	<button class="btn btn-primary" type="button" on:click={reloadPage}>Retry</button>
</main>
