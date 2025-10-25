import type { RequestHandler } from './$types';
import { imageService } from '$lib/server/services/image-service';

export const GET: RequestHandler = async ({ setHeaders }) => {
	const { stream, stat, contentType } = await imageService.getRandom();

	setHeaders({
		'Content-Type': contentType,
		'Content-Length': String(stat.size)
	});

	return new Response(stream as unknown as ReadableStream);
};
