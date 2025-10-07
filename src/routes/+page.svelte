<script lang="ts">
	import { onMount } from 'svelte';

	let { data } = $props();
	let current = $state(data.file);
	let time = $state(60);
	let timeOnReset = $state(60);
	let loading = $state(false);
	let hours = $state(0);
	let minutes = $state(1);
	let seconds = $state(0);

	const getNewImage = async () => {
		loading = true;
		const res = await fetch('/api/images');
		const data = await res.json();
		current = data.file;
		time = timeOnReset;
		loading = false;
	};

	const setTime = () => {
		time = seconds + 60 * minutes + 60 * 60 * hours;
		timeOnReset = time;
	};

	onMount(() => {
		const interval = setInterval(() => time--, 1000);

		return () => clearInterval(interval);
	});

	$effect(() => {
		if (time == 0) {
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
		</section>
		<section class="w-[70vw]">
			<img class="mx-auto h-[100%]" src={current} alt="croqui ref" />
		</section>
	</div>
</div>
