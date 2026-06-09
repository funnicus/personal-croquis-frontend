import type { RequestHandler } from './$types';
import { imageService } from '$lib/server/image/image-service';
import { redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

export const GET: RequestHandler = async ({ url }) => {
	const limit = Number(url.searchParams.get('limit')) || 50;

	const { items, nextCursor } = await imageService.getMany(limit);

	return new Response(JSON.stringify({ items, nextCursor }), {
		headers: { 'content-type': 'application/json' },
		status: StatusCodes.OK
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const files = form.getAll('images').filter((v): v is File => v instanceof File);

	if (files.length === 0) {
		return new Response(JSON.stringify({ error: 'No files provided under "images"' }), {
			status: StatusCodes.BAD_REQUEST
		});
	}

	await imageService.createMany(files);

	return redirect(StatusCodes.SEE_OTHER, '/gallery');
};
