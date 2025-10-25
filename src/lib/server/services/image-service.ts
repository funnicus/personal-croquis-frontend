import { blobStorageClient } from '../blob-storage-client';

const getMany = async (limit?: number) => {
	const parsed_limit = Math.min(Number(limit ?? 30), 100);
	const items = await blobStorageClient.retrieveManyImages();

	const nextCursor = items.length === parsed_limit ? items[items.length - 1] : null;

	return { items, nextCursor };
};

const getOne = async (key: string) => {
	const data = await blobStorageClient.retrieveImage(key);

	const contentType =
		data.stat.metaData?.['content-type'] ??
		data.stat.metaData?.['Content-Type'] ??
		'application/octet-stream';

	return {
		contentType,
		...data
	};
};

const getRandom = async () => {
	const data = await blobStorageClient.retrieveRandomImage();

	const contentType =
		data.stat.metaData?.['content-type'] ??
		data.stat.metaData?.['Content-Type'] ??
		'application/octet-stream';

	return {
		contentType,
		...data
	};
};

const createMany = async (files: File[]) => {
	const settled = await Promise.allSettled(files.map(blobStorageClient.uploadImage));

	const ok = settled
		.filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
		.map((r) => r.value);

	const failed = settled
		.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
		.map((r, i) => ({ name: files[i].name, error: String(r.reason) }));

	return {
		ok,
		failed
	};
};

export const imageService = {
	getOne,
	getMany,
	getRandom,
	createMany
};
