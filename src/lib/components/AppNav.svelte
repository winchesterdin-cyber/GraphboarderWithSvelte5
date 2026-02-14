<script lang="ts">
	import { primaryNavItems } from '$lib/navigation/navConfig';
</script>

<nav aria-label="Primary">
	<ul class="menu menu-horizontal gap-2 px-2">
		{#each primaryNavItems as item}
			<li>
				<a href={item.href} title={item.description}>{item.label}</a>
			</li>
		{/each}
	</ul>
</nav>
