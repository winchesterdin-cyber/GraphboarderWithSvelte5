<script lang="ts">
	interface Props {
		alwaysOn_interfacePicker?: any;
		typeInfo?: any;
		rawValue?: any;
		dispatchValue?: any;
	}

	let {
		alwaysOn_interfacePicker,
		typeInfo,
		rawValue = $bindable(),
		dispatchValue
	}: Props = $props();
</script>

<div>
	<!-- Placeholder for InterfaceList.svelte -->
	<span>InterfaceList Component</span>
</div>
