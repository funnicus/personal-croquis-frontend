import type { RequestHandler } from './$types';
import { imageService } from '$lib/server/image/image-service';

export const GET: RequestHandler = async ({ setHeaders, url }) => {
	const tags = url.searchParams.getAll('tag');

	const result = await imageService.getRandom(tags);

	if (!result) {
		return new Response(JSON.stringify({ error: 'No images found' }), {
			status: 404,
			headers: { 'content-type': 'application/json' }
		});
	}

	const { stream, stat, contentType } = result;

	setHeaders({
		'Content-Type': contentType,
		'Content-Length': String(stat.size)
	});

	return new Response(stream as unknown as ReadableStream);
};
