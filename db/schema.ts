import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const nameResults = sqliteTable('name_results', {
  id: text('id').primaryKey(),
  accessTokenHash: text('access_token_hash').notNull(),
  originalName: text('original_name').notNull(),
  pronunciationHint: text('pronunciation_hint'),
  meaningHint: text('meaning_hint'),
  style: text('style').notNull(),
  candidatesJson: text('candidates_json').notNull(),
  algorithmVersion: text('algorithm_version').notNull(),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, table => [index('idx_name_results_expires_at').on(table.expiresAt)]);
