import type { Transaction } from 'kysely';
import type { ArtisticTagResponse, Database } from './types.js';

export async function saveArtisticTags(
	trx: Transaction<Database>,
	imageId: number,
	result: ArtisticTagResponse
) {
	for (const [rawCategory, tags] of getTagCategories(result)) {
		const categoryName = normalizeCategory(rawCategory);
		if (!categoryName) continue;

		for (const rawTag of tags) {
			const tagName = normalizeTag(rawTag);
			if (!tagName) continue;

			const name = `${categoryName}/${tagName}`;

			const tag = await trx
				.insertInto('tag')
				.values({ name })
				.onConflict((oc) => oc.column('name').doUpdateSet({ name }))
				.returning(['id'])
				.executeTakeFirstOrThrow();

			await trx
				.insertInto('image_tags')
				.values({
					image_id: imageId,
					tag_id: tag.id
				})
				.onConflict((oc) => oc.columns(['image_id', 'tag_id']).doNothing())
				.execute();
		}
	}
}

export function normalizeTag(tag: string) {
	return tag.trim().toLowerCase().replace(/[\\/]+/g, '_').replace(/\s+/g, '_');
}

export function normalizeCategory(category: string) {
	return normalizeTag(category);
}

function getTagCategories(result: ArtisticTagResponse) {
	return Object.entries(result).filter((entry): entry is [string, string[]] =>
		Array.isArray(entry[1])
	);
}
