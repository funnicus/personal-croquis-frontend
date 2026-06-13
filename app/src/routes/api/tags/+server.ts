import type { RequestHandler } from './$types';
import tagQueries from '$lib/server/image/tag-queries';
import { StatusCodes } from 'http-status-codes';

export const GET: RequestHandler = async () => {
	const tags = await tagQueries.getTagsWithUsage();

	return new Response(JSON.stringify({ tags }), {
		headers: { 'content-type': 'application/json' },
		status: StatusCodes.OK
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	await tagQueries.createTag(body.image_name, body.tag_name);

	return new Response(null, { status: StatusCodes.CREATED });
};
