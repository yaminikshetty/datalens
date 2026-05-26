import { pgTable, serial, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trendEnum = pgEnum("trend", ["up", "down", "flat"]);

export const metricsTable = pgTable("metrics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: numeric("value", { precision: 20, scale: 4 }).notNull(),
  previousValue: numeric("previous_value", { precision: 20, scale: 4 }),
  unit: text("unit").notNull(),
  category: text("category").notNull(),
  trend: trendEnum("trend").notNull().default("flat"),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMetricSchema = createInsertSchema(metricsTable).omit({ id: true, createdAt: true });
export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type Metric = typeof metricsTable.$inferSelect;
