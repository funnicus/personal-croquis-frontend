import type { ColumnType, Generated } from 'kysely';

export interface Database {
	image: ImageTable;
	image_tags: ImageTagsTable;
	tag: TagTable;
	image_tagging_job: ImageTaggingJobTable;
}

export interface ImageTable {
	id: Generated<number>;
	name: string;
	status: ImageStatus;
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

export interface ImageTaggingJobTable {
	id: Generated<string>;
	image_id: number;
	status: Generated<ImageTaggingStatus>;
	attempts: Generated<number>;
	error: ColumnType<string | null, string | null | undefined, string | null>;
	started_at: ColumnType<Date | null, Date | null | undefined, Date | null>;
	created_at: Generated<Date>;
	finished_at: ColumnType<Date | null, Date | null | undefined, Date | null>;
}

export type ImageStatus = 'uploaded' | 'tagging_queued' | 'tagging' | 'tagged' | 'tagging_failed';

export type ImageTaggingStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type TaggingJob = {
	jobId: string;
	imageId: number;
	imageName: string;
};

export type ArtisticTagResponse = {
	[category: string]: string[] | string | null | undefined;
	expression: string[];
	pose: string[];
	composition: string[];
	style: string[];
	practice_value: string[];
	mood: string[];
	notes?: string | null;
};
