function required(name: string): string {
	const value = process.env[name];
	if (value === undefined || value === '') {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

function optionalNumber(name: string, fallback: number): number {
	const value = process.env[name];
	if (value === undefined || value === '') return fallback;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
	database: {
		database: required('DATABASE_NAME'),
		host: required('DATABASE_HOST'),
		user: required('DATABASE_USER'),
		port: optionalNumber('DATABASE_PORT', 5432),
		password: required('DATABASE_PASSWORD')
	},
	blobStorage: {
		endPoint: required('BLOB_STORAGE_END_POINT'),
		port: optionalNumber('BLOB_STORAGE_PORT', 9000),
		useSSL: process.env.MINIO_SSL === 'true',
		accessKey: required('MINIO_ROOT_USER'),
		secretKey: required('MINIO_ROOT_PASSWORD'),
		bucket: required('BLOB_STORAGE_BUCKET')
	},
	imageTaggerApiUrl: required('IMAGE_TAGGER_API_URL'),
	// Signed read URL lifetime handed to the tagger API (seconds).
	signedUrlExpirySeconds: optionalNumber('SIGNED_URL_EXPIRY_SECONDS', 60 * 60),
	pollIntervalMs: optionalNumber('WORKER_POLL_INTERVAL_MS', 2_000),
	batchSize: optionalNumber('WORKER_BATCH_SIZE', 8)
};
