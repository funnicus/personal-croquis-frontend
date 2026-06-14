<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { getResponseErrorMessage } from '$lib/client/http';
	import EditTagsButton from '$lib/components/gallery/EditTagsButton.svelte';
	import clientTagService from '$lib/client/tagService';
	import { getDisplayTag, getGroupedTags } from '$lib/tag-display';
	import { toast } from '$lib/toasts';

	import type { PageProps } from './$types';
	import type { Row, Tag } from '../types';

	const DEFAULT_TIME = 60;

	let { data }: PageProps = $props();

	let current = $state<string | null>(null);
	let currentRow: Row | null = $state(null);

	let timeOnReset = $state(DEFAULT_TIME);
	let time = $state(DEFAULT_TIME);

	let hours = $state(0);
	let minutes = $state(1);
	let seconds = $state(0);

	let loading = $state(false);
	let stopped = $state(false);
	let fullscreen = $state(false);

	let availableTags: Tag[] = $derived([...data.tags]);
	let selectedTags: string[] = $state([]);
	let pendingAddRows: number[] = $state([]);
	let pendingTagKeys: string[] = $state([]);
	let imageRequestId = 0;

	const groupedTags = $derived(getGroupedTags(availableTags));

	const getTagQuery = () => {
		const params = new SvelteURLSearchParams();
		params.set('format', 'json');
		selectedTags.forEach((tag) => params.append('tag', tag));
		return params.toString();
	};

	const toggleFullscreen = () => {
		fullscreen = !fullscreen;
	};

	const getNewImage = async () => {
		if (!browser) return;
		if (loading) return;

		const requestId = imageRequestId + 1;
		imageRequestId = requestId;
		loading = true;

		try {
			const res = await fetch(`/api/images/random?${getTagQuery()}`);

			if (requestId !== imageRequestId) return;

			if (!res.ok) {
				toast.error(
					await getResponseErrorMessage(
						res,
						'Failed to fetch new image. Have you uploaded images to the blob storage?'
					)
				);
				return;
			}

			const body = (await res.json()) as { image: Row };

			if (requestId !== imageRequestId) return;

			currentRow = body.image;
			current = `/api${body.image.name}`;
			localStorage.setItem('currentImage', body.image.name);
		} catch {
			toast.error('Failed to fetch new image');
		} finally {
			if (requestId === imageRequestId) {
				loading = false;
			}
		}
	};

	const getImageByName = async (name: string) => {
		if (loading) return;
		loading = true;
		try {
			const res = await fetch(`/api${name}/tags`);

			if (!res.ok) {
				toast.error(await getResponseErrorMessage(res, 'Failed to fetch image'));
				return;
			}

			currentRow = (await res.json()) as Row;
			current = `/api${currentRow.name}`;
		} catch {
			toast.error('Failed to fetch image');
		} finally {
			loading = false;
		}
	};

	const setTime = () => {
		time = seconds + 60 * minutes + 60 * 60 * hours;
		timeOnReset = time;
	};

	const stopTime = () => {
		stopped = true;
	};

	const resumeTime = () => {
		stopped = false;
	};

	const toggleFilterTag = (tag: string) => {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}

		getNewImage();
	};

	const tagKey = (row: Row, tag: string) => `${row.id}:${tag}`;
	const getRowTagNames = (row: Row) => new Set(row.tags.map((tag) => tag.name));
	const isAddPending = (row: Row) => pendingAddRows.includes(row.id);
	const isTagPending = (row: Row, tag: string) => pendingTagKeys.includes(tagKey(row, tag));

	const toggleImageTag = async (row: Row, tag: string) => {
		if (row.tags.map((t) => t.name).includes(tag)) {
			await removeTag(row, tag);
		} else {
			await addNewTag(row, tag);
		}
	};

	const addNewTag = async (row: Row, value: string) => {
		const tagName = value.trim();
		if (!tagName || isAddPending(row)) return;
		pendingAddRows = [...pendingAddRows, row.id];

		try {
			const result = await clientTagService.addNewTagToImage(row.name, tagName);
			if (!result.ok) {
				toast.error(result.message);
				return;
			}

			currentRow = {
				...row,
				tags: row.tags.some((tag) => tag.name === tagName)
					? row.tags
					: [...row.tags, { id: -1, name: tagName }]
			};

			if (!availableTags.map((tag) => tag.name).includes(tagName)) {
				availableTags = [...availableTags, { id: -1, name: tagName }];
			}
		} finally {
			pendingAddRows = pendingAddRows.filter((id) => id !== row.id);
		}
	};

	const removeTag = async (row: Row, tag: string) => {
		const key = tagKey(row, tag);
		if (pendingTagKeys.includes(key)) return;
		pendingTagKeys = [...pendingTagKeys, key];

		try {
			const result = await clientTagService.removeTagFromImage(row.name, tag);
			if (!result.ok) {
				toast.error(result.message);
				return;
			}

			currentRow = {
				...row,
				tags: row.tags.filter((item) => item.name !== tag)
			};
		} finally {
			pendingTagKeys = pendingTagKeys.filter((item) => item !== key);
		}
	};

	onMount(() => {
		if (!browser) return;

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) {
				e.preventDefault();
				if (stopped) resumeTime();
				else stopTime();
			}
		};

		window.addEventListener('keydown', onKeyDown);

		const savedCurrent = localStorage.getItem('currentImage');
		const savedTime = localStorage.getItem('time');
		const savedTimeOnReset = localStorage.getItem('timeOnReset');
		const savedStopped = localStorage.getItem('stopped');
		const savedSelectedTags = localStorage.getItem('selectedTags');

		if (savedTime) time = parseInt(savedTime);
		if (savedTimeOnReset) timeOnReset = parseInt(savedTimeOnReset);
		if (savedStopped) stopped = savedStopped === 'true';
		if (savedSelectedTags) selectedTags = JSON.parse(savedSelectedTags);

		if (savedCurrent) {
			getImageByName(savedCurrent);
		} else {
			getNewImage();
		}

		const interval = setInterval(() => (stopped || time <= 0 ? null : time--), 1000);

		return () => {
			clearInterval(interval);
			window.removeEventListener('keydown', onKeyDown);
		};
	});

	onDestroy(() => {
		if (!browser) return;

		localStorage.setItem('time', time.toString());
		localStorage.setItem('timeOnReset', timeOnReset.toString());
		localStorage.setItem('stopped', stopped.toString());
		localStorage.setItem('selectedTags', JSON.stringify(selectedTags));
	});

	$effect(() => {
		if (time <= 0) {
			time = timeOnReset;
			untrack(() => {
				void getNewImage();
			});
		}
	});
