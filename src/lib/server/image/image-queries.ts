import { sql } from 'kysely';
import { db } from '../clients/database-client';

const selectMany = async (limit?: number) =>
	await db
		.selectFrom('image')
		.selectAll()
		.orderBy('image.uploaded_at', 'desc')
		.limit(limit ?? 30)
		.execute();

const selectOne = async (key: string) => {
	const image = await db.selectFrom('image').where('image.name', '=', key).selectAll().execute();
	return image[0];
};

// const updateOne = async (key: string, tags: string[]) =>
// 	await db.updateTable('image').set({ tags }).where('image.name', '=', key).execute();

/**
 *  If performance becomes a problem, see https://stackoverflow.com/questions/8674718/best-way-to-select-random-rows-postgresql
 */
const getRandom = async (tags?: string[]) => {
	if (tags?.length === 0) {
		return await db
			.selectFrom('image')
			.selectAll()
			.orderBy(sql`RANDOM()`)
			.limit(1)
			.executeTakeFirst();
	}

	const filteredImages = await db
		.selectFrom('image_tags as it')
		.innerJoin('tag as t', 't.id', 'it.tag_id')
		.where('t.name', 'in', tags ?? [])
		.selectAll()
		.execute();

	return db
		.selectFrom('image')
		.selectAll()
		.where(
			'image.id',
			'in',
			filteredImages.map((fi) => fi.image_id)
		)
		.orderBy(sql`RANDOM()`)
		.limit(1)
		.executeTakeFirst();
};

const createMany = async (images: Array<{ name: string }>) =>
	await db.insertInto('image').values(images).execute();

const createTag = async (image_name: string, tag_name: string) => {
	await db
		.insertInto('tag')
		.values({ name: tag_name })
		.onConflict((oc) => oc.column('name').doNothing())
		.execute();

	await db
		.insertInto('image_tags')
		.values({
			image_id: sql`(SELECT id FROM image WHERE name = ${image_name})`,
			tag_id: sql`(SELECT id FROM tag WHERE name = ${tag_name})`
		})
		.onConflict((oc) => oc.columns(['image_id', 'tag_id']).doNothing())
		.execute();
};

const insertImageTags = async (imageId: number, tagIds: number[]) => {
	const values = tagIds.map((tagId) => ({
		image_id: imageId,
		tag_id: tagId
	}));

	await db.insertInto('image_tags').values(values).execute();
};

const deleteImageTag = async (image: string, tag: string) => {
	const imageRecord = await db
		.selectFrom('image')
		.where('image.name', '=', image)
		.selectAll()
		.executeTakeFirst();

	if (!imageRecord) {
		throw new Error(`Image with name ${image} not found`);
	}

	const tagRecord = await db
		.selectFrom('tag')
		.where('tag.name', '=', tag)
		.selectAll()
		.executeTakeFirst();

	if (!tagRecord) {
		throw new Error(`Tag with name ${tag} not found`);
	}

	const imageId = imageRecord.id;
	const tagId = tagRecord.id;

	await db
		.deleteFrom('image_tags')
		.where('image_id', '=', imageId)
		.where('tag_id', '=', tagId)
		.execute();
};

const getImageTags = async (imageId: number) =>
	await db
		.selectFrom('image_tags')
		.where('image_tags.image_id', '=', imageId)
		.innerJoin('tag', 'tag.id', 'image_tags.tag_id')
		.selectAll()
		.execute();

const getAllTags = async () => await db.selectFrom('tag').selectAll().orderBy('tag.name').execute();

const deleteOne = async (key: string) => {
	await db.deleteFrom('image').where('image.name', '=', key).execute();
};

export const imageQueries = {
	selectOne,
	selectMany,
	getRandom,
	//updateOne,
	createMany,
	createTag,
	insertImageTags,
	deleteImageTag,
	getImageTags,
	getAllTags,
	deleteOne
};
