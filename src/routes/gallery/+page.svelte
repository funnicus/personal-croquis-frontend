<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<section class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 xl:gap-8">
	{#each data.items as item}
		<li>
			<img src={`/api/${item}`} alt={item} />
		</li>
	{/each}
</section>
<section class="flex h-screen items-center justify-center">
	<h2>Upload Image(s)</h2>
	<form
		method="POST"
		class="flex w-[500px] flex-col gap-4"
		action="/api/images"
		enctype="multipart/form-data"
	>
		<input
			type="file"
			class="file-input file-input-primary"
			name="images"
			accept="image/*"
			multiple
			required
		/>
		<button class="btn btn-primary" type="submit">Upload</button>
	</form>
</section>
