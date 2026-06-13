import type { RequestHandler } from './$types';
import tagQueries from '$lib/server/image/tag-queries';
import { StatusCodes } from 'http-status-codes';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	await tagQueries.createTag(body.image_name, body.tag_name);

	return new Response(null, { status: StatusCodes.CREATED });
};
