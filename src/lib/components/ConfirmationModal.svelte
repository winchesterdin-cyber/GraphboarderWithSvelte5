<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	let { show, onConfirm, onCancel } = $props();
</script>

<Modal bind:show>
	<div class="p-4">
		<h2 class="text-lg font-bold">Are you sure?</h2>
		<p class="py-4">This action cannot be undone.</p>
		<div class="modal-action">
			<button class="btn" onclick={onCancel}>Cancel</button>
			<button class="btn btn-error" onclick={onConfirm}>Confirm</button>
		</div>
	</div>
</Modal>
