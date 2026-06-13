import type { RequestHandler } from './$types';
import tagQueries from '$lib/server/image/tag-queries';
import { StatusCodes } from 'http-status-codes';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const newName = typeof body.new_name === 'string' ? body.new_name.trim() : '';

	if (!newName) {
		return new Response(JSON.stringify({ error: 'new_name is required' }), {
			headers: { 'content-type': 'application/json' },
			status: StatusCodes.BAD_REQUEST
		});
	}

	const tag = await tagQueries.renameTag(params.name, newName);

	return new Response(JSON.stringify({ tag }), {
		headers: { 'content-type': 'application/json' },
		status: StatusCodes.OK
	});
};

export const DELETE: RequestHandler = async ({ params }) => {
	const tagName = params.name;
	await tagQueries.deleteTag(tagName);

	return new Response(null, { status: StatusCodes.NO_CONTENT });
};
