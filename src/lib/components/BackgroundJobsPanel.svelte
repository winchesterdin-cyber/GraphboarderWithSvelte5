<script lang="ts">
	import { backgroundJobs } from '$lib/jobs/backgroundJobsStore';
</script>

<section aria-label="Background jobs" class="fixed bottom-2 left-2 z-40 max-w-sm space-y-2">
	{#each $backgroundJobs.slice(0, 3) as job}
		<article class="rounded border border-base-300 bg-base-100 p-2 shadow">
			<h2 class="text-sm font-semibold">{job.name}</h2>
			<p class="text-xs">{job.status} · {job.progress}%</p>
		</article>
	{/each}
</section>
