import tagQueries from '$lib/server/image/tag-queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		tags: await tagQueries.getAllTags()
	};
};
