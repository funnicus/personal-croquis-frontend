import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import type { Database } from '../../../types';
import { env } from '$env/dynamic/private';

const dialect = new PostgresDialect({
	pool: new Pool({
		database: env.DATABASE_NAME,
		host: env.DATABASE_HOST,
		user: env.DATABASE_USER,
		port: env.DATABASE_PORT,
		password: env.DATABASE_PASSWORD,
		max: 10
	})
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
	dialect
});
