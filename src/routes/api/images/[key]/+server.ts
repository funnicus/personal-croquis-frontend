import type { RequestHandler } from './$types';
import { imageService } from '$lib/server/image/image-service';
import { CACHE_CONTROL_HEADER } from '../../../../constants';

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const key = params.key;

	const { stream, stat, contentType } = await imageService.getOne(`/images/${key}`);

	setHeaders({
		'Content-Type': contentType,
		'Content-Length': String(stat.size),
		ETag: stat.etag,
		'Last-Modified': new Date(stat.lastModified).toUTCString(),
		'Cache-Control': CACHE_CONTROL_HEADER
	});

	return new Response(stream as unknown as ReadableStream);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const key = params.key;

	await imageService.deleteOne(`/images/${key}`);

	return new Response(null, { status: 204 });
};
