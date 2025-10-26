import { imageQueries } from '$lib/server/image/image-queries';
import { imageService } from '$lib/server/image/image-service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const limit = Number(url.searchParams.get('limit')) || 50;

	return {
		tags: await imageQueries.getAllTags(),
		images: await imageService.getMany(limit)
	};
};
