import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const dbPath = process.env.DATABASE_URL || './jumble.db';
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Read and execute migration SQL
const migrationPath = join(process.cwd(), 'drizzle/migrations/0000_icy_venus.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

// Split by statement-breakpoint and execute each statement
const statements = migrationSQL
  .split('--> statement-breakpoint')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log('Running migrations...');
statements.forEach((statement, index) => {
  try {
    sqlite.exec(statement);
    console.log(`✓ Executed statement ${index + 1}`);
  } catch (error: any) {
    // Ignore "table already exists" errors
    if (error.message && error.message.includes('already exists')) {
      console.log(`⚠ Statement ${index + 1} skipped (table already exists)`);
    } else {
      console.error(`✗ Error in statement ${index + 1}:`, error.message);
      throw error;
    }
  }
});

console.log('Database initialized successfully!');
sqlite.close();

