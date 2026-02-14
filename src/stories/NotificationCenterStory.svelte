<script lang="ts">
	import { notificationCenter, pushNotification } from '$lib/notifications/notificationStore';

	pushNotification('Deploy completed', 'The latest release has been rolled out.', 'in-app');
</script>

<div class="p-4">
	<h3 class="mb-2 text-lg font-semibold">Notification Center</h3>
	{#each $notificationCenter as notification}
		<div class="mb-2 rounded border p-2">
			<p class="font-medium">{notification.title}</p>
			<p class="text-sm">{notification.message}</p>
		</div>
	{/each}
</div>
