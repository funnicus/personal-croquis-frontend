import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { config } from './config.js';
import type { Database } from './types.js';

const dialect = new PostgresDialect({
	pool: new Pool({
		database: config.database.database,
		host: config.database.host,
		user: config.database.user,
		port: config.database.port,
		password: config.database.password,
		max: 10
	})
});

export const db = new Kysely<Database>({ dialect });
