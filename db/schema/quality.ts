import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";

export const qualityChecks = sqliteTable("quality_check", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  refType: text("ref_type").notNull(),             // BREW, DISTILLATION, AGING, BOTTLING, GRN
  refId: text("ref_id").notNull(),
  checkType: text("check_type").notNull(),         // ABV, GRAVITY, PH, MICROBIAL, SENSORY, VISUAL
  measuredValue: real("measured_value"),
  unit: text("unit"),
  minSpec: real("min_spec"),
  maxSpec: real("max_spec"),
  result: text("result").notNull(),                // PASS, FAIL, HOLD
  inspectorId: text("inspector_id"),
  notes: text("notes"),
  checkedAt: integer("checked_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const nonConformances = sqliteTable("non_conformance", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  refType: text("ref_type"),
  refId: text("ref_id"),
  severity: text("severity").notNull().default("MINOR"),  // MINOR, MAJOR, CRITICAL
  description: text("description").notNull(),
  rootCause: text("root_cause"),
  correctiveAction: text("corrective_action"),
  status: text("status").notNull().default("OPEN"),       // OPEN, IN_REVIEW, CLOSED
  raisedById: text("raised_by_id"),
  raisedAt: integer("raised_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  closedAt: integer("closed_at", { mode: "timestamp_ms" }),
});
