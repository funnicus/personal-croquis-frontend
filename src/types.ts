import type { ColumnType, Generated } from 'kysely';

export type ImagesWithTags = ImageTable & {
	tags: Array<TagTable & ImageTagsTable>;
};

export interface Database {
	image: ImageTable;
	image_tags: ImageTagsTable;
	tag: TagTable;
}

export interface ImageTable {
	id: Generated<number>;
	name: string;
	uploaded_at: ColumnType<Date, string | undefined, never>;
}

export interface TagTable {
	id: Generated<number>;
	name: string;
}

export interface ImageTagsTable {
	image_id: number;
	tag_id: number;
}
