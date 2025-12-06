#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || './jumble.db';
const isPostgres = DATABASE_URL.includes('postgres');

console.log(`Detected database type: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);

try {
  if (isPostgres) {
    // For PostgreSQL (Heroku), use drizzle-kit push
    console.log('Running database push for PostgreSQL...');
    execSync('npx drizzle-kit push', { stdio: 'inherit' });
    console.log('✓ Database schema pushed successfully');
  } else {
    // For SQLite (local dev), run migrations if database doesn't exist
    if (!fs.existsSync(DATABASE_URL)) {
      console.log('Database not found. Initializing...');
      execSync('npm run db:init', { stdio: 'inherit' });
      console.log('✓ Database initialized successfully');
    } else {
      console.log('✓ Database already exists, skipping initialization');
    }
  }
} catch (error) {
  console.error('Database setup failed:', error.message);
  // Don't fail the build on database errors
  console.log('⚠ Continuing despite database setup errors...');
  process.exit(0);
}
