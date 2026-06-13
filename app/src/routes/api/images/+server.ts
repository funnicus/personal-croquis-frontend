import type { RequestHandler } from './$types';
import { imageService } from '$lib/server/image/image-service';
import { redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';
import { imageTaggingService } from '$lib/server/image/image-tagging-service';

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

	const results = await imageService.createMany(files);

	await imageTaggingService.enqueueMany(results.images);

	if (results.failed.length > 0) {
		console.error('Some images failed to create.');
	}

	return redirect(StatusCodes.SEE_OTHER, '/gallery');
};
