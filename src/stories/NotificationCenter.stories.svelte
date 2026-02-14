<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import NotificationCenterStory from './NotificationCenterStory.svelte';

	const { Story } = defineMeta({
		title: 'App/Notification Center',
		component: NotificationCenterStory,
		tags: ['autodocs']
	});
</script>

<Story name="Default" />
