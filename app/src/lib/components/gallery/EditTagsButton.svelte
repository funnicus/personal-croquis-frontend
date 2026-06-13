<script lang="ts">
	import type { Row, Tag } from '../../../types';

	export let tags: Tag[] = [];
	export let row: Row;
	export let toggleTag: (row: Row, tag: string) => void;
	export let addNewTag: (row: Row, value: string) => void;
</script>

<details class="dropdown">
	<summary class="btn m-1">Edit tags</summary>
	<div class="dropdown-content card-compact menu card right-0.5 z-[1] w-72 bg-base-100 p-3 shadow">
		<div class="max-h-60 overflow-auto pr-1">
			{#if tags.length === 0}
				<p class="px-1 py-1 text-sm opacity-70">No tags yet.</p>
			{/if}
			{#each tags as t (t)}
				<label class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-base-200">
					<input
						type="checkbox"
						class="checkbox checkbox-sm"
						checked={row.tags.map((t) => t.name).includes(t.name)}
						onchange={() => toggleTag(row, t.name)}
					/>
					<span class="text-sm">{t.name}</span>
				</label>
			{/each}
		</div>

		<div class="divider my-2"></div>

		<div class="join w-full">
			<input
				class="input-bordered input input-sm join-item w-full"
				placeholder="Add new tag"
				onkeydown={(e) => {
					if (e.key === 'Enter') addNewTag(row, e.currentTarget.value);
				}}
			/>
			<button
				class="btn join-item btn-sm"
				onclick={(e) =>
					addNewTag(row, (e.currentTarget.previousElementSibling as HTMLInputElement)?.value || '')}
			>
				Add
			</button>
		</div>
	</div>
</details>
