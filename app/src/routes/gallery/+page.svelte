<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { ImageCursor, Row, Tag } from '../../types';
	import type { PageProps } from './$types';
	import EditTagsButton from '$lib/components/gallery/EditTagsButton.svelte';
	import { getResponseErrorMessage } from '$lib/client/http';
	import clientTagService from '$lib/client/tagService';
	import { getDisplayTag, getGroupedTags } from '$lib/tag-display';
	import { toast } from '$lib/toasts';

	let { data }: PageProps = $props();

	let rows: Row[] = $state([]);
	let tags: Tag[] = $state([]);
	let selectedTags: string[] = $state([]);
	let nextCursor: ImageCursor | null = $state(null);
	let tableView = $state(true);
	let lightboxSrc: string | null = $state(null);
	let deletingImages: string[] = $state([]);
	let loadingMore = $state(false);
	let pendingAddRows: number[] = $state([]);
	let pendingTagKeys: string[] = $state([]);

	const groupedTags = $derived(getGroupedTags(tags));
	const rowTagNameSets = $derived(
		new Map(rows.map((row) => [row.id, new Set(row.tags.map((tag) => tag.name))]))
	);

	$effect(() => {
		rows = [...data.images.items];
		tags = [...data.tags];
		selectedTags = [...data.selectedTags];
		nextCursor = data.images.nextCursor;
	});

	const openLightbox = (src: string) => (lightboxSrc = src);
	const closeLightbox = () => (lightboxSrc = null);

	const tagKey = (row: Row, tag: string) => `${row.id}:${tag}`;
	const isAddPending = (row: Row) => pendingAddRows.includes(row.id);
	const isDeletePending = (name: string) => deletingImages.includes(name);
	const isTagPending = (row: Row, tag: string) => pendingTagKeys.includes(tagKey(row, tag));

	const formatCursorUploadedAt = (cursor: ImageCursor) =>
		cursor.uploaded_at instanceof Date ? cursor.uploaded_at.toISOString() : cursor.uploaded_at;

	const getImageQuery = (cursor?: ImageCursor | null) => {
		const params = new SvelteURLSearchParams();
		params.set('limit', '50');
		selectedTags.forEach((tag) => params.append('tag', tag));

		if (cursor) {
			params.set('cursorUploadedAt', formatCursorUploadedAt(cursor));
			params.set('cursorId', String(cursor.id));
		}

		return params;
	};

	const applyTagFilters = async (nextSelectedTags: string[]) => {
		const params = new SvelteURLSearchParams();
		nextSelectedTags.forEach((tag) => params.append('tag', tag));
		const query = params.toString();
		const galleryPath = resolve('/gallery');
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(`${galleryPath}${query ? `?${query}` : ''}`, {
			keepFocus: true,
			noScroll: true
		});
	};

	const toggleTagFilter = async (tag: string) => {
		const nextSelectedTags = selectedTags.includes(tag)
			? selectedTags.filter((item) => item !== tag)
			: [...selectedTags, tag];

		await applyTagFilters(nextSelectedTags);
	};

	const clearTagFilters = async () => {
		await applyTagFilters([]);
	};

	const loadMore = async () => {
		if (!nextCursor || loadingMore) return;
		loadingMore = true;

		try {
			const params = getImageQuery(nextCursor);
			const result = await fetch(`/api/images?${params.toString()}`);

			if (!result.ok) {
				toast.error(await getResponseErrorMessage(result, 'Failed to load more images'));
				return;
			}

			const body = (await result.json()) as {
				items: Row[];
				nextCursor: ImageCursor | null;
			};

			rows = [...rows, ...body.items];
			nextCursor = body.nextCursor;
		} catch {
			toast.error('Failed to load more images');
		} finally {
			loadingMore = false;
		}
	};

	const remove = async (name: string) => {
		if (isDeletePending(name)) return;
		deletingImages = [...deletingImages, name];

		try {
			const result = await fetch(`/api${name}`, {
				method: 'DELETE'
			});

			if (!result.ok) {
				toast.error(await getResponseErrorMessage(result, 'Failed to delete image'));
				return;
			}

			rows = rows.filter((r) => r.name !== name);
		} finally {
			deletingImages = deletingImages.filter((item) => item !== name);
		}
	};

	// toggle a tag on a row
	const toggleTag = async (row: Row, tag: string) => {
		if (row.tags.map((t) => t.name).includes(tag)) {
			await removeTag(row, tag);
		} else {
			await addNewTag(row, tag);
		}
	};

	// add a brand-new tag (to the row + notify parent to add globally)
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

			rows = rows.map((r) => {
				if (r.id === row.id) {
					return { ...r, tags: [...r.tags, { id: -1, name: tagName }] };
				}
				return r;
			});

			if (!tags.map((t) => t.name).includes(tagName)) {
				tags = [...tags, { id: -1, name: tagName }];
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

			rows = rows.map((r) => {
				if (r.id === row.id) {
					return { ...r, tags: r.tags.filter((t) => t.name !== tag) };
				}
				return r;
			});
		} finally {
			pendingTagKeys = pendingTagKeys.filter((item) => item !== key);
		}
	};

	function formatDate(d: Date | string) {
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(d));
	}
