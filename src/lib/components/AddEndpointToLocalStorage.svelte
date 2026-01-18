<script lang="ts">
	import { stringToJs } from '$lib/utils/usefulFunctions';
	import { getContext } from 'svelte';
	import CodeEditor from '$lib/components/fields/CodeEditor.svelte';
	import { getSortedAndOrderedEndpoints } from '$lib/utils/usefulFunctions';

	interface Props {
		onHide?: () => void;
	}

	let { onHide }: Props = $props();

	let localStorageEndpoints = getContext('localStorageEndpoints');
	const handleCodeChanged = (e) => {
		const newConfigurationString = e.detail.chd_rawValue;
		const newConfigurationJs = stringToJs(newConfigurationString);
		let indexOfNewEndpointIdInLocalStorage;
		if ($localStorageEndpoints?.length > 0) {
			indexOfNewEndpointIdInLocalStorage = $localStorageEndpoints.findIndex(
				(endpoint) => endpoint.id == newConfigurationJs.id
			);
		}
		if (indexOfNewEndpointIdInLocalStorage > -1) {
			$localStorageEndpoints[indexOfNewEndpointIdInLocalStorage] = newConfigurationJs;
		} else {
			$localStorageEndpoints.push(newConfigurationJs);
		}
		localStorageEndpoints.set(getSortedAndOrderedEndpoints($localStorageEndpoints));
	};
</script>

<div class="w-full p-2 max-h-[80vh] overflow-y-auto">
	<div class="card w-full  glass mx-auto md:max-w-4xl">
		<div class="card-body">
			<h2 class="card-title">Add new Endpoint</h2>
			<p>To Local Storage</p>
			<div>
				<CodeEditor
					language="javascript"
					onChanged={handleCodeChanged}
					rawValue={`{
	id: 'my-endpoint',
	url: 'https://example.com/graphql',
	headers: {
		authorization: 'Bearer YOUR_TOKEN'
	},
}`}
				/>
			</div>

			<div class="card-actions justify-end">
				<button
					class="btn btn-error"
					onclick={() => {
						onHide?.();
					}}>hide</button
				>
			</div>
		</div>
	</div>
</div>
