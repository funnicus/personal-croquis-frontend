import { imageService } from '$lib/server/image/image-service';
import tagQueries from '$lib/server/image/tag-queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const limit = Number(url.searchParams.get('limit')) || 1000;

	return {
		tags: await tagQueries.getAllTags(),
		images: await imageService.getMany(limit)
	};
};
