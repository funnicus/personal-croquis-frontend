import { imageQueries } from '$lib/server/image/image-queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		tags: await imageQueries.getAllTags()
	};
};
