<section class="flex h-screen flex-col items-center justify-center gap-4">
	<h2 class="text-left text-3xl">Upload Image(s)</h2>
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
