import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { products } from "./masters";

// Reusable QC specification per stage / product / product class.
// e.g. "Lager MASH pH: 5.2–5.6", "Gin HEARTS ABV: 0.90–0.96".
export const qcCheckTemplates = sqliteTable("qc_check_template", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  refType: text("ref_type").notNull(),              // BREW, DISTILLATION, AGING, BOTTLING, GRN
  stage: text("stage"),                              // MASH, BOIL, FERMENT, CONDITION, HEARTS, PRE_FILL, POST_FILL, RECEIVING
  checkType: text("check_type").notNull(),           // ABV, GRAVITY, PH, MICROBIAL, SENSORY, VISUAL, TEMPERATURE, VOLUME
  productClass: text("product_class"),               // BEER, SPIRIT, WINE, NON_ALC (optional filter)
  productId: text("product_id").references(() => products.id),  // optional product-specific override
  unit: text("unit"),
  minSpec: real("min_spec"),
  maxSpec: real("max_spec"),
  mandatory: integer("mandatory", { mode: "boolean" }).notNull().default(true),
  holdOnFail: integer("hold_on_fail", { mode: "boolean" }).notNull().default(true),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const qualityChecks = sqliteTable("quality_check", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  templateId: text("template_id").references(() => qcCheckTemplates.id),
  refType: text("ref_type").notNull(),             // BREW, DISTILLATION, AGING, BOTTLING, GRN
  refId: text("ref_id").notNull(),
  stage: text("stage"),                            // MASH, BOIL, FERMENT, CONDITION, HEARTS, etc.
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
  batchId: text("batch_id"),                              // optional link to stock_batch
  severity: text("severity").notNull().default("MINOR"),  // MINOR, MAJOR, CRITICAL
  description: text("description").notNull(),
  rootCause: text("root_cause"),
  correctiveAction: text("corrective_action"),
  disposition: text("disposition"),                        // REWORK, SCRAP, USE_AS_IS, RETURN, DOWNGRADE
  status: text("status").notNull().default("OPEN"),        // OPEN, IN_REVIEW, CLOSED
  raisedById: text("raised_by_id"),
  raisedAt: integer("raised_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  closedById: text("closed_by_id"),
  closedAt: integer("closed_at", { mode: "timestamp_ms" }),
});

// Hold/Release events on a stock batch (audit trail for QC holds).
export const batchHoldEvents = sqliteTable("batch_hold_event", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  batchId: text("batch_id").notNull(),
  action: text("action").notNull(),                        // HOLD, QUARANTINE, RELEASE, REJECT
  reason: text("reason"),
  ncId: text("nc_id"),                                     // optional link to non-conformance
  previousStatus: text("previous_status"),
  newStatus: text("new_status").notNull(),
  actionedById: text("actioned_by_id"),
  actionedAt: integer("actioned_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});
