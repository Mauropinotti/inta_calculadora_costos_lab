import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  jsonb,
  integer,
  date
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const appUser = pgTable("app_user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const quote = pgTable("quote", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => appUser.id),
  title: text("title").notNull(),
  baseCurrency: text("base_currency").notNull(),
  dm: numeric("dm", { precision: 12, scale: 2 }).notNull(),
  exchangeRate: numeric("exchange_rate", { precision: 18, scale: 6 }),
  exchangeSource: text("exchange_source"),
  exchangeDate: date("exchange_date"),
  depreciationMethod: text("depreciation_method"),
  status: text("status").default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const quoteLine = pgTable("quote_line", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quote.id, { onDelete: "cascade" }),
  level: integer("level").notNull(),
  sublevel: text("sublevel"),
  category: text("category").notNull(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  costPeriod: numeric("cost_period", { precision: 18, scale: 2 }).notNull(),
  periodicity: text("periodicity").notNull(),
  months: integer("months").notNull(),
  determinations: numeric("determinations", { precision: 18, scale: 2 }).notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const exchangeRateCache = pgTable("exchange_rate_cache", {
  rateDate: date("rate_date").primaryKey(),
  rate: numeric("rate", { precision: 18, scale: 6 }).notNull(),
  source: text("source").notNull(),
  insertedAt: timestamp("inserted_at", { withTimezone: true }).defaultNow().notNull()
});

export const hourlyRate = pgTable("hourly_rate", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileCode: text("profile_code").notNull(),
  profileName: text("profile_name").notNull(),
  hourlyRateArs: numeric("hourly_rate_ars", { precision: 12, scale: 2 }).notNull(),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to"),
  source: text("source")
});

export const infraCategory = pgTable("infra_category", {
  key: text("key").primaryKey(),
  label: text("label").notNull()
});

export const quoteRelations = relations(quote, ({ many, one }) => ({
  lines: many(quoteLine),
  user: one(appUser, {
    fields: [quote.userId],
    references: [appUser.id]
  })
}));

export const quoteLineRelations = relations(quoteLine, ({ one }) => ({
  quote: one(quote, {
    fields: [quoteLine.quoteId],
    references: [quote.id]
  })
}));

export type AppUser = typeof appUser.$inferSelect;
export type Quote = typeof quote.$inferSelect;
export type QuoteInsert = typeof quote.$inferInsert;
export type QuoteLine = typeof quoteLine.$inferSelect;
export type QuoteLineInsert = typeof quoteLine.$inferInsert;
export type ExchangeRateCache = typeof exchangeRateCache.$inferSelect;
export type HourlyRate = typeof hourlyRate.$inferSelect;
export type HourlyRateInsert = typeof hourlyRate.$inferInsert;
export type InfraCategory = typeof infraCategory.$inferSelect;
