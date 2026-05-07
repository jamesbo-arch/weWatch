import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const watchfaces = pgTable(
  'watchfaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    designerId: uuid('designer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    prgUrl: text('prg_url').notNull(),
    thumbnailUrl: text('thumbnail_url').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    prgOriginalName: text('prg_original_name').notNull(),
    deviceTargets: text('device_targets').array().notNull().default([]),
    price: integer('price').notNull().default(0),
    status: text('status').notNull().default('published'),
    irJson: jsonb('ir_json'),
    downloadCount: integer('download_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('watchfaces_status_idx').on(table.status),
    index('watchfaces_designer_id_idx').on(table.designerId),
  ],
);

export type Watchface = typeof watchfaces.$inferSelect;
export type NewWatchface = typeof watchfaces.$inferInsert;
