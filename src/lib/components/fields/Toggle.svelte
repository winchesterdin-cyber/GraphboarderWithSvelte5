<script lang="ts">
	interface Props {
		value?: boolean;
		label?: string;
		disabled?: boolean;
		onChanged?: (detail: { chd_rawValue: boolean }) => void;
	}

	let { value = $bindable(false), label = '', disabled = false, onChanged }: Props = $props();

	function handleChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (onChanged) {
			onChanged({ chd_rawValue: target.checked });
		}
	}
</script>

<div class="form-control">
	<label class="label cursor-pointer">
		<span class="label-text mr-2">{label}</span>
		<input
			type="checkbox"
			class="toggle"
			bind:checked={value}
			{disabled}
			onchange={handleChange}
		/>
	</label>
</div>
