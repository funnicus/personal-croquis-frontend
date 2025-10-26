<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Bars from '$lib/components/bars.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="h-screen">
	<div class="navbar h-[8%] bg-base-100 shadow-sm">
		<div class="navbar-start">
			<div class="dropdown">
				<div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
					<Bars />
				</div>
				<ul
					tabindex="-1"
					class="dropdown-content menu z-1 mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
				>
					<li><a href="/">✏️ Croquis</a></li>
					<li><a href="/gallery?limit=10">🖼️ Gallery</a></li>
					<li><a href="/upload">📂 Upload</a></li>
				</ul>
			</div>
			<a href="/" class="btn text-xl btn-ghost">Croquis Frontend</a>
		</div>
		<div class="navbar-center hidden lg:flex">
			<ul class="menu menu-horizontal px-1">
				<li><a href="/">✏️ Croquis</a></li>
				<li><a href="/gallery?limit=10">🖼️ Gallery</a></li>
				<li><a href="/upload">📂 Upload</a></li>
			</ul>
		</div>
		<div class="navbar-end"></div>
	</div>

	<main class="h-[92%] p-5">
		{@render children?.()}
	</main>
</div>
