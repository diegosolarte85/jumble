import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password'), // Hashed password (null for OAuth users)
  name: text('name'),
  bio: text('bio'),
  location: text('location'),
  commitmentLevel: text('commitment_level', { enum: ['fulltime', 'parttime', 'weekends'] }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  skillName: text('skill_name').notNull(),
  proficiencyLevel: text('proficiency_level', { enum: ['beginner', 'intermediate', 'expert'] }).notNull(),
  skillEmbedding: text('skill_embedding'), // JSON array stored as TEXT
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const startupIdeas = sqliteTable('startup_ideas', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  industry: text('industry'),
  requiredSkills: text('required_skills'), // JSON array stored as TEXT
  ideaEmbedding: text('idea_embedding'), // JSON array stored as TEXT
  stage: text('stage', { enum: ['idea', 'mvp', 'launched'] }).notNull().default('idea'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const swipes = sqliteTable('swipes', {
  id: text('id').primaryKey(),
  swiperId: text('swiper_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  swipedId: text('swiped_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  direction: text('direction', { enum: ['left', 'right', 'super'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  uniqueSwipe: sql`unique (${table.swiperId}, ${table.swipedId})`,
}));

export const matches = sqliteTable('matches', {
  id: text('id').primaryKey(),
  user1Id: text('user1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  user2Id: text('user2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  matchScore: real('match_score'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  lastMessageAt: integer('last_message_at', { mode: 'timestamp' }),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  matchId: text('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Note: Indexes can be added via migrations or directly in the table definition
// For SQLite, we'll add unique constraints where needed

