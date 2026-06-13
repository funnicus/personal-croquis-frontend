<script lang="ts">
	import type { TagGroup } from '$lib/tag-display';
	import type { Row } from '../../../types';

	export let groupedTags: TagGroup[] = [];
	export let row: Row;
	export let rowTagNames: Set<string>;
	export let toggleTag: (row: Row, tag: string) => void | Promise<void>;
	export let addNewTag: (row: Row, value: string) => void | Promise<void>;
	export let isTagPending: (row: Row, tag: string) => boolean = () => false;
	export let isAddPending: (row: Row) => boolean = () => false;

	let open = false;
</script>

<details class="dropdown" bind:open>
	<summary class="btn m-1">Edit tags</summary>
	<div class="dropdown-content card-compact menu card right-0.5 z-[1] w-72 bg-base-100 p-3 shadow">
		{#if open}
			<div class="max-h-60 overflow-auto pr-1">
				{#if groupedTags.length === 0}
					<p class="px-1 py-1 text-sm opacity-70">No tags yet.</p>
				{/if}
				{#each groupedTags as group (group.category)}
					<div class="px-2 pt-2 pb-1 text-xs font-semibold uppercase opacity-70">
						{group.categoryLabel}
					</div>
					{#each group.tags as tag (tag.name)}
						<label
							class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-base-200"
						>
							<input
								type="checkbox"
								class="checkbox checkbox-sm"
								checked={rowTagNames.has(tag.name)}
								disabled={isTagPending(row, tag.name)}
								onchange={() => toggleTag(row, tag.name)}
							/>
							<span class="text-sm" title={tag.name}>{tag.label}</span>
						</label>
					{/each}
				{/each}
			</div>

			<div class="divider my-2"></div>

			<div class="join w-full">
				<input
					class="input-bordered input input-sm join-item w-full"
					placeholder="Add new tag"
					disabled={isAddPending(row)}
					onkeydown={(e) => {
						if (e.key === 'Enter' && !isAddPending(row)) addNewTag(row, e.currentTarget.value);
					}}
				/>
				<button
					class="btn join-item btn-sm"
					disabled={isAddPending(row)}
					onclick={(e) =>
						addNewTag(
							row,
							(e.currentTarget.previousElementSibling as HTMLInputElement)?.value || ''
						)}
				>
					{isAddPending(row) ? 'Adding' : 'Add'}
				</button>
			</div>
		{/if}
	</div>
</details>
