<script>
	import EndpointsList from '$lib/components/EndpointsList.svelte';
	import QMSWraper from '$lib/components/QMSWraper.svelte';
	import { localEndpoints } from '$lib/stores/testData/testEndpoints';
	import ExplorerTable from '$lib/components/ExplorerTable.svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import AddEndpointToLocalStorage from '$lib/components/addEndpointToLocalStorage.svelte';
	import { getContext } from 'svelte';
	import { getSortedAndOrderedEndpoints } from '$lib/utils/usefulFunctions';
	import Tabs from '$lib/components/Tabs.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

	const localStorageEndpoints = getContext('localStorageEndpoints');

	let columns = [
		{
			accessorFn: (row) => row.description,
			header: 'description',
			footer: 'description',
			enableHiding: true
		},
		{
			accessorFn: (row) => row.url,
			header: 'url',
			footer: 'url',
			enableHiding: true
		}
	];

	let showAddEndpoint = $state(false);
	let showConfirmationModal = $state(false);
	let activeTab = $state('local');
	let endpointToDelete = $state(null);

	const deleteEndpoint = (endpoint) => {
		endpointToDelete = endpoint;
		showConfirmationModal = true;
	};

	const confirmDelete = () => {
		localStorageEndpoints.set(
			$localStorageEndpoints.filter((endpoint) => endpoint.id !== endpointToDelete.id)
		);
		endpointToDelete = null;
		showConfirmationModal = false;
	};

	const tabs = [
		{ id: 'local', label: 'Local' },
		{ id: 'localstorage', label: 'Local Storage' },
		{ id: 'remote', label: 'Remote' }
	];
</script>

<div class="p-4">
	<div class="flex justify-between items-center mb-4">
		<Tabs {tabs} bind:activeTab />
		<button class="btn btn-sm btn-primary" onclick={() => (showAddEndpoint = true)}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Endpoint
		</button>
	</div>

	<div class="mt-4">
		{#if activeTab === 'local'}
			<div class="mx-auto pl-4 pt-4 h-[50vh]">
				<ExplorerTable
					onRowClicked={(detail) => {
						if (browser) {
							window.open(`${page.url.origin}/endpoints/localEndpoint--${detail.id}`, '_blank');
						}
					}}
					enableMultiRowSelectionState={false}
					data={getSortedAndOrderedEndpoints(localEndpoints, true)}
					{columns}
					onRowSelectionChange={() => {}}
				/>
			</div>
		{/if}

		{#if activeTab === 'localstorage'}
			<div class="mx-auto pl-4 pt-4 h-[50vh]">
				{#if $localStorageEndpoints.length === 0}
					<div class="text-center p-8 flex flex-col items-center justify-center h-full">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-24 w-24 text-gray-400 mb-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<h2 class="text-2xl font-bold mb-4">Welcome!</h2>
						<p class="mb-4 max-w-md">
							You don't have any local endpoints configured yet. Get started by adding a new
							endpoint to explore your GraphQL API.
						</p>
						<button class="btn btn-primary" onclick={() => (showAddEndpoint = true)}>
							Add Your First Endpoint
						</button>
					</div>
				{:else}
					<ExplorerTable
						onDeleteRow={deleteEndpoint}
						onRowClicked={(detail) => {
							if (browser) {
								window.open(
									`${page.url.origin}/endpoints/localstorageEndpoint--${detail.id}`,
									'_blank'
								);
							}
						}}
						enableMultiRowSelectionState={false}
						data={$localStorageEndpoints}
						{columns}
					/>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'remote'}
			<div class="w-full p-2">
				<div class="card w-full glass">
					<div class="card-body">
						<h2 class="card-title">Add new Endpoint</h2>
						<p>To remote db</p>
						<a href="/endpoints/localEndpoint--nhost/mutations/insert_endpoints_one">
							/endpoints/localEndpoint--nhost/mutations/insert_endpoints_one
						</a>
						<a href="/endpoints/localEndpoint--nhostRelay/mutations/insert_endpoints_one">
							/endpoints/localEndpoint--nhostRelay/mutations/insert_endpoints_one
						</a>
					</div>
				</div>
			</div>
			<QMSWraper
				isOutermostQMSWraper={true}
				QMSName="endpoints"
				tableColsData_StoreInitialValue={[
					{ title: 'provider name', stepsOfFields: ['endpoints', 'configuration', 'id'] },
					{ title: 'provider id', stepsOfFields: ['endpoints', 'configuration', 'id'] },
					{
						title: 'configuration',
						stepsOfFields: ['endpoints', 'configuration', 'configuration']
					}
				]}
			>
				<div class="pt-2">
					<EndpointsList QMSName="endpoints" />
				</div>
			</QMSWraper>
		{/if}
	</div>
</div>

<Modal bind:show={showAddEndpoint}>
	<AddEndpointToLocalStorage onHide={() => (showAddEndpoint = false)} />
</Modal>

<ConfirmationModal
	bind:show={showConfirmationModal}
	onConfirm={confirmDelete}
	onCancel={() => (showConfirmationModal = false)}
/>
