import * as Minio from 'minio';

import {
	BLOB_STORAGE_END_POINT,
	BLOB_STORAGE_PORT,
	BLOB_STORAGE_BUCKET,
	MINIO_ACCESS_KEY,
	MINIO_SECRET_KEY
} from '$env/static/private';

const minioClient = new Minio.Client({
	endPoint: BLOB_STORAGE_END_POINT,
	port: BLOB_STORAGE_PORT,
	useSSL: false,
	accessKey: MINIO_ACCESS_KEY,
	secretKey: MINIO_SECRET_KEY
});

const bucketExists = async () => {
	const exists = await minioClient.bucketExists(BLOB_STORAGE_BUCKET);
	if (exists) {
		console.log(`Bucket ${BLOB_STORAGE_BUCKET} exists.`);
	} else {
		await minioClient.makeBucket(BLOB_STORAGE_BUCKET);
		console.log(`Bucket ${BLOB_STORAGE_BUCKET} created!`);
	}
};

const uploadImage = async (file: File) => {
	await bucketExists();

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const objectName = `/images/${Date.now()}-${file.name}`;
	const meta = { 'Content-Type': file.type || 'application/octet-stream' };

	await minioClient.putObject(BLOB_STORAGE_BUCKET, objectName, buffer, buffer.length, meta);

	return objectName;
};

const retrieveImage = async (key: string) => {
	const objectName = `/images/${key}`;

	return {
		stream: await minioClient.getObject(BLOB_STORAGE_BUCKET, objectName),
		stat: await minioClient.statObject(BLOB_STORAGE_BUCKET, objectName)
	};
};

const retrieveManyImages = async () => {
	const keys: string[] = [];

	for await (const obj of minioClient.listObjectsV2(BLOB_STORAGE_BUCKET, '', true)) {
		if (obj.name) keys.push(obj.name);
	}

	return keys;
};

const retrieveRandomImage = async () => {
	const keys: string[] = [];

	for await (const obj of minioClient.listObjectsV2(BLOB_STORAGE_BUCKET, '', true)) {
		if (obj.name) keys.push(obj.name);
	}

	const objectName = keys[Math.floor(Math.random() * keys.length)];

	return {
		stream: await minioClient.getObject(BLOB_STORAGE_BUCKET, objectName),
		stat: await minioClient.statObject(BLOB_STORAGE_BUCKET, objectName)
	};
};

export const blobStorageClient = {
	uploadImage,
	retrieveImage,
	retrieveManyImages,
	retrieveRandomImage
};
