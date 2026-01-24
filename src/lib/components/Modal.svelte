<script lang="ts">
	interface Props {
		show?: boolean;
		children?: import('svelte').Snippet;
		modalIdentifier?: string;
		showApplyBtn?: boolean;
		onCancel?: (detail: any) => void;
	}

	let { show = $bindable(true), children, modalIdentifier, onCancel }: Props = $props();

	let dialog: HTMLDialogElement;

	$effect(() => {
		if (show && dialog && !dialog.open) {
			dialog.showModal();
		} else if (!show && dialog && dialog.open) {
			dialog.close();
		}
	});

	function close() {
		show = false;
		if (onCancel) {
			onCancel({ modalIdentifier });
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			// dialog handles escape automatically for closing, but we need to sync state
			// actually, 'cancel' event is fired on escape.
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	class="modal"
	onclose={close}
	onclick={(e) => {
		if (e.target === dialog) close();
	}}
>
	<div class="modal-box">
		{#if onCancel}
			<button class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm" onclick={close}
				>✕</button
			>
		{/if}
		{@render children?.()}
	</div>
	<form method="dialog" class="modal-backdrop">
		<button onclick={close}>close</button>
	</form>
</dialog>
