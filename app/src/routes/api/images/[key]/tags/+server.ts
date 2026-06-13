import type { RequestHandler } from './$types';
import imageQueries from '$lib/server/image/image-queries';
import { imageService } from '$lib/server/image/image-service';
import { StatusCodes } from 'http-status-codes';

export const GET: RequestHandler = async ({ params }) => {
	const image = await imageService.getOneRow(`/images/${params.key}`);

	if (!image) {
		return new Response(JSON.stringify({ error: 'Image not found' }), {
			status: StatusCodes.NOT_FOUND,
			headers: { 'content-type': 'application/json' }
		});
	}

	return new Response(JSON.stringify(image), {
		status: StatusCodes.OK,
		headers: { 'content-type': 'application/json' }
	});
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	await imageQueries.deleteImageTag(body.image_name, body.tag_name);

	return new Response(null, { status: StatusCodes.NO_CONTENT });
};
