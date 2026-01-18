<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	interface Props {
		show: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { show = $bindable(), onConfirm, onCancel }: Props = $props();
</script>

<Modal bind:show {onCancel}>
	<div class="p-4">
		<h2 class="text-lg font-bold">Are you sure?</h2>
		<p class="py-4">This action cannot be undone.</p>
		<div class="modal-action">
			<button class="btn" onclick={onCancel}>Cancel</button>
			<button class="btn btn-error" onclick={onConfirm}>Confirm</button>
		</div>
	</div>
</Modal>
