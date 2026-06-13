import { imageService } from '$lib/server/image/image-service';
import tagQueries from '$lib/server/image/tag-queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const limit = Number(url.searchParams.get('limit')) || 50;
	const selectedTags = url.searchParams.getAll('tag');

	return {
		tags: await tagQueries.getAllTags(),
		selectedTags,
		images: await imageService.getMany({ limit, tags: selectedTags })
	};
};
