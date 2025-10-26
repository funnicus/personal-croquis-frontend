import * as Minio from 'minio';

import { env } from '$env/dynamic/private';

let minioClient: Minio.Client | null = null;

const get = () => {
	if (minioClient) return minioClient;

	minioClient = new Minio.Client({
		endPoint: env.BLOB_STORAGE_END_POINT,
		port: env.BLOB_STORAGE_PORT,
		useSSL: false,
		accessKey: env.MINIO_ROOT_USER,
		secretKey: env.MINIO_ROOT_PASSWORD
	});

	return minioClient;
};

const bucketExists = async () => {
	if (!minioClient) {
		minioClient = get();
	}

	const exists = await minioClient.bucketExists(env.BLOB_STORAGE_BUCKET);
	if (exists) {
		console.log(`Bucket ${env.BLOB_STORAGE_BUCKET} exists.`);
	} else {
		await minioClient.makeBucket(env.BLOB_STORAGE_BUCKET);
		console.log(`Bucket ${env.BLOB_STORAGE_BUCKET} created!`);
	}
};

const uploadFile = async (file: File, folder?: string) => {
	await bucketExists();

	if (!minioClient) {
		minioClient = get();
	}

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const objectName = folder
		? `/${folder}/${Date.now()}-${file.name}`
		: `${Date.now()}-${file.name}`;
	const meta = { 'Content-Type': file.type || 'application/octet-stream' };

	await minioClient.putObject(env.BLOB_STORAGE_BUCKET, objectName, buffer, buffer.length, meta);

	return objectName;
};

const retrieveFile = async (objectName: string) => {
	if (!minioClient) {
		minioClient = get();
	}

	return {
		stream: await minioClient.getObject(env.BLOB_STORAGE_BUCKET, objectName),
		stat: await minioClient.statObject(env.BLOB_STORAGE_BUCKET, objectName)
	};
};

const retrieveManyFiles = async () => {
	await bucketExists();

	if (!minioClient) {
		minioClient = get();
	}

	const keys: string[] = [];

	for await (const obj of minioClient.listObjectsV2(env.BLOB_STORAGE_BUCKET, '', true)) {
		if (obj.name) keys.push(obj.name);
	}

	return keys;
};

const retrieveRandomFile = async () => {
	await bucketExists();

	if (!minioClient) {
		minioClient = get();
	}

	const keys: string[] = [];

	for await (const obj of minioClient.listObjectsV2(env.BLOB_STORAGE_BUCKET, '', true)) {
		if (obj.name) keys.push(obj.name);
	}

	if (keys.length === 0) {
		return undefined;
	}

	const objectName = keys[Math.floor(Math.random() * keys.length)];

	return {
		stream: await minioClient.getObject(env.BLOB_STORAGE_BUCKET, objectName),
		stat: await minioClient.statObject(env.BLOB_STORAGE_BUCKET, objectName)
	};
};

const deleteFile = async (objectName: string) => {
	await bucketExists();

	if (!minioClient) {
		minioClient = get();
	}

	await minioClient.removeObject(env.BLOB_STORAGE_BUCKET, objectName);
};

export const blobStorageClient = {
	get,
	uploadFile,
	retrieveFile,
	retrieveManyFiles,
	retrieveRandomFile,
	deleteFile
};
