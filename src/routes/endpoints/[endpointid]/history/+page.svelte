<script lang="ts">
	/**
	 * History page component.
	 * Displays a list of executed queries/mutations for the current endpoint.
	 * Allows searching, filtering, exporting, importing, and restoring history items.
	 */
	import { page } from '$app/stores';
	import { historyQueries } from '$lib/stores/historyQueriesStore';
	import { downloadJSON, downloadText } from '$lib/utils/downloadUtils';
	import { goto } from '$app/navigation';
	import { addToast } from '$lib/stores/toastStore';
	import { logger } from '$lib/utils/logger';
	import type { HistoryQuery } from '$lib/stores/historyQueriesStore';

	let endpointId = $derived($page.params.endpointid);

	let searchTerm = $state('');
	let filterType = $state('all');
	let filterStatus = $state('all');
	let filterSlowOnly = $state(false);
	let minDurationInput = $state('');
	let maxDurationInput = $state('');
	let activeDetails = $state<HistoryQuery | null>(null);

	const SLOW_QUERY_THRESHOLD_MS = 1000;
	const MAX_DURATION_LIMIT_MS = 600000;

	/**
	 * Parse duration filter inputs into numbers while guarding against invalid values.
	 * We clamp values to MAX_DURATION_LIMIT_MS to prevent extreme inputs from skewing the UI.
	 */
	const parseDurationFilter = (value: string): number | null => {
		if (!value.trim()) return null;
		const parsed = Number(value);
		if (!Number.isFinite(parsed) || parsed < 0) return null;
		return Math.min(parsed, MAX_DURATION_LIMIT_MS);
	};

	let history = $derived(
		$historyQueries
			.filter((q) => {
				const isEndpoint = q.endpointId === endpointId;
				const matchesSearch = q.queryName.toLowerCase().includes(searchTerm.toLowerCase());
				const matchesType = filterType === 'all' || q.type === filterType;
				const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
				const minDuration = parseDurationFilter(minDurationInput);
				const maxDuration = parseDurationFilter(maxDurationInput);
				const withinMin = minDuration === null || q.duration >= minDuration;
				const withinMax = maxDuration === null || q.duration <= maxDuration;
				const matchesSlow = !filterSlowOnly || q.duration >= SLOW_QUERY_THRESHOLD_MS;
				return (
					isEndpoint &&
					matchesSearch &&
					matchesType &&
					matchesStatus &&
					withinMin &&
					withinMax &&
					matchesSlow
				);
			})
			.sort((a, b) => b.timestamp - a.timestamp)
	);

	/**
	 * Computes summary stats for the current history list.
	 * These stats power the insights panel and help users spot slow/erroring queries quickly.
	 */
	const summary = $derived(() => {
		const total = history.length;
		const successCount = history.filter((item) => item.status === 'success').length;
		const errorCount = total - successCount;
		const avgDuration = total
			? Math.round(history.reduce((acc, item) => acc + item.duration, 0) / total)
			: 0;
		const slowCount = history.filter((item) => item.duration >= SLOW_QUERY_THRESHOLD_MS).length;
		const successRate = total ? Math.round((successCount / total) * 100) : 0;
		return {
			total,
			successCount,
			errorCount,
			avgDuration,
			slowCount,
			successRate
		};
	});

	const handleClear = () => {
		if (confirm('Are you sure you want to clear ALL history for ALL endpoints?')) {
			logger.info('User cleared all history');
			historyQueries.clear();
			addToast('History cleared', 'success');
		}
	};

	const handleExport = () => {
		if (history.length === 0) {
			addToast('No history to export.', 'info');
			return;
		}
		logger.info('User exported history', {
			count: history.length,
			endpointId,
			filters: {
				searchTerm,
				filterType,
				filterStatus,
				filterSlowOnly,
				minDurationInput,
				maxDurationInput
			}
		});
		// Export without ID for portability (IDs regenerated on import)
		const exportData = history.map(({ id: _id, ...rest }) => rest);
		downloadJSON(exportData, `history-${endpointId}.json`);
		addToast('History exported', 'success');
	};

	let fileInput = $state<HTMLInputElement | null>(null);

	const handleImportClick = () => {
		fileInput?.click();
	};

	const handleFileChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const json = JSON.parse(event.target?.result as string);
				if (Array.isArray(json)) {
					logger.info('User imported history', { count: json.length });
					historyQueries.importHistory(json);
					addToast(`Imported ${json.length} history items`, 'success');
				} else {
					addToast('Invalid file format: Expected an array', 'error');
				}
			} catch (err) {
				logger.error('Failed to parse history import file', err);
				addToast('Failed to parse JSON file', 'error');
			}
			target.value = '';
		};
		reader.readAsText(file);
	};

	const restoreQuery = async (q: HistoryQuery) => {
		const url = `/endpoints/${endpointId}/${q.type === 'query' ? 'queries' : 'mutations'}/${q.queryName}?historyId=${q.id}`;
		logger.info('Restoring history item', { id: q.id, endpointId, type: q.type });
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(url);
	};

	const handleDelete = (id: string) => {
		if (confirm('Remove this history item?')) {
			historyQueries.remove(id);
			addToast('History item removed', 'success');
		}
	};

	const openDetails = (item: HistoryQuery) => {
		activeDetails = item;
		logger.info('Opened history details', { id: item.id, queryName: item.queryName });
	};

	const closeDetails = () => {
		activeDetails = null;
	};

	const copyQueryBody = async () => {
		if (!activeDetails?.queryBody) {
			addToast('No query body available to copy', 'warning');
			return;
		}

		try {
			await navigator.clipboard.writeText(activeDetails.queryBody);
			logger.info('Copied history query body', { id: activeDetails.id });
			addToast('Query body copied', 'success');
		} catch (error) {
			logger.error('Failed to copy query body', error);
			addToast('Unable to copy query body', 'error');
		}
	};

	/**
	 * Build a clipboard-friendly summary of the current history insights.
	 * Keeps the output compact for bug reports and team sharing.
	 */
	const buildInsightsSummary = () =>
		[
			`History Insights (${endpointId})`,
			`Total runs: ${summary.total}`,
			`Success rate: ${summary.successRate}%`,
			`Avg duration: ${summary.avgDuration} ms`,
			`Slow runs (>= ${SLOW_QUERY_THRESHOLD_MS} ms): ${summary.slowCount}`,
			`Filters: search="${searchTerm || '—'}", type=${filterType}, status=${filterStatus}, slowOnly=${filterSlowOnly}, min=${minDurationInput || '—'} ms, max=${maxDurationInput || '—'} ms`
		].join('\n');

	const copyInsightsSummary = async () => {
		if (summary.total === 0) {
			addToast('No history data to copy yet', 'info');
			return;
		}

		try {
			await navigator.clipboard.writeText(buildInsightsSummary());
			logger.info('Copied history insights', { endpointId, total: summary.total });
			addToast('History insights copied', 'success');
		} catch (error) {
			logger.error('Failed to copy history insights', error);
			addToast('Unable to copy insights', 'error');
		}
	};

	/**
	 * Download the insights summary as a text file for offline review or sharing.
	 */
	const downloadInsightsSummary = () => {
		if (summary.total === 0) {
			addToast('No history data to download yet', 'info');
			return;
		}

		const filename = `history-insights-${endpointId}.txt`;
		downloadText(buildInsightsSummary(), filename);
		logger.info('Downloaded history insights', { endpointId, filename });
		addToast('History insights downloaded', 'success');
	};

	/**
	 * Build a CSV export of the currently filtered history list.
	 * We intentionally keep columns simple for spreadsheet import and incident reports.
	 */
	const buildHistoryCsv = () => {
		const headers = ['queryName', 'type', 'status', 'durationMs', 'timestamp', 'executedAt'];
		const rows = history.map((item) => [
			item.queryName,
			item.type,
			item.status,
			item.duration,
			item.timestamp,
			new Date(item.timestamp).toISOString()
		]);
		return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
	};

	const downloadHistoryCsv = () => {
		if (history.length === 0) {
			addToast('No history data to export yet', 'info');
			return;
		}

		const filename = `history-${endpointId}.csv`;
		downloadText(buildHistoryCsv(), filename);
		logger.info('Downloaded history CSV', {
			endpointId,
			count: history.length
		});
		addToast('History CSV downloaded', 'success');
	};

	const resetFilters = () => {
		searchTerm = '';
		filterType = 'all';
		filterStatus = 'all';
		filterSlowOnly = false;
		minDurationInput = '';
		maxDurationInput = '';
		logger.info('History filters reset', { endpointId });
	};
