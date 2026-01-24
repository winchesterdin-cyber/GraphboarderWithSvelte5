<script lang="ts">
	type Tab = {
		id: string;
		label: string;
	};

	let { tabs, activeTab }: { tabs: Tab[]; activeTab: string } = $props();
</script>

<div class="tabs-boxed tabs">
	{#each tabs as tab}
		<button
			class="tab"
			class:tab-active={activeTab === tab.id}
			onclick={() => (activeTab = tab.id)}
		>
			{tab.label}
		</button>
	{/each}
</div>
