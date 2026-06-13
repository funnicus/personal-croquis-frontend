import { PostgresDialect } from 'kysely';
import { defineConfig } from 'kysely-ctl';
import { Pool } from 'pg';

const dialect = new PostgresDialect({
	pool: new Pool({
		database: process.env.DATABASE_NAME,
		host: process.env.DATABASE_HOST,
		user: process.env.DATABASE_USER,
		port: process.env.DATABASE_PORT,
		password: process.env.DATABASE_PASSWORD,
		max: 10
	})
});

export default defineConfig({
	// replace me with a real dialect instance OR a dialect name + `dialectConfig` prop.
	dialect,
	migrations: {
		migrationFolder: '../migrations'
	}
	//   plugins: [],
	//   seeds: {
	//     seedFolder: "seeds",
	//   }
});