</script>

<div class="flex h-full min-h-0 items-center justify-center overflow-hidden">
	<div class="flex h-full min-h-0 w-full justify-between gap-15">
		<section
			class="gap 15 flex min-h-0 w-[30%] flex-col gap-5 overflow-y-auto p-2 text-center [&>*]:shrink-0"
		>
			<p class="text-6xl">{new Date(time * 1000).toISOString().slice(11, 19)}</p>
			<button onclick={getNewImage} class="btn btn-primary" disabled={loading}>
				{loading ? 'LOADING' : 'SKIP'}
			</button>
			<div class="flex">
				<input id="h" type="number" class="input" bind:value={hours} min="0" /><span
					class="text-2xl">:</span
				>
				<input id="m" type="number" class="input" bind:value={minutes} min="0" max="59" /><span
					class="text-2xl">:</span
				>
				<input id="s" type="number" class="input" bind:value={seconds} min="0" max="59" />
			</div>
			<button onclick={setTime} class="secondary btn">Set time</button>
			{#if stopped}
				<button onclick={resumeTime} class="btn btn-warning">Resume</button>
			{:else}
				<button onclick={stopTime} class="btn btn-error">Stop</button>
			{/if}
			{#if currentRow}
				<div class="rounded-box border border-base-300 bg-base-100 text-left">
					<div class="flex items-center justify-between gap-2 border-b border-base-300 px-3 py-2">
						<div>
							<h2 class="text-sm font-semibold">Current image</h2>
							<p class="truncate text-xs text-base-content/60">
								{currentRow.name.split('/images/').pop()}
							</p>
						</div>
						<EditTagsButton
							{groupedTags}
							row={currentRow}
							rowTagNames={getRowTagNames(currentRow)}
							toggleTag={toggleImageTag}
							{addNewTag}
							{isTagPending}
							{isAddPending}
						/>
					</div>
					<div class="flex flex-wrap gap-1 p-3">
						{#if currentRow.tags.length}
							{#each currentRow.tags as tag (tag.name)}
								{@const displayTag = getDisplayTag(tag)}
								<span class="badge badge-outline badge-sm" title={tag.name}>
									{displayTag.categoryLabel}: {displayTag.label}
								</span>
							{/each}
						{:else}
							<p class="text-sm text-base-content/60">No tags.</p>
						{/if}
					</div>
				</div>
			{/if}
			<div class="overflow-hidden rounded-box border border-base-300 bg-base-100 text-left">
				<div class="flex items-center justify-between border-b border-base-300 px-3 py-2">
					<h2 class="text-sm font-semibold">Tags</h2>
					<span class="badge badge-sm">{selectedTags.length}</span>
				</div>
				<div class="max-h-80 overflow-y-auto">
					<table class="table-pin-rows table table-xs">
						<tbody>
							{#each groupedTags as group (group.category)}
								<tr>
									<th colspan="2" class="bg-base-200 text-xs font-semibold uppercase">
										{group.categoryLabel}
									</th>
								</tr>
								{#each group.tags as tag (tag.name)}
									<tr class="hover:bg-base-200">
										<td class="w-8">
											<input
												type="checkbox"
												class="checkbox checkbox-xs"
												checked={selectedTags.includes(tag.name)}
												disabled={loading}
												aria-label={`Filter by ${group.categoryLabel} ${tag.label}`}
												onchange={() => toggleFilterTag(tag.name)}
											/>
										</td>
										<td class="text-sm">{tag.label}</td>
									</tr>
								{/each}
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</section>
		<section class="flex min-h-0 w-[70%] max-w-screen items-center justify-center p-2">
			{#if loading}
				<span class="loading loading-xl loading-spinner text-primary"></span>
			{:else if current}
				<button
					class="{fullscreen
						? 'fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black'
						: 'flex h-full w-full items-center justify-center'} border-none bg-transparent p-0"
					onclick={toggleFullscreen}
					aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
				>
					<img
						src={current}
						class={fullscreen
							? 'h-screen w-screen cursor-zoom-out object-contain'
							: 'h-[inherit] max-h-[inherit] w-[inherit] max-w-[inherit] cursor-zoom-in object-scale-down'}
						alt="croquis ref"
					/>
				</button>
			{:else}
				<p class="text-base-content/60">No image loaded.</p>
			{/if}
		</section>
	</div>
</div>
