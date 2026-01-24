<script lang="ts">
	import { toasts, removeToast } from '$lib/stores/toastStore';
	import { fade, fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	// Subscribe to the store
	// Since we are using Svelte 5, we can use $toasts in the template directly
</script>

<div class="toast toast-end toast-top z-50">
	{#each $toasts as toast (toast.id)}
		<div
			animate:flip={{ duration: 300 }}
			in:fly={{ x: 200, duration: 300 }}
			out:fade={{ duration: 200 }}
			class="alert flex cursor-pointer items-center gap-2 shadow-lg"
			class:alert-info={toast.type === 'info'}
			class:alert-success={toast.type === 'success'}
			class:alert-warning={toast.type === 'warning'}
			class:alert-error={toast.type === 'error'}
			onclick={() => removeToast(toast.id)}
			role="button"
			tabindex="0"
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') removeToast(toast.id);
			}}
		>
			{#if toast.type === 'success'}
				<i class="bi bi-check-circle-fill"></i>
			{:else if toast.type === 'error'}
				<i class="bi bi-x-circle-fill"></i>
			{:else if toast.type === 'warning'}
				<i class="bi bi-exclamation-triangle-fill"></i>
			{:else}
				<i class="bi bi-info-circle-fill"></i>
			{/if}
			<span>{toast.message}</span>
		</div>
	{/each}
</div>
