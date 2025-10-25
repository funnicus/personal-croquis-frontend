<script lang="ts">
	import { onMount } from 'svelte';

	let current = $state<string | null>(null);

	let time = $state(0);
	let timeOnReset = $state(60);

	let hours = $state(0);
	let minutes = $state(1);
	let seconds = $state(0);

	let loading = $state(true);
	let stopped = $state(false);

	const getNewImage = async () => {
		loading = true;
		const res = await fetch('/api/images/random');
		const data = await res.blob();
		const urlCreator = window.URL || window.webkitURL;
		current = urlCreator.createObjectURL(data);
		time = timeOnReset;
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

	onMount(() => {
		const interval = setInterval(() => (stopped || time <= 0 ? null : time--), 1000);

		return () => clearInterval(interval);
	});

	$effect(() => {
		if (time <= 0) {
			getNewImage();
		}
	});
</script>

<div class="flex h-screen items-center justify-center">
	<div class="flex h-[90%] gap-15">
		<section class="gap 15 flex w-[25vw] flex-col gap-5 p-2 text-center">
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
		</section>
		<section class="flex w-[70vw] items-center justify-center">
			{#if loading}
				<span class="loading loading-xl loading-spinner text-primary"></span>
			{:else}
				<img class="h-[100%]" src={current} alt="croqui ref" />
			{/if}
		</section>
	</div>
</div>
