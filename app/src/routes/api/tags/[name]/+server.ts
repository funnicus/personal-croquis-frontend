import type { RequestHandler } from './$types';
import tagQueries from '$lib/server/image/tag-queries';
import { StatusCodes } from 'http-status-codes';

export const DELETE: RequestHandler = async ({ params }) => {
	const tagName = params.name;
	await tagQueries.deleteTag(tagName);

	return new Response(null, { status: StatusCodes.NO_CONTENT });
};
