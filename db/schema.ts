import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const nameResults = sqliteTable('name_results', {
  id: text('id').primaryKey(),
  accessTokenHash: text('access_token_hash').notNull(),
  deleteTokenHash: text('delete_token_hash'),
  originalName: text('original_name').notNull(),
  pronunciationHint: text('pronunciation_hint'),
  meaningHint: text('meaning_hint'),
  style: text('style').notNull(),
  nameFeel: text('name_feel'),
  preferencesJson: text('preferences_json'),
  candidatesJson: text('candidates_json').notNull(),
  sajuJson: text('saju_json'),
  algorithmVersion: text('algorithm_version').notNull(),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, table => [index('idx_name_results_expires_at').on(table.expiresAt)]);

export const betaFeedback = sqliteTable('beta_feedback', {
  id: text('id').primaryKey(),
  rating: integer('rating').notNull(),
  selectedName: text('selected_name'),
  comment: text('comment').notNull(),
  createdAt: integer('created_at').notNull(),
}, table => [index('idx_beta_feedback_created_at').on(table.createdAt)]);

export const betaRateLimits = sqliteTable('beta_rate_limits', {
  visitorKey: text('visitor_key').primaryKey(),
  count: integer('count').notNull(),
  resetAt: integer('reset_at').notNull(),
}, table => [index('idx_beta_rate_limits_reset_at').on(table.resetAt)]);

export const namePolls = sqliteTable('name_polls', {
  id: text('id').primaryKey(),
  sourceResultId: text('source_result_id').notNull().references(() => nameResults.id, { onDelete: 'cascade' }),
  accessTokenHash: text('access_token_hash').notNull(),
  candidatesJson: text('candidates_json').notNull(),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, table => [uniqueIndex('idx_name_polls_source_result_id').on(table.sourceResultId)]);

export const namePollVotes = sqliteTable('name_poll_votes', {
  id: text('id').primaryKey(),
  pollId: text('poll_id').notNull().references(() => namePolls.id, { onDelete: 'cascade' }),
  voterKeyHash: text('voter_key_hash').notNull(),
  selectedName: text('selected_name').notNull(),
  createdAt: integer('created_at').notNull(),
}, table => [uniqueIndex('idx_name_poll_votes_poll_voter').on(table.pollId, table.voterKeyHash)]);
