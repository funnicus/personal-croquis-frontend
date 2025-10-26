import { blobStorageClient } from '../clients/blob-storage-client';
import { imageQueries } from './image-queries';

const isFulfilled = <T>(p: PromiseSettledResult<T>): p is PromiseFulfilledResult<T> =>
	p.status === 'fulfilled';
const isRejected = <T>(p: PromiseSettledResult<T>): p is PromiseRejectedResult =>
	p.status === 'rejected';

const getMany = async (limit?: number) => {
	const parsed_limit = Math.min(Number(limit ?? 30), 100);
	const items = await imageQueries.selectMany(parsed_limit);

	const results = await Promise.allSettled(
		items.map(async (item) => ({
			...item,
			tags: await imageQueries.getImageTags(item.id)
		}))
	);

	const fulfilledValues = results.filter(isFulfilled).map((p) => p.value);
	const rejectedReasons = results.filter(isRejected).map((p) => p.reason);

	const nextCursor = items.length === parsed_limit ? items[items.length - 1] : null;

	return { items: fulfilledValues, nextCursor, rejectedReasons };
};

const getOne = async (key: string) => {
	const data = await blobStorageClient.retrieveFile(key);

	const contentType =
		data.stat.metaData?.['content-type'] ??
		data.stat.metaData?.['Content-Type'] ??
		'application/octet-stream';

	return {
		contentType,
		...data
	};
};

const getRandom = async (tags?: string[]) => {
	const dbData = await imageQueries.getRandom(tags);

	if (!dbData) {
		return undefined;
	}

	const blobData = await blobStorageClient.retrieveFile(dbData.name);

	if (!blobData) {
		return undefined;
	}

	const contentType =
		blobData.stat.metaData?.['content-type'] ??
		blobData.stat.metaData?.['Content-Type'] ??
		'application/octet-stream';

	return {
		contentType,
		...blobData
	};
};

const createMany = async (files: File[]) => {
	const settled = await Promise.allSettled(
		files.map((file) => blobStorageClient.uploadFile(file, 'images'))
	);

	const ok = settled
		.filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
		.map((r) => r.value);

	await imageQueries.createMany(ok.map((name) => ({ name })));

	const failed = settled
		.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
		.map((r, i) => ({ name: files[i].name, error: String(r.reason) }));

	return {
		ok,
		failed
	};
};

const deleteOne = async (key: string) => {
	await imageQueries.deleteOne(key);
	await blobStorageClient.deleteFile(key);
};

export const imageService = {
	getOne,
	getMany,
	getRandom,
	createMany,
	deleteOne
};
