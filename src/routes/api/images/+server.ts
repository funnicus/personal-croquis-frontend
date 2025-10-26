import type { RequestHandler } from './$types';
import { imageService } from '$lib/server/image/image-service';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const limit = Number(url.searchParams.get('limit')) || 50;

	const { items, nextCursor } = await imageService.getMany(limit);

	return new Response(JSON.stringify({ items, nextCursor }), {
		headers: { 'content-type': 'application/json' }
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const files = form.getAll('images').filter((v): v is File => v instanceof File);

	if (files.length === 0) {
		return new Response(JSON.stringify({ error: 'No files provided under "images"' }), {
			status: 400
		});
	}

	await imageService.createMany(files);

	return redirect(303, '/gallery');
};
