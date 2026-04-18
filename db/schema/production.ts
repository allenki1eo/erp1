import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { products, recipes, warehouses } from "./masters";

// ===== BEER: BREWS =====
export const brews = sqliteTable("brew", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  batchNumber: text("batch_number").notNull(),
  productId: text("product_id").notNull().references(() => products.id),
  recipeId: text("recipe_id").references(() => recipes.id),
  vesselId: text("vessel_id"),
  plannedVolume: real("planned_volume").notNull(),
  actualVolume: real("actual_volume"),
  startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("PLANNED"),  // PLANNED, MASHING, BOILING, FERMENTING, CONDITIONING, PACKAGED, CANCELLED
  finalAbv: real("final_abv"),
  yieldPercent: real("yield_percent"),
  brewmasterId: text("brewmaster_id"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const brewMeasurements = sqliteTable("brew_measurement", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  brewId: text("brew_id").notNull().references(() => brews.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(),                  // MASH, BOIL, FERMENT, CONDITION
  measuredAt: integer("measured_at", { mode: "timestamp_ms" }).notNull(),
  temperature: real("temperature"),
  gravity: real("gravity"),
  ph: real("ph"),
  notes: text("notes"),
  recordedById: text("recorded_by_id"),
});

export const brewMaterialUsage = sqliteTable("brew_material_usage", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  brewId: text("brew_id").notNull().references(() => brews.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  qty: real("qty").notNull(),
  uom: text("uom").notNull(),
  stage: text("stage"),
});

// ===== SPIRITS: DISTILLATION =====
export const distillations = sqliteTable("distillation", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  runNumber: text("run_number").notNull(),
  productId: text("product_id").notNull().references(() => products.id),
  recipeId: text("recipe_id").references(() => recipes.id),
  stillId: text("still_id"),
  startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("PLANNED"),  // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
  feedVolume: real("feed_volume"),
  feedAbv: real("feed_abv"),
  totalOutput: real("total_output"),
  notes: text("notes"),
});

export const distillationCuts = sqliteTable("distillation_cut", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  distillationId: text("distillation_id").notNull().references(() => distillations.id, { onDelete: "cascade" }),
  cutType: text("cut_type").notNull(),             // HEADS, HEARTS, TAILS
  volume: real("volume").notNull(),
  abv: real("abv").notNull(),
  loa: real("loa"),                                // litres of alcohol
  destination: text("destination"),                // HEARTS_TANK, REDISTILL, DISCARD
});

// ===== AGING / BARRELS =====
export const barrels = sqliteTable("barrel", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  capacity: real("capacity").notNull(),            // litres
  woodType: text("wood_type"),                     // OAK_AMERICAN, OAK_FRENCH, etc
  charLevel: text("char_level"),
  fillsCount: integer("fills_count").notNull().default(0),
  warehouseId: text("warehouse_id").references(() => warehouses.id),
  status: text("status").notNull().default("EMPTY"),    // EMPTY, FILLED, EMPTIED, RETIRED
});

export const agingBatches = sqliteTable("aging_batch", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  barrelId: text("barrel_id").notNull().references(() => barrels.id),
  productId: text("product_id").notNull().references(() => products.id),
  fillVolume: real("fill_volume").notNull(),
  fillAbv: real("fill_abv").notNull(),
  filledAt: integer("filled_at", { mode: "timestamp_ms" }).notNull(),
  emptiedAt: integer("emptied_at", { mode: "timestamp_ms" }),
  emptiedVolume: real("emptied_volume"),
  emptiedAbv: real("emptied_abv"),
  angelsShare: real("angels_share"),
  notes: text("notes"),
});

// ===== BOTTLING =====
export const bottlingRuns = sqliteTable("bottling_run", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  runNumber: text("run_number").notNull(),
  finishedProductId: text("finished_product_id").notNull().references(() => products.id),
  sourceBatchId: text("source_batch_id"),          // brew or aging batch
  sourceType: text("source_type"),                 // BREW, AGING, BLEND
  plannedQty: real("planned_qty").notNull(),
  actualQty: real("actual_qty"),
  uom: text("uom").notNull().default("PCS"),
  startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("PLANNED"),
  notes: text("notes"),
});
