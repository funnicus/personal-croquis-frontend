<script lang="ts">
	import { onMount } from 'svelte';

	let { file } = $props();
	let current = $state(file);

	const getNewImage = async () => {
		const res = await fetch('/api/images');
		const data = await res.json();
		current = data.file;
	};

	onMount(() => {
		const interval = setInterval(() => getNewImage(), 10000);

		return () => clearInterval(interval);
	});
</script>

<div class="flex h-screen items-center justify-center">
	<div class="w-[40%]">
		<img src={current} alt="croqui ref" />
	</div>
</div>