</script>

<div class="p-4">
	<div class="mb-4 flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">History</h1>
			<div class="flex gap-2">
				<button class="btn btn-outline btn-sm" onclick={handleExport}>
					<i class="bi bi-download"></i> Export
				</button>
				<button class="btn btn-outline btn-sm" onclick={handleImportClick}>
					<i class="bi bi-upload"></i> Import
				</button>
				<button class="btn btn-outline btn-sm btn-error" onclick={handleClear}>
					<i class="bi bi-trash"></i> Clear All
				</button>
				<input
					type="file"
					bind:this={fileInput}
					onchange={handleFileChange}
					accept=".json"
					class="hidden"
				/>
			</div>
		</div>

		<div class="flex flex-col gap-2 md:flex-row">
			<input
				type="text"
				placeholder="Search by name..."
				class="input-bordered input input-sm w-full md:w-1/3"
				bind:value={searchTerm}
			/>
			<select class="select-bordered select select-sm" bind:value={filterType}>
				<option value="all">All Types</option>
				<option value="query">Query</option>
				<option value="mutation">Mutation</option>
			</select>
			<select class="select-bordered select select-sm" bind:value={filterStatus}>
				<option value="all">All Statuses</option>
				<option value="success">Success</option>
				<option value="error">Error</option>
			</select>
			<label class="label cursor-pointer gap-2">
				<input class="checkbox checkbox-sm" type="checkbox" bind:checked={filterSlowOnly} />
				<span class="label-text text-sm">Slow only</span>
			</label>
			<div class="flex items-center gap-2">
				<input
					type="number"
					min="0"
					max={MAX_DURATION_LIMIT_MS}
					placeholder="Min ms"
					class="input-bordered input input-sm w-24"
					bind:value={minDurationInput}
				/>
				<input
					type="number"
					min="0"
					max={MAX_DURATION_LIMIT_MS}
					placeholder="Max ms"
					class="input-bordered input input-sm w-24"
					bind:value={maxDurationInput}
				/>
			</div>
			<button class="btn btn-ghost btn-sm" onclick={resetFilters}>Reset filters</button>
		</div>
	</div>

	<div class="mb-4 grid gap-3 md:grid-cols-4">
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-title">Total Runs</div>
				<div class="stat-value text-primary">{summary.total}</div>
				<div class="stat-desc">For this endpoint & filters</div>
			</div>
		</div>
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-title">Success Rate</div>
				<div class="stat-value">{summary.successRate}%</div>
				<div class="stat-desc">{summary.successCount} OK · {summary.errorCount} ERR</div>
			</div>
		</div>
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-title">Avg Duration</div>
				<div class="stat-value">{summary.avgDuration} ms</div>
				<div class="stat-desc">Across {summary.total} runs</div>
			</div>
		</div>
		<div class="stats shadow">
			<div class="stat">
				<div class="stat-title">Slow Runs</div>
				<div class="stat-value text-warning">{summary.slowCount}</div>
				<div class="stat-desc">≥ {SLOW_QUERY_THRESHOLD_MS} ms</div>
			</div>
		</div>
		<div class="flex items-center justify-start md:col-span-4">
			<button
				class="btn btn-outline btn-sm"
				onclick={copyInsightsSummary}
				disabled={summary.total === 0}
			>
				<i class="bi bi-clipboard"></i> Copy Insights
			</button>
			<button
				class="btn ml-2 btn-outline btn-sm"
				onclick={downloadInsightsSummary}
				disabled={summary.total === 0}
			>
				<i class="bi bi-download"></i> Download Insights
			</button>
			<button class="btn ml-2 btn-outline btn-sm" onclick={downloadHistoryCsv}>
				<i class="bi bi-filetype-csv"></i> Download CSV
			</button>
		</div>
	</div>

	{#if history.length === 0}
		<div class="alert alert-info">
			<i class="bi bi-info-circle"></i>
			<span>
				No history matches these filters. Run some queries or adjust filters to see results.
			</span>
			<button class="btn btn-outline btn-sm" onclick={resetFilters}>Clear filters</button>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="table w-full">
				<thead>
					<tr>
						<th>Status</th>
						<th>Name</th>
						<th>Executed At</th>
						<th>Duration</th>
						<th class="text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each history as item (item.id)}
						<tr class="hover">
							<td>
								{#if item.status === 'success'}
									<span class="badge badge-sm badge-success">OK</span>
								{:else}
									<span class="badge badge-sm badge-error">ERR</span>
								{/if}
							</td>
							<td class="font-medium">
								<button
									class="link font-bold link-hover"
									onclick={async () => await restoreQuery(item)}
								>
									{item.queryName}
								</button>
								<span class="ml-1 text-xs opacity-50">({item.type})</span>
							</td>
							<td>{new Date(item.timestamp).toLocaleString()}</td>
							<td>{item.duration} ms</td>
							<td class="text-right">
								<button
									class="btn btn-ghost btn-xs"
									onclick={async () => await restoreQuery(item)}
									title="Restore State"
									aria-label="Restore query"
								>
									<i class="bi bi-arrow-counterclockwise text-lg"></i>
								</button>
								<button
									class="btn btn-ghost btn-xs"
									onclick={() => openDetails(item)}
									title="View details"
									aria-label="View history details"
								>
									<i class="bi bi-info-circle text-lg"></i>
								</button>
								<button
									class="btn text-error btn-ghost btn-xs"
									onclick={() => handleDelete(item.id)}
									title="Delete history item"
									aria-label="Delete history item"
								>
									<i class="bi bi-trash text-lg"></i>
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if activeDetails}
	<div class="modal-open modal">
		<div class="modal-box max-w-3xl">
			<h2 class="text-xl font-bold">History Details</h2>
			<p class="text-sm opacity-70">
				{activeDetails.queryName} · {activeDetails.type} · {activeDetails.duration} ms
			</p>
			<div class="mt-4 space-y-3">
				<div>
					<h3 class="text-sm font-semibold uppercase opacity-60">Arguments</h3>
					<pre class="mt-2 rounded bg-base-200 p-3 text-xs">
{JSON.stringify(activeDetails.args ?? {}, null, 2)}
					</pre>
				</div>
				<div>
					<h3 class="text-sm font-semibold uppercase opacity-60">Query Body</h3>
					{#if activeDetails.queryBody}
						<pre class="mt-2 max-h-64 overflow-auto rounded bg-base-200 p-3 text-xs">
{activeDetails.queryBody}
						</pre>
					{:else}
						<p class="mt-2 text-sm opacity-70">No query body captured for this entry.</p>
					{/if}
				</div>
			</div>
			<div class="modal-action">
				<button class="btn btn-outline" onclick={copyQueryBody} disabled={!activeDetails.queryBody}>
					<i class="bi bi-clipboard"></i> Copy Query
				</button>
				<button class="btn" onclick={closeDetails}>Close</button>
			</div>
		</div>
		<button class="modal-backdrop" aria-label="Close details" onclick={closeDetails}></button>
	</div>
{/if}
