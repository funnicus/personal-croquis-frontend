import type { Transaction } from 'kysely';
import type { ArtisticTagResponse, Database } from './types.js';

const TAG_CATEGORIES = [
	'expression',
	'pose',
	'composition',
	'style',
	'practice_value',
	'mood'
] as const;

export async function saveArtisticTags(
	trx: Transaction<Database>,
	imageId: number,
	result: ArtisticTagResponse
) {
	for (const category of TAG_CATEGORIES) {
		const tags = result[category] ?? [];

		for (const rawTag of tags) {
			const name = normalizeTag(rawTag);
			if (!name) continue;

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
	return tag.trim().toLowerCase().replaceAll(' ', '_');
}
