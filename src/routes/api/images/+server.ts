import type { RequestHandler } from './$types';
import { randomFile } from '$lib/server/random-file';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = () => {
	return json(randomFile());
};