</script>

<div class="flex flex-col gap-5">
	<div class="rounded-box border border-base-300 bg-base-100">
		<div
			class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 px-3 py-2"
		>
			<div>
				<h2 class="text-sm font-semibold">Filters</h2>
				<p class="text-xs text-base-content/60">
					{selectedTags.length ? `${selectedTags.length} selected` : 'All images'}
				</p>
			</div>
			<button class="btn btn-xs" onclick={clearTagFilters} disabled={!selectedTags.length}
				>Clear</button
			>
		</div>
		<div class="max-h-64 overflow-y-auto">
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
										aria-label={`Filter by ${group.categoryLabel} ${tag.label}`}
										onchange={() => toggleTagFilter(tag.name)}
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

	<div class="join grid grid-cols-2 gap-1">
		<button
			class={`btn join-item ${tableView ? 'btn-outline' : ''}`}
			onclick={() => (tableView = true)}>Table View</button
		>
		<button
			class={`btn join-item ${!tableView ? 'btn-outline' : ''}`}
			onclick={() => (tableView = false)}>Gallery View</button
		>
	</div>
	{#if !tableView}
		<section class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 xl:gap-8">
			{#each rows as item (item.name)}
				<button
					class="cursor-pointer border-0 bg-transparent p-0"
					onclick={() => openLightbox(`/api${item.name}`)}
					aria-label={`View ${item.name} fullscreen`}
				>
					<img
						src={`/api${item.name}`}
						alt={item.name}
						loading="lazy"
						decoding="async"
						class="transition-opacity duration-200 hover:opacity-80"
					/>
				</button>
			{/each}
		</section>

		{#if lightboxSrc}
			<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
				<button
					class="absolute inset-0 h-full w-full bg-black/80"
					onclick={closeLightbox}
					aria-label="Close fullscreen"
				></button>
				<button
					class="btn absolute top-4 right-4 btn-circle text-xl text-white btn-ghost"
					onclick={closeLightbox}
					aria-label="Close fullscreen"
				>
					✕
				</button>
				<img
					src={lightboxSrc}
					alt="Fullscreen view"
					class="relative max-h-full max-w-full rounded-lg object-contain shadow-2xl"
				/>
			</div>
		{/if}
	{:else}
		<div>
			<table class="table w-full table-zebra">
				<thead>
					<tr>
						<th class="w-16">Image</th>
						<th>Name</th>
						<th class="whitespace-nowrap">Uploaded at</th>
						<th class="w-68 text-center">Actions</th>
					</tr>
				</thead>

				<tbody>
					{#each rows as row (row.id)}
						<tr>
							<!-- Image -->
							<td>
								<div class="avatar">
									<div class="mask h-12 w-12 mask-squircle">
										<img
											src={`/api${row.name}`}
											alt={`${row.name} thumbnail`}
											aria-label={`${row.name} thumbnail`}
											loading="lazy"
											decoding="async"
										/>
									</div>
								</div>
							</td>

							<td>
								<span>{row.name.split('/images/').pop()}</span>
								{#if row.tags.length}
									<div class="mt-2 flex flex-wrap gap-1">
										{#each row.tags as tag (tag.name)}
											{@const displayTag = getDisplayTag(tag)}
											<span class="badge badge-outline badge-sm" title={tag.name}>
												{displayTag.categoryLabel}: {displayTag.label}
											</span>
										{/each}
									</div>
								{/if}
							</td>

							<!-- Uploaded at -->
							<td class="text-sm text-base-content/70">
								{formatDate(row.uploaded_at as Date)}
							</td>

							<!-- Delete -->
							<td class="text-center">
								<EditTagsButton
									{groupedTags}
									{row}
									rowTagNames={rowTagNameSets.get(row.id) ?? new Set()}
									{toggleTag}
									{addNewTag}
									{isTagPending}
									{isAddPending}
								/>
								<button
									class="btn btn-sm btn-error"
									onclick={() => remove(row.name)}
									disabled={isDeletePending(row.name)}
									aria-label="Delete row"
									title="Delete"
								>
									{isDeletePending(row.name) ? 'Deleting' : 'Delete'}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if nextCursor}
		<div class="flex justify-center">
			<button class="btn btn-outline" onclick={loadMore} disabled={loadingMore}>
				{loadingMore ? 'Loading' : 'Load more'}
			</button>
		</div>
	{/if}
</div>
