import * as Minio from 'minio';
import { config } from './config.js';

let minioClient: Minio.Client | null = null;

function getClient(): Minio.Client {
	if (minioClient) return minioClient;

	minioClient = new Minio.Client({
		endPoint: config.blobStorage.endPoint,
		port: config.blobStorage.port,
		useSSL: config.blobStorage.useSSL,
		accessKey: config.blobStorage.accessKey,
		secretKey: config.blobStorage.secretKey
	});

	return minioClient;
}

/**
 * Generates a time-limited, signed URL that the image tagger API can use to
 * fetch the image directly from blob storage without credentials.
 *
 * The host baked into the URL comes from BLOB_STORAGE_END_POINT, so it must be
 * a host the tagger API can actually reach (e.g. the "minio" service name when
 * both run on the same Docker network). SigV4 signs the host, so the URL cannot
 * be rewritten after signing.
 */
export async function createSignedReadUrl(objectName: string): Promise<string> {
	return await getClient().presignedGetObject(
		config.blobStorage.bucket,
		objectName,
		config.signedUrlExpirySeconds
	);
}
