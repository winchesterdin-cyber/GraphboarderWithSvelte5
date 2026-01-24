<script lang="ts">
	import { page } from '$app/stores';
	interface Props {
		title: any;
		icon: any;
		url: any;
		hasFill?: boolean;
		urlIsRoute: any;
		target?: string;
	}

	let { title, icon, url, hasFill = true, urlIsRoute, target = '' }: Props = $props();
</script>

<a
	data-sveltekit-prefetch
	href={url}
	{target}
	class="{$page.url.pathname.startsWith(url)
		? ' scale-110 bg-base-100  font-medium'
		: ' opacity-50 '}  border-opacity-0 active:border-opacity-100 mx-auto mb-2 flex transform cursor-pointer flex-col justify-center border-b-4 border-base-content px-3 py-2 text-center text-xs leading-none text-base-content ease-out hover:no-underline focus:no-underline"
>
	<i
		class="{$page.url.pathname.startsWith(url) && hasFill
			? icon + '-fill '
			: icon + '  '}  mx-auto text-lg leading-none"
	></i>
	{title}
</a>
