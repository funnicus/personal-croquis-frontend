import { randomUUID } from 'node:crypto';
import { db } from '../clients/database-client';

// Producer side only: enqueue images for tagging. The actual tagging work is
// performed by the standalone `image-tagger-worker` service.
const enqueueMany = async (imageIds: number[]) => {
	if (imageIds.length === 0) return;

	await db.transaction().execute(async (trx) => {
		await trx
			.insertInto('image_tagging_job')
			.values(
				imageIds.map((imageId) => ({
					id: randomUUID(),
					image_id: imageId
				}))
			)
			.onConflict((oc) => oc.column('image_id').doNothing())
			.execute();

		await trx
			.updateTable('image')
			.set({ status: 'tagging_queued' })
			.where('id', 'in', imageIds)
			.execute();
	});
};

export const imageTaggingService = { enqueueMany };
