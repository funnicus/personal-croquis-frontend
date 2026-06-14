import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

config({ path: resolve(appRoot, '../.env'), quiet: true });
config({ path: resolve(appRoot, '.env'), override: true, quiet: true });
