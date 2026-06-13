<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	import type { PageProps } from './$types';

	const DEFAULT_TIME = 60;

	let { data }: PageProps = $props();

	let current = $state<string | null>(null);

	let timeOnReset = $state(DEFAULT_TIME);
	let time = $state(DEFAULT_TIME);

	let hours = $state(0);
	let minutes = $state(1);
	let seconds = $state(0);

	let loading = $state(false);
	let stopped = $state(false);
	let fullscreen = $state(false);

	let tags: string[] = $state([]);

	const humanizeTagPart = (value: string) =>
		value
			.split(/[_-]+/)
			.filter(Boolean)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ');

	const getTagParts = (name: string) => {
		const separatorIndex = name.indexOf('/');

		if (separatorIndex === -1) {
			return {
				category: 'uncategorized',
				categoryLabel: 'Uncategorized',
				label: humanizeTagPart(name)
			};
		}

		const category = name.slice(0, separatorIndex);
		const tagName = name.slice(separatorIndex + 1);

		return {
			category,
			categoryLabel: humanizeTagPart(category),
			label: humanizeTagPart(tagName)
		};
	};

	const getGroupedTags = (tagOptions: Array<{ name: string }>) => {
		const groups = new Map<
			string,
			{ category: string; categoryLabel: string; tags: Array<{ name: string; label: string }> }
		>();

		for (const tag of tagOptions) {
			const parts = getTagParts(tag.name);
			const group = groups.get(parts.category) ?? {
				category: parts.category,
				categoryLabel: parts.categoryLabel,
				tags: []
			};

			group.tags.push({ name: tag.name, label: parts.label });
			groups.set(parts.category, group);
		}

		return Array.from(groups.values())
			.map((group) => ({
				...group,
				tags: group.tags.sort((a, b) => a.label.localeCompare(b.label))
			}))
			.sort((a, b) => a.categoryLabel.localeCompare(b.categoryLabel));
	};

	const getTagQuery = () => {
		const params = new URLSearchParams();
		tags.forEach((tag) => params.append('tag', tag));
		return params.toString();
	};

	const toggleFullscreen = () => {
		fullscreen = !fullscreen;
	};

	const getNewImage = async () => {
		if (!browser) return;

		loading = true;
		const tagQuery = getTagQuery();
		const res = await fetch(`/api/images/random${tagQuery ? `?${tagQuery}` : ''}`);

		if (!res.ok) {
			alert('Failed to fetch new image. Have you uploaded images to the blob storage?');
			loading = false;
			return;
		}

		const data = await res.blob();
		const imgeName = res.headers.get('X-Image-Filename');
		if (imgeName) localStorage.setItem('currentImage', imgeName);
		const urlCreator = window.URL || window.webkitURL;

		current = urlCreator.createObjectURL(data);

		loading = false;
	};

	const getImageByName = async (name: string) => {
		loading = true;
		const res = await fetch(`/api${name}`);

		if (!res.ok) {
			alert('Failed to fetch new image');
			loading = false;
			return;
		}

		const data = await res.blob();
		const urlCreator = window.URL || window.webkitURL;
		current = urlCreator.createObjectURL(data);

		loading = false;
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

	const toggleTag = (tag: string) => {
		if (tags.includes(tag)) {
			tags = tags.filter((t) => t !== tag);
		} else {
			tags = [...tags, tag];
		}

		getNewImage();
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

		if (savedTime) time = parseInt(savedTime);
		if (savedTimeOnReset) timeOnReset = parseInt(savedTimeOnReset);
		if (savedStopped) stopped = savedStopped === 'true';
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
	});

	$effect(() => {
		if (time <= 0) {
			getNewImage();
			time = timeOnReset;
		}
	});
</script>

<div class="flex items-center justify-center">
	<div class="flex w-full justify-between gap-15">
		<section class="gap 15 flex w-[30%] flex-col gap-5 p-2 text-center">
			<p class="text-6xl">{new Date(time * 1000).toISOString().slice(11, 19)}</p>
			<button onclick={getNewImage} class="btn btn-primary">SKIP</button>
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
			<div class="overflow-hidden rounded-box border border-base-300 bg-base-100 text-left">
				<div class="flex items-center justify-between border-b border-base-300 px-3 py-2">
					<h2 class="text-sm font-semibold">Tags</h2>
					<span class="badge badge-sm">{tags.length}</span>
				</div>
				<div class="max-h-80 overflow-y-auto">
					<table class="table-pin-rows table table-xs">
						<tbody>
							{#each getGroupedTags(data.tags) as group (group.category)}
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
												checked={tags.includes(tag.name)}
												aria-label={`Filter by ${group.categoryLabel} ${tag.label}`}
												onchange={() => toggleTag(tag.name)}
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
		<section class="flex h-[85vh] w-[70%] max-w-screen items-center justify-center p-2">
			{#if loading}
				<span class="loading loading-xl loading-spinner text-primary"></span>
			{:else}
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
						alt="croqui ref"
					/>
				</button>
			{/if}
		</section>
	</div>
</div>
