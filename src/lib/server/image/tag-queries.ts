import { sql } from 'kysely';
import { db } from '../clients/database-client';

const getAllTags = async () => await db.selectFrom('tag').selectAll().orderBy('tag.name').execute();

const createTag = async (image_name: string, tag_name: string) => {
	await db.transaction().execute(async (trx) => {
		await trx
			.insertInto('tag')
			.values({ name: tag_name })
			.onConflict((oc) => oc.column('name').doNothing())
			.execute();

		await trx
			.insertInto('image_tags')
			.values({
				image_id: sql`(SELECT id FROM image WHERE name = ${image_name})`,
				tag_id: sql`(SELECT id FROM tag WHERE name = ${tag_name})`
			})
			.onConflict((oc) => oc.columns(['image_id', 'tag_id']).doNothing())
			.execute();
	});
};

const deleteTag = async (name: string) => {
	await db.deleteFrom('tag').where('name', '=', name).execute();
};

const tagQueries = { createTag, getAllTags, deleteTag };

export default tagQueries;
