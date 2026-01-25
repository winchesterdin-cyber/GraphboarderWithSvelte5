<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME, SOURCES, TRIGGERS } from 'svelte-dnd-action';
	import {
		syncChoiceOrder,
		getFilterButtonClasses,
		getFilterDisplayInfo,
		toggleFilterChoice,
		createChoisesWithId
	} from '$lib/utils/filterStateUtils';
	import { flip } from 'svelte/animate';

	/**
	 * Props for FilterItem component.
	 */
	interface Props {
		extraData: any;
		id: any;
		/** List of available choices */
		choises?: any;
		/** Title of the filter button */
		title?: any;
		modalTitle?: any;
		/** Type of filter: 'radio' | 'checkbox' | 'toggle' */
		type?: string;
		/** Button size */
		size?: string;
		chosenDefault: any;
		defaultMeansNoChange?: boolean;
		/** Currently chosen values */
		chosen?: any;
		children?: import('svelte').Snippet;
		onFilterApplied?: (detail: { id: any; chosen: any; extraData: any; choises: any }) => void;
	}

	let {
		extraData,
		id,
		choises = $bindable(),
		title = $bindable(),
		modalTitle = title,
		type = 'radio',
		size = 'xs',
		chosenDefault,
		defaultMeansNoChange = true,
		chosen = $bindable(),
		children,
		onFilterApplied
	}: Props = $props();

	if (choises === undefined) {
		choises = [''];
	}
	if (title === undefined) {
		title = choises[0];
	}
	if (chosen === undefined) {
		chosen = chosenDefault ? JSON.parse(JSON.stringify(chosenDefault)) : [];
	}

	let chosenInternal = $state(JSON.parse(JSON.stringify(chosen)));
	let extraInfo = $state('');
	let extraInfoExtraClass = $state('');
	let btnExtraClass = $state('');
	let titlePreChange = $state(title);
	let isToggle = $state(false);
	if (choises.length == 1) {
		isToggle = true;
	}
	//choises.length == 1 ? (type = 'toggle') : '';
	let reorder = false;
	let chosenPreChange: any;
	let modalVisible = $state(false);
	let chosenNew = [];
	let choisesNew = [];
	let choisesWithId = $state<any[]>([]);
	let shouldToggle = choises.length == 1;
	let showModalOrToggle = () => {
		//		if (choises.length > 1) {
		if (!shouldToggle) {
			//show modal
			modalVisible = true;
			chosenPreChange = chosen;
			titlePreChange = title;
		} else {
			//toggle
			chosen = toggleFilterChoice(type, choises, chosen);
			applyFilter();
		}
	};
	choisesWithId = createChoisesWithId(choises);
	let hideModal = () => {
		chosen = chosenPreChange;
		chosenInternal = chosen;
		modalVisible = false;
	};
	let applyFilter = () => {
		if (!shouldToggle) {
			modalVisible = false;
			chosen = chosenInternal;
		}
		onFilterApplied?.({ id: id, chosen: chosen, extraData, choises: choises });
	};

	const flipDurationMs = 200;
	let dragDisabled = $state(true);

	const syncOrder = () => {
		const result = syncChoiceOrder(choisesWithId, chosenInternal);
		chosenNew = result.chosenNew;
		choisesNew = result.choisesNew;
		chosenInternal = chosenNew;
		choises = choisesNew;
	};

	function handleSort(e: CustomEvent<any>) {
		choisesWithId = e.detail.items;
		syncOrder();

		dragDisabled = true;
	}
	const transformDraggedElement = (
		draggedEl: HTMLElement | undefined,
		data: any,
		index: number | undefined
	) => {
		if (draggedEl) {
			draggedEl
				.querySelector('.dnd-item')
				?.classList.add('bg-accent/20', 'border-2', 'border-accent');
		}
	};

	//
	function handleConsider(e: CustomEvent<any>) {
		const {
			items: newItems,
			info: { source, trigger }
		} = e.detail;
		handleSort(e);
		// Ensure dragging is stopped on drag finish via keyboard
		if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STOPPED) {
			dragDisabled = true;
		}
	}
	function handleFinalize(e: CustomEvent<any>) {
		const {
			items: newItems,
			info: { source }
		} = e.detail;
		handleSort(e);
		// Ensure dragging is stopped on drag finish via pointer (mouse, touch)
		if (source === SOURCES.POINTER) {
			dragDisabled = true;
		}
	}
	function startDrag(e: Event) {
		// preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
		e.preventDefault();
		dragDisabled = false;
	}
	function handleKeyDown(e: KeyboardEvent) {
		if ((e.key === 'Enter' || e.key === ' ') && dragDisabled) dragDisabled = false;
	}

	function handleBtnClick(e: Event) {
		e.stopPropagation();
		e.preventDefault();
		showModalOrToggle();
	}

	//
	$effect(() => {
		if (title) {
			if (type == 'toggle') {
				title = chosen;
			} else {
				type == 'radio' ? (title = chosen) : (extraInfo = `${chosen?.length}`);
			}
		}
	});
	$effect(() => {
		if (chosen?.length > 0) {
			if (type !== 'radio') {
				syncOrder();
			}
			if (!modalVisible) {
				chosenInternal = chosen;
			}

			const classes = getFilterButtonClasses(chosen, chosenDefault, defaultMeansNoChange, isToggle);
			btnExtraClass = classes.btnExtraClass;
			extraInfoExtraClass = classes.extraInfoExtraClass;

			const displayInfo = getFilterDisplayInfo(type, chosen, titlePreChange, isToggle);
			title = displayInfo.title;
			extraInfo = displayInfo.extraInfo;
		} else {
			if (!modalVisible) {
				chosenInternal = chosen;
			}

			const classes = getFilterButtonClasses(chosen, chosenDefault, defaultMeansNoChange, isToggle);
			btnExtraClass = classes.btnExtraClass;
			extraInfoExtraClass = classes.extraInfoExtraClass;

			if (isToggle) {
				title = titlePreChange;
			} else if (type == 'radio') {
				title = titlePreChange;
			} else {
				const displayInfo = getFilterDisplayInfo(type, chosen, titlePreChange, isToggle);
				extraInfo = displayInfo.extraInfo;

				if (defaultMeansNoChange && JSON.stringify(chosenDefault) !== JSON.stringify(chosen)) {
					extraInfo = '0';
				}
			}
			if (type !== 'radio') {
				syncOrder();
			}
		}
	});
