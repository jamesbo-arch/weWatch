import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const designers = pgTable('designers', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  brandName: text('brand_name').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  stripeAccountId: text('stripe_account_id'),
  kycStatus: text('kyc_status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Designer = typeof designers.$inferSelect;
export type NewDesigner = typeof designers.$inferInsert;
