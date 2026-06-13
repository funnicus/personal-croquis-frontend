import type { RequestHandler } from './$types';
import imageQueries from '$lib/server/image/image-queries';
import { StatusCodes } from 'http-status-codes';

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	await imageQueries.deleteImageTag(body.image_name, body.tag_name);

	return new Response(null, { status: StatusCodes.NO_CONTENT });
};
