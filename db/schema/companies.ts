import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const companies = sqliteTable("company", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  tin: text("tin"),                    // Tanzania Tax ID
  vrn: text("vrn"),                    // VAT Registration Number
  country: text("country").notNull().default("TZ"),
  baseCurrency: text("base_currency").notNull().default("TZS"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const roles = sqliteTable("role", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),                    // ADMIN, PLANT_MANAGER, QC, SALES_REP, FINANCE, WAREHOUSE
  permissions: text("permissions", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
});

export const userCompanies = sqliteTable(
  "user_company",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    roleId: text("role_id").references(() => roles.id),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    salesTargetMonthly: integer("sales_target_monthly").default(0),  // for sales reps
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.companyId] }) })
);
