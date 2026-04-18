import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";

export const warehouses = sqliteTable("warehouse", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("MAIN"),    // MAIN, BONDED, TRANSIT, RETAIL
  address: text("address"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const productCategories = sqliteTable("product_category", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  parentId: text("parent_id"),
});

export const products = sqliteTable("product", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),                    // RAW_MATERIAL, PACKAGING, WIP, FINISHED_GOOD, CONSUMABLE
  productClass: text("product_class"),             // BEER, SPIRIT, NON_ALC
  categoryId: text("category_id").references(() => productCategories.id),
  uom: text("uom").notNull().default("PCS"),       // L, KG, PCS, CASE
  packSize: real("pack_size"),                     // e.g. 0.5 (litres)
  unitsPerCase: integer("units_per_case"),
  abv: real("abv"),                                // alcohol by volume %
  exciseRateId: text("excise_rate_id"),
  costPrice: real("cost_price").default(0),
  sellingPrice: real("selling_price").default(0),
  reorderLevel: real("reorder_level").default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const recipes = sqliteTable("recipe", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  version: text("version").notNull().default("1.0"),
  expectedYield: real("expected_yield").notNull(),     // litres per batch
  expectedAbv: real("expected_abv"),
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const recipeItems = sqliteTable("recipe_item", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  recipeId: text("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: real("quantity").notNull(),
  uom: text("uom").notNull(),
  stage: text("stage"),                            // MASH, BOIL, FERMENT, DISTILL, BLEND, BOTTLE
});

export const customers = sqliteTable("customer", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("RETAIL"),  // RETAIL, WHOLESALE, ON_TRADE, OFF_TRADE
  tin: text("tin"),
  vrn: text("vrn"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  region: text("region"),
  routeId: text("route_id"),
  creditLimit: real("credit_limit").default(0),
  paymentTerms: integer("payment_terms_days").default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const suppliers = sqliteTable("supplier", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  tin: text("tin"),
  vrn: text("vrn"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  paymentTerms: integer("payment_terms_days").default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const taxCodes = sqliteTable("tax_code", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  code: text("code").notNull(),                    // VAT18, VAT0, EXEMPT
  name: text("name").notNull(),
  rate: real("rate").notNull(),                    // 0.18 for VAT 18%
  type: text("type").notNull().default("VAT"),     // VAT, EXCISE, WITHHOLDING
});

export const exciseRates = sqliteTable("excise_rate", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  productClass: text("product_class").notNull(),   // BEER, SPIRIT
  ratePerLitre: real("rate_per_litre"),            // TZS per litre
  ratePerLitreOfAlcohol: real("rate_per_loa"),     // TZS per LoA
  effectiveFrom: integer("effective_from", { mode: "timestamp_ms" }).notNull(),
});

export const routes = sqliteTable("route", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  region: text("region"),
  assignedRepId: text("assigned_rep_id"),
});
