<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Bars from '$lib/components/bars.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="drawer">
	<input id="my-drawer" type="checkbox" class="drawer-toggle" />
	<div class="drawer-content">
		<!-- Page content here -->
		<label for="my-drawer" class="drawer-button btn absolute m-5 rounded-full btn-neutral"
			><Bars /></label
		>
	</div>
	<div class="drawer-side">
		<label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
		<ul class="menu min-h-full w-80 bg-base-200 p-4 text-base-content">
			<!-- Sidebar content here -->
			<li><a href="/">✏️ Croquis</a></li>
			<li><a href="/gallery">🖼️ Gallery</a></li>
		</ul>
	</div>
</div>

<main class="p-5">
	{@render children?.()}
</main>
