import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";

export const accounts = sqliteTable("ledger_account", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),                    // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
  parentId: text("parent_id"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const journals = sqliteTable("journal_entry", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  entryDate: integer("entry_date", { mode: "timestamp_ms" }).notNull(),
  refType: text("ref_type"),                       // INVOICE, BILL, PAYMENT, MANUAL
  refId: text("ref_id"),
  description: text("description"),
  status: text("status").notNull().default("POSTED"),    // DRAFT, POSTED, REVERSED
  createdById: text("created_by_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const journalLines = sqliteTable("journal_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  journalId: text("journal_id").notNull().references(() => journals.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull().references(() => accounts.id),
  debit: real("debit").notNull().default(0),
  credit: real("credit").notNull().default(0),
  description: text("description"),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  action: text("action").notNull(),                // CREATE, UPDATE, DELETE, APPROVE
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  before: text("before", { mode: "json" }),
  after: text("after", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});
