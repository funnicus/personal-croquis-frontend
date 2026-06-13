<script lang="ts">
	import type { Row, Tag } from '../../types';
	import type { PageProps } from './$types';
	import EditTagsButton from '$lib/components/gallery/EditTagsButton.svelte';
	import clientTagService from '$lib/client/tagService';

	let { data }: PageProps = $props();

	let rows: Row[] = $state([]);
	let tags: Tag[] = $state([]);
	let tableView = $state(true);
	let lightboxSrc: string | null = $state(null);

	$effect(() => {
		rows = [...data.images.items];
		tags = [...data.tags];
	});

	const openLightbox = (src: string) => (lightboxSrc = src);
	const closeLightbox = () => (lightboxSrc = null);

	const remove = async (name: string) => {
		const result = await fetch(`/api${name}`, {
			method: 'DELETE'
		});

		if (!result.ok) {
			alert('Failed to delete image');
			return;
		}

		rows = rows.filter((r) => r.name !== name);
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
		const ok = await clientTagService.addNewTagToImage(row.name, value);
		if (!ok) return;

		rows = rows.map((r) => {
			if (r.id === row.id) {
				return { ...r, tags: [...r.tags, { id: -1, name: value }] };
			}
			return r;
		});

		if (!tags.map((t) => t.name).includes(value)) {
			tags = [...tags, { id: -1, name: value }];
		}
	};

	const removeTag = async (row: Row, tag: string) => {
		const ok = await clientTagService.removeTagFromImage(row.name, tag);
		if (!ok) return;

		rows = rows.map((r) => {
			if (r.id === row.id) {
				return { ...r, tags: r.tags.filter((t) => t.name !== tag) };
			}
			return r;
		});

		const tagUsed = rows.some((r) => r.tags.map((t) => t.name).includes(tag));
		if (!tagUsed) {
			tags = tags.filter((t) => t.name !== tag);
			await clientTagService.removeTag(tag);
		}
	};

	function formatDate(d: Date) {
		return new Intl.DateTimeFormat(undefined, {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(d);
	}
</script>

<div class="flex flex-col gap-5">
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
										/>
									</div>
								</div>
							</td>

							<td>
								<span>{row.name.split('/images/').pop()}</span>
							</td>

							<!-- Uploaded at -->
							<td class="text-sm text-base-content/70">
								{formatDate(row.uploaded_at as Date)}
							</td>

							<!-- Delete -->
							<td class="text-center">
								<EditTagsButton {tags} {row} {toggleTag} {addNewTag} />
								<button
									class="btn btn-sm btn-error"
									onclick={() => remove(row.name)}
									aria-label="Delete row"
									title="Delete"
								>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
