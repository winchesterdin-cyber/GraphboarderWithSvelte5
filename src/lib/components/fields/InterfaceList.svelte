<script lang="ts">
	interface Props {
		alwaysOn_interfacePicker?: any;
		typeInfo?: any;
		rawValue?: any;
		dispatchValue?: any;
		onChanged?: (detail: any) => void;
	}

	let {
		alwaysOn_interfacePicker,
		typeInfo,
		rawValue = $bindable(),
		dispatchValue,
		onChanged
	}: Props = $props();
</script>

<div>
	<!-- Placeholder for InterfaceList.svelte -->
	<span>InterfaceList Component</span>
</div>
