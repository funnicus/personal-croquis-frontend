import type { RequestHandler } from './$types';
import { imageQueries } from '$lib/server/image/image-queries';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	await imageQueries.createTag(body.image_name, body.tag_name);

	return new Response(null, { status: 201 });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	await imageQueries.deleteImageTag(body.image_name, body.tag_name);

	return new Response(null, { status: 204 });
};
