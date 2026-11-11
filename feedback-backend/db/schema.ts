import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const feedback = sqliteTable('feedback', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  rating: integer('rating').notNull(),
  comments: text('comments').notNull(),
  consentVersion: text('consent_version').notNull(),
}, table => [index('feedback_created_at_idx').on(table.createdAt)]);
export const submissionLimits = sqliteTable('submission_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
