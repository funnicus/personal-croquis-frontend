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

	const toggleFullscreen = () => {
		fullscreen = !fullscreen;
	};

	const getNewImage = async () => {
		if (!browser) return;

		loading = true;
		const res = await fetch(`/api/images/random?${tags.map((t) => `tag=${t}`).join('&')}`);

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
			<details class="dropdown">
				<summary class="btn m-1">Tags</summary>
				<ul class="dropdown-content menu z-1 w-52 rounded-box bg-base-100 p-2 shadow-sm">
					{#each data.tags as tag (tag)}
						<li>
							<label
								class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-base-200"
							>
								<input
									type="checkbox"
									class="checkbox checkbox-sm"
									checked={tags.includes(tag.name)}
									onchange={() => toggleTag(tag.name)}
								/>
								<span class="text-sm">{tag.name}</span>
							</label>
						</li>
					{/each}
				</ul>
			</details>
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
