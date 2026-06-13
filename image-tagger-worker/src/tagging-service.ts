import { config } from './config.js';
import { db } from './db.js';
import { createSignedReadUrl } from './blob-storage.js';
import { saveArtisticTags } from './tags.js';
import type { ArtisticTagResponse, TaggingJob } from './types.js';

const markFailed = async (job: TaggingJob, error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);

	await db.transaction().execute(async (trx) => {
		await trx
			.updateTable('image_tagging_job')
			.set({
				status: 'failed',
				error: message,
				finished_at: new Date()
			})
			.where('id', '=', job.jobId)
			.execute();

		await trx
			.updateTable('image')
			.set({ status: 'tagging_failed' })
			.where('id', '=', job.imageId)
			.execute();
	});
};

const processJob = async (job: TaggingJob) => {
	const imageUrl = await createSignedReadUrl(job.imageName);

	const response = await fetch(`${config.imageTaggerApiUrl}/tag-artistic`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			image_url: imageUrl
		})
	});

	if (!response.ok) {
		throw new Error(`Image tagger failed with status ${response.status}: ${await response.text()}`);
	}

	const result = (await response.json()) as ArtisticTagResponse;

	await db.transaction().execute(async (trx) => {
		await saveArtisticTags(trx, job.imageId, result);

		await trx
			.updateTable('image_tagging_job')
			.set({
				status: 'completed',
				finished_at: new Date()
			})
			.where('id', '=', job.jobId)
			.execute();

		await trx
			.updateTable('image')
			.set({ status: 'tagged' })
			.where('id', '=', job.imageId)
			.execute();
	});
};

const processJobs = async (jobs: TaggingJob[]) => {
	for (const job of jobs) {
		try {
			await processJob(job);
		} catch (error) {
			console.error(`Failed to tag image ${job.imageName} (job ${job.jobId})`, error);
			await markFailed(job, error);
		}
	}
};

export const taggingService = { processJobs, processJob, markFailed };
