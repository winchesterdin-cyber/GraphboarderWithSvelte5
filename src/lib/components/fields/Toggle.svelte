<script lang="ts">
	interface Props {
		value?: boolean;
		label?: string;
		disabled?: boolean;
		onChanged?: (detail: { chd_rawValue: boolean }) => void;
		// Legacy props from previous version used in some components
		useSwap?: boolean;
		swapOnText?: string;
		showValue?: boolean;
		otherClases?: string;
		rawValue?: boolean;
	}

	let {
		value = $bindable(false),
		label = '',
		disabled = false,
		onChanged,
		useSwap = false,
		swapOnText = '',
		showValue = true,
		otherClases = '',
		rawValue
	}: Props = $props();

	// If rawValue is provided (legacy usage), we treat it as the value
	$effect(() => {
		if (rawValue !== undefined) {
			value = rawValue;
		}
	});

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (onChanged) {
			onChanged({ chd_rawValue: target.checked });
		}
	}
</script>

<div class="form-control">
	<label class="label cursor-pointer">
		{#if useSwap}
			<span class="label-text mr-2">{swapOnText}</span>
		{:else if label}
			<span class="label-text mr-2">{label}</span>
		{/if}
		<input
			type="checkbox"
			class="toggle {otherClases}"
			bind:checked={value}
			{disabled}
			onchange={handleChange}
		/>
		{#if showValue && !useSwap}
			<span class="label-text ml-2">{value ? 'ON' : 'OFF'}</span>
		{/if}
	</label>
</div>
