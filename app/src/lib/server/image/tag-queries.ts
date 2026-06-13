import { sql } from 'kysely';
import { db } from '../clients/database-client';

const getAllTags = async () => await db.selectFrom('tag').selectAll().orderBy('tag.name').execute();

const getTagsWithUsage = async () =>
	await db
		.selectFrom('tag')
		.leftJoin('image_tags', 'image_tags.tag_id', 'tag.id')
		.select(['tag.id', 'tag.name', sql<number>`count(image_tags.image_id)::int`.as('usage_count')])
		.groupBy(['tag.id', 'tag.name'])
		.orderBy('tag.name')
		.execute();

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

const renameTag = async (name: string, newName: string) => {
	const renamed = await db
		.updateTable('tag')
		.set({ name: newName })
		.where('name', '=', name)
		.returning(['id', 'name'])
		.executeTakeFirst();

	if (!renamed) {
		throw new Error(`Tag with name ${name} not found`);
	}

	return renamed;
};

const tagQueries = { createTag, deleteTag, getAllTags, getTagsWithUsage, renameTag };

export default tagQueries;
