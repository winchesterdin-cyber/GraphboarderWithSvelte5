<script lang="ts">
	import '../app.css';
	import ToastContainer from '$lib/components/UI/ToastContainer.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import PinnedResponseViewer from '$lib/components/PinnedResponseViewer.svelte';
	import AppNav from '$lib/components/AppNav.svelte';
	import NotificationCenter from '$lib/components/NotificationCenter.svelte';
	import BackgroundJobsPanel from '$lib/components/BackgroundJobsPanel.svelte';
	import { focusElementById } from '$lib/accessibility/a11y';
	import { pushNotification } from '$lib/notifications/notificationStore';
	import { upsertBackgroundJob } from '$lib/jobs/backgroundJobsStore';
	import { trackTelemetryEvent } from '$lib/analytics/telemetry';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	const moveToMainContent = () => {
		focusElementById('main-content');
	};

	// Seed lightweight demo entries so feature shells are visible in UI.
	pushNotification('Welcome', 'Enhancement foundations are active.', 'in-app');
	upsertBackgroundJob({
		id: 'bootstrap-sync',
		name: 'Bootstrap Sync',
		status: 'running',
		progress: 35
	});
	trackTelemetryEvent({ name: 'layout.loaded', context: { surface: 'app-shell' } });
</script>

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-base-100 focus:px-3 focus:py-2"
	onclick={(event) => {
		event.preventDefault();
		moveToMainContent();
	}}
>
	Skip to main content
</a>

<ToastContainer />
<CommandPalette />
<PinnedResponseViewer />
<NotificationCenter />
<BackgroundJobsPanel />

<header class="border-b border-base-300 bg-base-200/60">
	<AppNav />
</header>
<main id="main-content" tabindex="-1" class="min-h-[calc(100vh-7rem)]">
	{@render children?.()}
</main>
<footer class="border-t border-base-300 p-2 text-center text-xs text-base-content/70">
	Graphboarder enhancement foundations active
</footer>
