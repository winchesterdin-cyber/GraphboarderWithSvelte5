<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	interface Props {
		show: boolean;
		initialValue?: string;
		onConfirm: (newValue: string) => void;
		onCancel: () => void;
	}

	let { show = $bindable(), initialValue = '', onConfirm, onCancel }: Props = $props();

	let value = $state(initialValue);

	$effect(() => {
		if (show) {
			value = initialValue;
		}
	});

	function handleConfirm() {
		onConfirm(value);
		show = false;
	}
</script>

<Modal bind:show {onCancel} modalIdentifier="edit-tablename-modal">
	<div class="p-4">
		<h3 class="font-bold text-lg mb-4">Edit Table Base Name</h3>
		<input
			type="text"
			placeholder="Enter table name"
			class="input input-bordered w-full"
			bind:value
			onkeydown={(e) => e.key === 'Enter' && handleConfirm()}
		/>
		<div class="modal-action">
			<button class="btn" onclick={onCancel}>Cancel</button>
			<button class="btn btn-primary" onclick={handleConfirm}>Save</button>
		</div>
	</div>
</Modal>
