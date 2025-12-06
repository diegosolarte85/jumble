import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { db } from '../lib/db';

const sqlite = new Database(process.env.DATABASE_URL || './jumble.db');
sqlite.pragma('journal_mode = WAL');

async function runMigrations() {
  try {
    console.log('Running migrations...');
    migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('Migrations completed successfully!');
    sqlite.close();
  } catch (error) {
    console.error('Migration error:', error);
    sqlite.close();
    process.exit(1);
  }
}

runMigrations();

