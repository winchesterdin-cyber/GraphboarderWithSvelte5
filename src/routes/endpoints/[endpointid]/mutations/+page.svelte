<script lang="ts">
	import MutationExample from './MutationExample.svelte';
	import QMSWraper from '$lib/components/QMSWraper.svelte';
	import Page from '$lib/components/Page.svelte';

	let QMSName = $state('');
	let input = $state<HTMLInputElement>();
</script>

<Page MenuItem={true} CustomId="fdsfds" backPath={`/`} title="Mutations">
	<div class="h-full overflow-auto">
		<input
			class="input m-5 input-xs w-32"
			type="text"
			bind:this={input}
			onchange={(e) => {
				if (input) QMSName = input.value;
			}}
		/>
		{#key QMSName}
			{#if QMSName}
				<QMSWraper isOutermostQMSWraper={true} {QMSName} QMSType="mutation">
					<MutationExample />
				</QMSWraper>
			{/if}
		{/key}
	</div>
</Page>
