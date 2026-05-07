import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

const pool = new Pool({
  connectionString:
    process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/wewatch',
});

export const db = drizzle(pool, { schema });
export type Db = typeof db;
