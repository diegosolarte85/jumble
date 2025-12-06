import * as schema from '@/drizzle/schema';

const DATABASE_URL = process.env.DATABASE_URL || './jumble.db';
const isPostgres = DATABASE_URL.includes('postgres');

let db: any;

if (isPostgres) {
  // PostgreSQL for production (Heroku)
  const { drizzle: pgDrizzle } = require('drizzle-orm/postgres-js');
  const postgres = require('postgres');
  
  const client = postgres(DATABASE_URL, { 
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  db = pgDrizzle(client, { schema });
} else {
  // SQLite for local development
  const { drizzle: sqliteDrizzle } = require('drizzle-orm/better-sqlite3');
  const Database = require('better-sqlite3');
  
  const sqlite = new Database(DATABASE_URL);
  sqlite.pragma('journal_mode = WAL');
  
  db = sqliteDrizzle(sqlite, { schema });
}

export { db };

