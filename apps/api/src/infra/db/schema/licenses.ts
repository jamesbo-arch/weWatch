import { pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { watchfaces } from './watchfaces.js';

export const licenses = pgTable(
  'licenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    watchfaceId: uuid('watchface_id')
      .notNull()
      .references(() => watchfaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    deviceSerial: varchar('device_serial', { length: 64 }),
    licenseKey: varchar('license_key', { length: 128 }),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('licenses_device_watchface_idx').on(table.deviceSerial, table.watchfaceId),
  ],
);

export type License = typeof licenses.$inferSelect;
export type NewLicense = typeof licenses.$inferInsert;
