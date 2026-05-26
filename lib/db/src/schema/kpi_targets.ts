import { pgTable, serial, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const kpiStatusEnum = pgEnum("kpi_status", ["on_track", "at_risk", "behind", "achieved"]);

export const kpiTargetsTable = pgTable("kpi_targets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  target: numeric("target", { precision: 20, scale: 4 }).notNull(),
  current: numeric("current", { precision: 20, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  category: text("category").notNull(),
  status: kpiStatusEnum("status").notNull().default("on_track"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKpiTargetSchema = createInsertSchema(kpiTargetsTable).omit({ id: true, createdAt: true });
export type InsertKpiTarget = z.infer<typeof insertKpiTargetSchema>;
export type KpiTarget = typeof kpiTargetsTable.$inferSelect;
