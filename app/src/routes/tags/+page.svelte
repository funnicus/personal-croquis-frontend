<script lang="ts">
	import { getResponseErrorMessage } from '$lib/client/http';
	import { getDisplayTag, getGroupedTags } from '$lib/tag-display';
	import { toast } from '$lib/toasts';
	import type { TagWithUsage } from '../../types';
	import type { PageProps } from './$types';

	type UsageFilter = 'all' | 'used' | 'unused';

	let { data }: PageProps = $props();

	let tags: TagWithUsage[] = $derived([...data.tags]);
	let search = $state('');
	let usageFilter: UsageFilter = $state('all');
	let categoryFilter = $state('all');
	let editingTag: string | null = $state(null);
	let editedName = $state('');
	let bulkDeleting = $state(false);
	let pendingDeletes: string[] = $state([]);
	let pendingRenames: string[] = $state([]);

	const categories = $derived(
		Array.from(new Set(tags.map((tag) => getDisplayTag(tag).category))).sort((a, b) =>
			getDisplayTag({ name: a }).label.localeCompare(getDisplayTag({ name: b }).label)
		)
	);

	const visibleTags = $derived(
		tags.filter((tag) => {
			const displayTag = getDisplayTag(tag);
			const query = search.trim().toLowerCase();
			const matchesSearch =
				!query ||
				tag.name.toLowerCase().includes(query) ||
				displayTag.label.toLowerCase().includes(query) ||
				displayTag.categoryLabel.toLowerCase().includes(query);
			const matchesUsage =
				usageFilter === 'all' ||
				(usageFilter === 'used' && tag.usage_count > 0) ||
				(usageFilter === 'unused' && tag.usage_count === 0);
			const matchesCategory = categoryFilter === 'all' || displayTag.category === categoryFilter;

			return matchesSearch && matchesUsage && matchesCategory;
		})
	);

	const startEditing = (tag: TagWithUsage) => {
		editingTag = tag.name;
		editedName = tag.name;
	};

	const stopEditing = () => {
		editingTag = null;
		editedName = '';
	};

	const isDeleting = (tag: TagWithUsage) => pendingDeletes.includes(tag.name);
	const isRenaming = (tag: TagWithUsage) => pendingRenames.includes(tag.name);

	const renameTag = async (tag: TagWithUsage) => {
		const newName = editedName.trim();
		if (!newName || newName === tag.name) {
			stopEditing();
			return;
		}
		if (isRenaming(tag)) return;

		pendingRenames = [...pendingRenames, tag.name];

		try {
			const result = await fetch(`/api/tags/${encodeURIComponent(tag.name)}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ new_name: newName })
			});

			if (!result.ok) {
				toast.error(await getResponseErrorMessage(result, 'Failed to rename tag'));
				return;
			}

			tags = tags.map((item) => (item.name === tag.name ? { ...item, name: newName } : item));
			toast.success('Tag renamed');
			stopEditing();
		} finally {
			pendingRenames = pendingRenames.filter((name) => name !== tag.name);
		}
	};

	const deleteTag = async (tag: TagWithUsage) => {
		if (isDeleting(tag)) return;
		const displayTag = getDisplayTag(tag);
		const message =
			tag.usage_count > 0
				? `Delete "${displayTag.categoryLabel}: ${displayTag.label}" from ${tag.usage_count} image${tag.usage_count === 1 ? '' : 's'}?`
				: `Delete unused tag "${displayTag.categoryLabel}: ${displayTag.label}"?`;

		if (!confirm(message)) return;

		pendingDeletes = [...pendingDeletes, tag.name];

		try {
			const result = await fetch(`/api/tags/${encodeURIComponent(tag.name)}`, {
				method: 'DELETE'
			});

			if (!result.ok) {
				toast.error(await getResponseErrorMessage(result, 'Failed to delete tag'));
				return;
			}

			tags = tags.filter((item) => item.name !== tag.name);
			toast.success('Tag deleted');
		} finally {
			pendingDeletes = pendingDeletes.filter((name) => name !== tag.name);
		}
	};

	const deleteVisibleUnusedTags = async () => {
		if (bulkDeleting) return;
		const unusedTags = visibleTags.filter((tag) => tag.usage_count === 0);
		if (!unusedTags.length) return;
		if (!confirm(`Delete ${unusedTags.length} unused tag${unusedTags.length === 1 ? '' : 's'}?`)) {
			return;
		}

		bulkDeleting = true;

		try {
			for (const tag of unusedTags) {
				const result = await fetch(`/api/tags/${encodeURIComponent(tag.name)}`, {
					method: 'DELETE'
				});

				if (!result.ok) {
					toast.error(
						await getResponseErrorMessage(result, `Failed to delete ${getDisplayTag(tag).label}`)
					);
					return;
				}
			}

			const deleted = new Set(unusedTags.map((tag) => tag.name));
			tags = tags.filter((tag) => !deleted.has(tag.name));
			toast.success(`Deleted ${unusedTags.length} unused tag${unusedTags.length === 1 ? '' : 's'}`);
		} finally {
			bulkDeleting = false;
		}
	};
</script>

<div class="flex h-full flex-col gap-4">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold">Tags</h1>
			<p class="text-sm text-base-content/70">{visibleTags.length} of {tags.length} tags</p>
		</div>
		<button class="btn btn-sm btn-error" onclick={deleteVisibleUnusedTags} disabled={bulkDeleting}>
			{bulkDeleting ? 'Deleting' : 'Delete visible unused'}
		</button>
	</div>

	<div class="grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
		<label class="input w-full">
			<span class="label">Search</span>
			<input bind:value={search} type="search" placeholder="Tag or category" />
		</label>

		<select bind:value={usageFilter} class="select w-full" aria-label="Usage filter">
			<option value="all">All tags</option>
			<option value="used">Used only</option>
			<option value="unused">Unused only</option>
		</select>

		<select bind:value={categoryFilter} class="select w-full" aria-label="Category filter">
			<option value="all">All categories</option>
			{#each categories as category (category)}
				<option value={category}>{getDisplayTag({ name: category }).label}</option>
			{/each}
		</select>
	</div>

	<div class="min-h-0 overflow-auto rounded-box border border-base-300">
		<table class="table-pin-rows table table-sm">
			<thead>
				<tr>
					<th>Tag</th>
					<th class="w-28 text-right">Usage</th>
					<th class="w-56 text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each getGroupedTags(visibleTags) as group (group.category)}
					<tr>
						<th colspan="3" class="bg-base-200 text-xs font-semibold uppercase">
							{group.categoryLabel}
						</th>
					</tr>
					{#each group.tags as displayTag (displayTag.name)}
						{@const tag = tags.find((item) => item.name === displayTag.name)}
						{#if tag}
							<tr>
								<td>
									{#if editingTag === tag.name}
										<input
											class="input input-sm w-full"
											bind:value={editedName}
											disabled={isRenaming(tag)}
											onkeydown={(e) => {
												if (e.key === 'Enter') renameTag(tag);
												if (e.key === 'Escape') stopEditing();
											}}
										/>
									{:else}
										<div class="font-medium">{displayTag.label}</div>
										<div class="text-xs text-base-content/60">{tag.name}</div>
									{/if}
								</td>
								<td class="text-right">
									<span class={`badge badge-sm ${tag.usage_count === 0 ? 'badge-warning' : ''}`}>
										{tag.usage_count}
									</span>
								</td>
								<td class="text-right">
									{#if editingTag === tag.name}
										<button
											class="btn btn-xs btn-primary"
											onclick={() => renameTag(tag)}
											disabled={isRenaming(tag)}>{isRenaming(tag) ? 'Saving' : 'Save'}</button
										>
										<button class="btn btn-xs" onclick={stopEditing} disabled={isRenaming(tag)}
											>Cancel</button
										>
									{:else}
										<button
											class="btn btn-xs"
											onclick={() => startEditing(tag)}
											disabled={isDeleting(tag)}>Rename</button
										>
										<button
											class="btn btn-xs btn-error"
											onclick={() => deleteTag(tag)}
											disabled={isDeleting(tag)}>{isDeleting(tag) ? 'Deleting' : 'Delete'}</button
										>
									{/if}
								</td>
							</tr>
						{/if}
					{/each}
				{/each}
			</tbody>
		</table>
	</div>
</div>
