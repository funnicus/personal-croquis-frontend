import * as Minio from 'minio';

import { env } from '$env/dynamic/private';

let minioClient: Minio.Client | null = null;

const requiredEnv = (name: string, value: string | undefined) => {
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
};

const getConfig = () => {
	const port = Number(requiredEnv('BLOB_STORAGE_PORT', env.BLOB_STORAGE_PORT));

	if (!Number.isInteger(port)) {
		throw new Error('BLOB_STORAGE_PORT must be an integer');
	}

	return {
		endPoint: requiredEnv('BLOB_STORAGE_END_POINT', env.BLOB_STORAGE_END_POINT),
		port,
		accessKey: requiredEnv('MINIO_ROOT_USER', env.MINIO_ROOT_USER),
		secretKey: requiredEnv('MINIO_ROOT_PASSWORD', env.MINIO_ROOT_PASSWORD),
		bucket: requiredEnv('BLOB_STORAGE_BUCKET', env.BLOB_STORAGE_BUCKET)
	};
};

const get = () => {
	if (minioClient) return minioClient;

	const config = getConfig();

	minioClient = new Minio.Client({
		endPoint: config.endPoint,
		port: config.port,
		useSSL: false,
		accessKey: config.accessKey,
		secretKey: config.secretKey
	});

	return minioClient;
};

const bucketExists = async () => {
	if (!minioClient) {
		minioClient = get();
	}

	const { bucket } = getConfig();

	const exists = await minioClient.bucketExists(bucket);
	if (exists) {
		console.log(`Bucket ${bucket} exists.`);
	} else {
		await minioClient.makeBucket(bucket);
		console.log(`Bucket ${bucket} created!`);
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
	const { bucket } = getConfig();

	await minioClient.putObject(bucket, objectName, buffer, buffer.length, meta);

	return objectName;
};

const retrieveFile = async (objectName: string) => {
	if (!minioClient) {
		minioClient = get();
	}

	const { bucket } = getConfig();

	return {
		stream: await minioClient.getObject(bucket, objectName),
		stat: await minioClient.statObject(bucket, objectName)
	};
};

const retrieveManyFiles = async () => {
	await bucketExists();

	if (!minioClient) {
		minioClient = get();
	}

	const keys: string[] = [];
	const { bucket } = getConfig();

	for await (const obj of minioClient.listObjectsV2(bucket, '', true)) {
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
	const { bucket } = getConfig();

	for await (const obj of minioClient.listObjectsV2(bucket, '', true)) {
		if (obj.name) keys.push(obj.name);
	}

	if (keys.length === 0) {
		return undefined;
	}

	const objectName = keys[Math.floor(Math.random() * keys.length)];

	return {
		stream: await minioClient.getObject(bucket, objectName),
		stat: await minioClient.statObject(bucket, objectName)
	};
};

const deleteFile = async (objectName: string) => {
	await bucketExists();

	if (!minioClient) {
		minioClient = get();
	}

	const { bucket } = getConfig();

	await minioClient.removeObject(bucket, objectName);
};

export const blobStorageClient = {
	get,
	uploadFile,
	retrieveFile,
	retrieveManyFiles,
	retrieveRandomFile,
	deleteFile
};
