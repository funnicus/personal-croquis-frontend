import { config } from './config.js';
import { db } from './db.js';
import { taggingService } from './tagging-service.js';
import type { TaggingJob } from './types.js';

let running = true;

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Atomically claims a batch of queued jobs: marks them `processing` and their
 * images `tagging`, so concurrent workers don't pick up the same jobs.
 */
async function claimJobs(): Promise<TaggingJob[]> {
	return await db.transaction().execute(async (trx) => {
		const jobs = await trx
			.selectFrom('image_tagging_job as job')
			.innerJoin('image', 'image.id', 'job.image_id')
			.select(['job.id as jobId', 'job.image_id as imageId', 'image.name as imageName'])
			.where('job.status', '=', 'queued')
			.orderBy('job.created_at', 'asc')
			.limit(config.batchSize)
			.execute();

		if (jobs.length === 0) return [];

		const jobIds = jobs.map((job) => job.jobId);
		const imageIds = jobs.map((job) => job.imageId);

		await trx
			.updateTable('image_tagging_job')
			.set({
				status: 'processing',
				started_at: new Date(),
				attempts: (eb) => eb('attempts', '+', 1)
			})
			.where('id', 'in', jobIds)
			.execute();

		await trx.updateTable('image').set({ status: 'tagging' }).where('id', 'in', imageIds).execute();

		return jobs;
	});
}

async function runOnce() {
	const jobs = await claimJobs();
	if (jobs.length === 0) return;
	await taggingService.processJobs(jobs);
}

export async function runWorker() {
	console.log(
		`Image tagger worker started (batch=${config.batchSize}, poll=${config.pollIntervalMs}ms, api=${config.imageTaggerApiUrl})`
	);

	while (running) {
		try {
			await runOnce();
		} catch (error) {
			console.error('Image tagger worker error', error);
		}

		await sleep(config.pollIntervalMs);
	}
}

export function stopWorker() {
	running = false;
}
