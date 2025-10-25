import { imageService } from '$lib/server/services/image-service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) =>
	await imageService.getMany(Number(url.searchParams.get('limit')));
