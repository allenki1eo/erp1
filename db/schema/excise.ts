import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { products, warehouses } from "./masters";
import { users } from "./auth";

// ─────────────────────────────────────────
// Tax stamp rolls (TRA-issued serial ranges).
// Tanzania EGMS / digital tax stamps — each finished bottle carries a serial.
// ─────────────────────────────────────────
export const taxStampRolls = sqliteTable("tax_stamp_roll", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  rollNumber: text("roll_number").notNull(),                  // as printed on roll
  stampType: text("stamp_type").notNull(),                    // BEER, SPIRIT, WINE, SOFT_DRINK
  serialFrom: text("serial_from").notNull(),
  serialTo: text("serial_to").notNull(),
  quantity: integer("quantity").notNull(),
  usedQty: integer("used_qty").notNull().default(0),
  wastedQty: integer("wasted_qty").notNull().default(0),
  issuedAt: integer("issued_at", { mode: "timestamp_ms" }),   // date TRA issued the roll
  receivedAt: integer("received_at", { mode: "timestamp_ms" }),
  warehouseId: text("warehouse_id").references(() => warehouses.id),
  status: text("status").notNull().default("RECEIVED"),       // RECEIVED, IN_USE, EXHAUSTED, VOID
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Allocation of a serial range from a roll to a bottling run / finished goods batch.
export const taxStampAllocations = sqliteTable("tax_stamp_allocation", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  rollId: text("roll_id").notNull().references(() => taxStampRolls.id, { onDelete: "cascade" }),
  refType: text("ref_type").notNull(),                        // BOTTLING, BATCH, MANUAL
  refId: text("ref_id"),
  serialFrom: text("serial_from").notNull(),
  serialTo: text("serial_to").notNull(),
  quantity: integer("quantity").notNull(),
  wastedQty: integer("wasted_qty").notNull().default(0),
  allocatedById: text("allocated_by_id").references(() => users.id),
  allocatedAt: integer("allocated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  notes: text("notes"),
});

// ─────────────────────────────────────────
// Bonded warehouse movements — duty-suspended stock tracking.
// A movement is a structured event on product held in a BONDED warehouse.
// Types:
//   ENTRY          — received into bonded store (import or production ex-still).
//   REMOVAL_DUTY_PAID — released for home use; duty is declared & paid.
//   REMOVAL_EXPORT   — exported (no duty).
//   TRANSFER_BONDED  — bonded-to-bonded transfer (no duty event).
//   LOSS / DESTRUCTION — approved write-off.
// ─────────────────────────────────────────
export const bondedMovements = sqliteTable("bonded_movement", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),                           // BWM-2024-0001
  movementType: text("movement_type").notNull(),
  productId: text("product_id").notNull().references(() => products.id),
  productClass: text("product_class").notNull(),              // BEER, SPIRIT, WINE (denormalised for reports)
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  destinationWarehouseId: text("destination_warehouse_id").references(() => warehouses.id),
  batchId: text("batch_id"),                                   // stock_batch reference
  qtyLitres: real("qty_litres").notNull(),
  abv: real("abv"),
  loa: real("loa"),                                            // litres of absolute alcohol (for spirits)
  ratePerLitre: real("rate_per_litre"),
  ratePerLoa: real("rate_per_loa"),
  exciseAmount: real("excise_amount").notNull().default(0),    // TZS
  vatAmount: real("vat_amount").notNull().default(0),
  reference: text("reference"),                                // import declaration / export docket / still run
  movedAt: integer("moved_at", { mode: "timestamp_ms" }).notNull(),
  declarationId: text("declaration_id"),                        // set once included in a statutory declaration
  status: text("status").notNull().default("POSTED"),          // DRAFT, POSTED, REVERSED
  notes: text("notes"),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ─────────────────────────────────────────
// Statutory excise declarations (monthly TRA filing).
// Aggregates duty-paid removals + production volumes for a period.
// ─────────────────────────────────────────
export const exciseDeclarations = sqliteTable("excise_declaration", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),                           // ED-2024-04
  periodStart: integer("period_start", { mode: "timestamp_ms" }).notNull(),
  periodEnd: integer("period_end", { mode: "timestamp_ms" }).notNull(),
  periodLabel: text("period_label").notNull(),                // "2024-04"
  status: text("status").notNull().default("DRAFT"),          // DRAFT, SUBMITTED, PAID, ACCEPTED, REJECTED
  totalLitres: real("total_litres").notNull().default(0),
  totalLoa: real("total_loa").notNull().default(0),
  totalExcise: real("total_excise").notNull().default(0),
  totalVat: real("total_vat").notNull().default(0),
  submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  traReference: text("tra_reference"),
  notes: text("notes"),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// Breakdown rows per product class inside a declaration (audit & reprint).
export const exciseDeclarationLines = sqliteTable("excise_declaration_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  declarationId: text("declaration_id").notNull().references(() => exciseDeclarations.id, { onDelete: "cascade" }),
  productClass: text("product_class").notNull(),
  productId: text("product_id").references(() => products.id),
  qtyLitres: real("qty_litres").notNull().default(0),
  qtyLoa: real("qty_loa").notNull().default(0),
  exciseAmount: real("excise_amount").notNull().default(0),
  vatAmount: real("vat_amount").notNull().default(0),
  movementCount: integer("movement_count").notNull().default(0),
});
