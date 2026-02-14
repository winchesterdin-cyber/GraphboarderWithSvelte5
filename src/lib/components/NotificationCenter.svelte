<script lang="ts">
	import { notificationCenter } from '$lib/notifications/notificationStore';
</script>

<section aria-label="Notification center" class="fixed right-2 bottom-2 z-40 max-w-sm space-y-2">
	{#each $notificationCenter.slice(0, 3) as notification}
		<article class="rounded border border-base-300 bg-base-100 p-2 shadow">
			<h2 class="text-sm font-semibold">{notification.title}</h2>
			<p class="text-xs">{notification.message}</p>
		</article>
	{/each}
</section>
