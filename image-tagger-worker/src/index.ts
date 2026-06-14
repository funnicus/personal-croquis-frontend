import './load-env.js';
import { db } from './db.js';
import { runWorker, stopWorker } from './worker.js';

let shuttingDown = false;

async function shutdown(signal: string) {
	if (shuttingDown) return;
	shuttingDown = true;

	console.log(`Received ${signal}, shutting down image tagger worker...`);
	stopWorker();
	await db.destroy();
	process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

runWorker().catch((error) => {
	console.error('Fatal worker error', error);
	process.exit(1);
});
