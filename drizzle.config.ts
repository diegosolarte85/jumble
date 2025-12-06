import type { Config } from 'drizzle-kit';

const DATABASE_URL = process.env.DATABASE_URL || './jumble.db';
const isPostgres = DATABASE_URL.includes('postgres');

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: isPostgres ? 'postgresql' : 'sqlite',
  dbCredentials: isPostgres
    ? { url: DATABASE_URL }
    : { url: DATABASE_URL },
} satisfies Config;

