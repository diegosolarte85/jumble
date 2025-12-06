import { sql } from 'drizzle-orm';

// Conditional imports based on database type
const isPostgres = process.env.DATABASE_URL?.includes('postgres');

// Use PostgreSQL for production (Heroku), SQLite for local dev
let pgTable: any, pgText: any, pgTimestamp: any, pgReal: any, pgBoolean: any, pgUnique: any;
let sqliteTable: any, sqliteText: any, sqliteInteger: any, sqliteReal: any, sqliteUnique: any;

if (isPostgres) {
  const pg = require('drizzle-orm/pg-core');
  pgTable = pg.pgTable;
  pgText = pg.text;
  pgTimestamp = pg.timestamp;
  pgReal = pg.real;
  pgBoolean = pg.boolean;
  pgUnique = pg.unique;
} else {
  const sqlite = require('drizzle-orm/sqlite-core');
  sqliteTable = sqlite.sqliteTable;
  sqliteText = sqlite.text;
  sqliteInteger = sqlite.integer;
  sqliteReal = sqlite.real;
  sqliteUnique = sqlite.unique;
}

const table = isPostgres ? pgTable : sqliteTable;
const text = isPostgres ? pgText : sqliteText;
const timestamp = isPostgres 
  ? (name: string) => pgTimestamp(name, { mode: 'date' }).notNull().defaultNow()
  : (name: string) => sqliteInteger(name, { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`);
const real = isPostgres ? pgReal : sqliteReal;
const boolean = isPostgres 
  ? (name: string) => pgBoolean(name).notNull().default(false)
  : (name: string) => sqliteInteger(name, { mode: 'boolean' }).notNull().default(false);
const unique = isPostgres ? pgUnique : sqliteUnique;

export const users = table('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'), // Hashed password (null for OAuth users)
  name: text('name'),
  bio: text('bio'),
  location: text('location'),
  profilePicture: text('profile_picture'), // URL to profile picture
  commitmentLevel: text('commitment_level', { enum: ['fulltime', 'parttime', 'weekends'] }),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const skills = table('skills', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  skillName: text('skill_name').notNull(),
  proficiencyLevel: text('proficiency_level', { enum: ['beginner', 'intermediate', 'expert'] }).notNull(),
  skillEmbedding: text('skill_embedding'), // JSON array stored as TEXT
  createdAt: timestamp('created_at'),
});

export const startupIdeas = table('startup_ideas', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  industry: text('industry'),
  requiredSkills: text('required_skills'), // JSON array stored as TEXT
  ideaEmbedding: text('idea_embedding'), // JSON array stored as TEXT
  stage: text('stage', { enum: ['idea', 'mvp', 'launched'] }).notNull().default('idea'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const swipes = table('swipes', {
  id: text('id').primaryKey(),
  swiperId: text('swiper_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  swipedId: text('swiped_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  direction: text('direction', { enum: ['left', 'right', 'super'] }).notNull(),
  createdAt: timestamp('created_at'),
}, (table: any) => ({
  uniqueSwipe: unique().on(table.swiperId, table.swipedId),
}));

export const matches = table('matches', {
  id: text('id').primaryKey(),
  user1Id: text('user1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  user2Id: text('user2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  matchScore: real('match_score'),
  createdAt: timestamp('created_at'),
  lastMessageAt: isPostgres 
    ? pgTimestamp('last_message_at', { mode: 'date' })
    : sqliteInteger('last_message_at', { mode: 'timestamp' }),
});

export const messages = table('messages', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  read: boolean('read'),
  createdAt: timestamp('created_at'),
});

// Note: Indexes can be added via migrations or directly in the table definition

