import type { RequestHandler } from './$types';
import { imageService } from '$lib/server/image/image-service';
import { StatusCodes } from 'http-status-codes';

export const GET: RequestHandler = async ({ setHeaders, url }) => {
	const tags = url.searchParams.getAll('tag');
	const format = url.searchParams.get('format');

	if (format === 'json') {
		const image = await imageService.getRandomRow(tags);

		if (!image) {
			return new Response(JSON.stringify({ error: 'No images found' }), {
				status: StatusCodes.NOT_FOUND,
				headers: { 'content-type': 'application/json' }
			});
		}

		return new Response(JSON.stringify({ image }), {
			status: StatusCodes.OK,
			headers: { 'content-type': 'application/json' }
		});
	}

	const result = await imageService.getRandom(tags);

	if (!result) {
		return new Response(JSON.stringify({ error: 'No images found' }), {
			status: StatusCodes.NOT_FOUND,
			headers: { 'content-type': 'application/json' }
		});
	}

	const { stream, stat, contentType, name } = result;

	setHeaders({
		'Content-Type': contentType,
		'Content-Length': String(stat.size),
		'X-image-Filename': name
	});

	return new Response(stream as unknown as ReadableStream);
};
