<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Tag = { id: number; name: string };

	type Row = {
		id: number;
		name: string;
		uploaded_at: string | Date;
		tags: Tag[];
	};

	let rows: Row[] = $state([...data.images.items]);
	let tags: Tag[] = $state([...data.tags]);
	let tableView = $state(true);

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
		const result = await fetch(`/api${row.name}/tags`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ image_name: row.name, tag_name: value })
		});

		if (!result.ok) {
			alert('Failed to create new tag');
			return;
		}

		row.tags = [...row.tags, { id: -1, name: value }];
	};

	const removeTag = async (row: Row, tag: string) => {
		const result = await fetch(`/api${row.name}/tags`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ image_name: row.name, tag_name: tag })
		});

		if (!result.ok) {
			alert('Failed to remove tag');
			return;
		}

		row.tags = row.tags.filter((t) => t.name !== tag);
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
			{#each rows as item}
				<li>
					<img src={`/api${item.name}`} alt={item.name} />
				</li>
			{/each}
		</section>
	{:else}
		<div>
			<table class="table w-full table-zebra">
				<thead>
					<tr>
						<th class="w-16">Image</th>
						<th>Name</th>
						<th>Tags</th>
						<th class="whitespace-nowrap">Uploaded at</th>
						<th class="w-24 text-center">Actions</th>
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

							<!-- Editable tags -->
							<td>
								<div class="flex flex-wrap items-center gap-2">
									{#each row.tags as tag (tag)}
										<span class="badge badge-outline">{tag.name}</span>
									{/each}

									<details class="dropdown">
										<summary class="btn m-1">Edit tags</summary>
										<div
											class="dropdown-content card-compact menu card z-[1] w-72 bg-base-100 p-3 shadow"
										>
											<div class="max-h-60 overflow-auto pr-1">
												{#if tags.length === 0}
													<p class="px-1 py-1 text-sm opacity-70">No tags yet.</p>
												{/if}
												{#each tags as t (t)}
													<label
														class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-base-200"
													>
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
														addNewTag(
															row,
															(e.currentTarget.previousElementSibling as HTMLInputElement)?.value ||
																''
														)}
												>
													Add
												</button>
											</div>
										</div>
									</details>
								</div>
							</td>

							<!-- Uploaded at -->
							<td class="text-sm text-base-content/70">
								{formatDate(row.uploaded_at as Date)}
							</td>

							<!-- Delete -->
							<td class="text-center">
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
