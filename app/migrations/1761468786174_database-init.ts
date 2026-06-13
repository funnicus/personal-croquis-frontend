/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql, type Kysely } from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createType('image_status')
		.asEnum(['uploaded', 'tagging_queued', 'tagging', 'tagged', 'tagging_failed'])
		.execute();

	await db.schema
		.createType('image_tagging_status')
		.asEnum(['queued', 'processing', 'completed', 'failed'])
		.execute();

	await db.schema
		.createTable('image')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('name', 'varchar', (col) => col.notNull().unique())
		.addColumn('status', sql`image_status`, (col) => col.notNull().defaultTo('uploaded'))
		.addColumn('uploaded_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
		.execute();

	await db.schema
		.createTable('tag')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('name', 'varchar', (col) => col.notNull().unique())
		.execute();

	await db.schema
		.createTable('image_tags')
		.addColumn('image_id', 'integer', (col) => col.notNull())
		.addColumn('tag_id', 'integer', (col) => col.notNull())
		.addForeignKeyConstraint('image_tags_image_id_fkey', ['image_id'], 'image', ['id'], (cb) =>
			cb.onDelete('cascade')
		)
		.addForeignKeyConstraint('image_tags_tag_id_fkey', ['tag_id'], 'tag', ['id'], (cb) =>
			cb.onDelete('cascade')
		)
		.addUniqueConstraint('image_tags_image_id_tag_id_key', ['image_id', 'tag_id'])
		.execute();

	await db.schema
		.createTable('image_tagging_job')
		.addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
		.addColumn('image_id', 'integer', (col) => col.notNull())
		.addColumn('status', sql`image_tagging_status`, (col) => col.notNull().defaultTo('queued'))
		.addColumn('attempts', 'integer', (col) => col.notNull().defaultTo(0))
		.addColumn('error', 'text')
		.addColumn('started_at', 'timestamp')
		.addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
		.addColumn('finished_at', 'timestamp')
		.addForeignKeyConstraint(
			'image_tagging_job_image_id_fkey',
			['image_id'],
			'image',
			['id'],
			(cb) => cb.onDelete('cascade')
		)
		.addUniqueConstraint('image_tagging_job_image_id_unique', ['image_id'])
		.execute();
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('image_tagging_job').ifExists().execute();
	await db.schema.dropTable('image_tags').ifExists().execute();
	await db.schema.dropTable('tag').ifExists().execute();
	await db.schema.dropTable('image').ifExists().execute();
	await db.schema.dropType('image_tagging_status').ifExists().execute();
	await db.schema.dropType('image_status').ifExists().execute();
}