</script>

<button
	class="btn btn-{size} {btnExtraClass} flex w-full normal-case"
	onclickcapture={handleBtnClick}
>
	{isToggle ? choises[0] : title}

	{#if extraInfo && !isToggle}
		<div
			class="ml-2 space-y-0 border leading-3 {extraInfoExtraClass} flex space-x-1 rounded-box px-1"
		>
			<p class=" mx-auto my-0 p-0 pt-[1px] text-xs leading-3 text-primary-content">
				{extraInfo}
			</p>
			<p></p>
			<i class="bi bi-chevron-down mx-auto my-0 p-0 pt-[1px] text-xs leading-3"></i>
		</div>
	{/if}

	{#if !isToggle && !extraInfo}
		<i class="bi bi-chevron-down ml-2 text-xs"></i>
	{/if}
</button>
{#if modalVisible}
	<Modal onApply={applyFilter} onCancel={hideModal}>
		<div class="overflow-hidden rounded-box">
			<div class="form-control mt-2 px-2 pt-2">
				{#if type == 'radio'}
					{#each choises as choice}
						<label
							class="label cursor-pointer rounded-box border-2 border-dotted border-transparent font-light transition active:border-base-content/50 active:bg-primary/5 {chosenInternal ==
							choice
								? 'font-extrabold '
								: ''}"
						>
							<span class="label-text text-lg"
								>{choice}
								{#if chosenDefault && chosenDefault == choice}
									<div class="badge badge-xs badge-info">default</div>
								{/if}
							</span>
							<input
								type="radio"
								name="chosen"
								class="radio"
								value={choice}
								bind:group={chosenInternal}
							/>
						</label>
					{/each}{:else if type == 'checkbox'}
					<ul
						use:dndzone={{
							items: choisesWithId,
							dragDisabled,
							flipDurationMs,
							transformDraggedElement
						}}
						onconsider={handleSort}
						onfinalize={handleSort}
						class="rounded-box"
					>
						{#each choisesWithId as choice (choice.id)}
							<div animate:flip={{ duration: flipDurationMs }} class="relative flex">
								<div
									tabindex={dragDisabled ? 0 : -1}
									aria-label="drag-handle"
									role="button"
									class="bi bi-grip-vertical px-2 pt-3"
									style={dragDisabled ? 'cursor: grab' : 'cursor: grabbing'}
									onmousedown={startDrag}
									ontouchstart={startDrag}
									onkeydown={handleKeyDown}
								></div>
								<div
									class="w-full"
									role="button"
									aria-label="choice item"
									tabindex="0"
									onmousedown={() => {
										dragDisabled = true;
									}}
									ontouchstart={() => {
										dragDisabled = true;
									}}
									onkeydown={() => {
										dragDisabled = true;
									}}
								>
									<label
										class="my-[1px] label cursor-pointer rounded-box border-[1px] border-transparent font-light transition-all duration-75 active:border-base-content/50 active:bg-primary/5 {chosenInternal?.includes(
											choice.title
										)
											? 'font-extrabold '
											: ''} dnd-item
									"
									>
										<span class="label-text text-lg">
											{choice.title}

											{#if chosenDefault && chosenDefault.includes(choice.title)}
												<div class="badge badge-xs badge-info">default</div>
											{/if}
										</span>

										<input
											type="checkbox"
											name="chosen"
											class="checkbox"
											value={choice.title}
											bind:group={chosenInternal}
										/>
									</label>
								</div>

								{#if choice[SHADOW_ITEM_MARKER_PROPERTY_NAME]}
									<div
										class="visible absolute top-0 left-0 mx-2 ml-8 w-11/12 rounded-box border-2 border-dotted border-accent/20 py-5 text-primary"
									></div>
								{/if}
							</div>
						{/each}
					</ul>
					<div class="mt-10 flex space-x-2 pr-2"></div>
				{/if}
			</div>
			<div class="text-md mt-2 alert py-2 alert-info shadow-lg">
				<div class="flex space-x-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="my-auto h-6 w-6 flex-shrink-0 stroke-current"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					<div>
						{@render children?.()}
					</div>
				</div>
			</div>
		</div>
	</Modal>
{/if}

<style>
	.noStyles {
		all: unset;
	}
	.custom-shadow-item {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		visibility: visible;
		border: 1px dashed grey;
		background: lightblue;
		opacity: 0.5;
		margin: 0;
	}
</style>
