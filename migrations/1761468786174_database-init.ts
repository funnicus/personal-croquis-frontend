/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql, type Kysely } from 'kysely';

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('image')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('name', 'varchar', (col) => col.notNull().unique())
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
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('image_tags').ifExists().execute();
	await db.schema.dropTable('tag').ifExists().execute();
	await db.schema.dropTable('image').ifExists().execute();
}
