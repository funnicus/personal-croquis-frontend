import type { RequestHandler } from './$types';
import { imageService } from '$lib/server/services/image-service';

export const GET: RequestHandler = async ({ url }) => {
	const { items, nextCursor } = await imageService.getMany(Number(url.searchParams.get('limit')));

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

	const { ok, failed } = await imageService.createMany(files);

	return new Response(JSON.stringify({ ok, failed }), {
		status: failed.length ? 207 /* Multi-Status */ : 200,
		headers: { 'content-type': 'application/json' }
	});
};
