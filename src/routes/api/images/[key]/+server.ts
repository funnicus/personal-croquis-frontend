import type { RequestHandler } from './$types';
import { imageService } from '$lib/server/services/image-service';

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const key = params.key;

	const { stream, stat, contentType } = await imageService.getOne(key);

	console.log(stat.metaData);

	setHeaders({
		'Content-Type': contentType,
		'Content-Length': String(stat.size),
		ETag: stat.etag,
		'Last-Modified': new Date(stat.lastModified).toUTCString(),
		'Cache-Control': 'public, max-age=31536000, immutable'
	});

	return new Response(stream as unknown as ReadableStream);
};
