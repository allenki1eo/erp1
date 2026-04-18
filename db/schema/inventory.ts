import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { products, warehouses } from "./masters";
import { users } from "./auth";

// ─────────────────────────────────────────
// Bin / Rack locations within a warehouse
// ─────────────────────────────────────────
export const binLocations = sqliteTable("bin_location", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  code: text("code").notNull(),              // A-01-03 (aisle-rack-level)
  name: text("name"),
  zone: text("zone"),                        // RECEIVING, STORAGE, COLD, DISPATCH
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// ─────────────────────────────────────────
// Inventory Lots / Batches (one row = one lot)
// Populated by GRN confirm or production confirm
// ─────────────────────────────────────────
export const stockBatches = sqliteTable("stock_batch", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  lotNumber: text("lot_number").notNull(),
  batchNumber: text("batch_number"),                            // production batch ref
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  binId: text("bin_id").references(() => binLocations.id),
  qtyOnHand: real("qty_on_hand").notNull().default(0),
  qtyReserved: real("qty_reserved").notNull().default(0),       // reserved for orders
  uom: text("uom").notNull(),
  manufacturedOn: integer("manufactured_on", { mode: "timestamp_ms" }),
  expiryDate: integer("expiry_date", { mode: "timestamp_ms" }),
  unitCost: real("unit_cost").default(0),
  source: text("source").notNull().default("PURCHASE"),         // PURCHASE, PRODUCTION, ADJUSTMENT
  sourceRef: text("source_ref"),                                // GRN id or brew id
  status: text("status").notNull().default("AVAILABLE"),        // AVAILABLE, ON_HOLD, QUARANTINE, EXPIRED, DEPLETED
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ─────────────────────────────────────────
// Stock Movements — immutable ledger
// ─────────────────────────────────────────
export const stockMovements = sqliteTable("stock_movement", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  batchId: text("batch_id").references(() => stockBatches.id),
  productId: text("product_id").notNull().references(() => products.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  binId: text("bin_id").references(() => binLocations.id),
  type: text("type").notNull(),              // GRN_IN, PRODUCTION_IN, SALE_OUT, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT, STOCKTAKE_ADJ, RETURN_IN
  refType: text("ref_type"),                 // GRN, SO, TRANSFER, STOCKTAKE, PRODUCTION
  refId: text("ref_id"),
  qty: real("qty").notNull(),                // positive = in, negative = out
  unitCost: real("unit_cost"),
  notes: text("notes"),
  transactedById: text("transacted_by_id").references(() => users.id),
  transactedAt: integer("transacted_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

// ─────────────────────────────────────────
// Stock Balances — maintained summary (product × lot × warehouse)
// Updated atomically with every stockMovements insert
// ─────────────────────────────────────────
export const stockBalances = sqliteTable("stock_balance", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  qty: real("qty").notNull().default(0),
  unitCost: real("unit_cost").default(0),   // weighted average
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
}, (t) => [unique().on(t.companyId, t.productId, t.warehouseId)]);

// ─────────────────────────────────────────
// Warehouse Transfers
// ─────────────────────────────────────────
export const stockTransfers = sqliteTable("stock_transfer", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),                              // TRF-2024-0001
  fromWarehouseId: text("from_warehouse_id").notNull().references(() => warehouses.id),
  toWarehouseId: text("to_warehouse_id").notNull().references(() => warehouses.id),
  transferredAt: integer("transferred_at", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("DRAFT"),             // DRAFT, IN_TRANSIT, RECEIVED, CANCELLED
  notes: text("notes"),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const stockTransferLines = sqliteTable("stock_transfer_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  transferId: text("transfer_id").notNull().references(() => stockTransfers.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  batchId: text("batch_id").references(() => stockBatches.id),
  fromBinId: text("from_bin_id").references(() => binLocations.id),
  toBinId: text("to_bin_id").references(() => binLocations.id),
  qty: real("qty").notNull(),
  unitCost: real("unit_cost").default(0),
  notes: text("notes"),
});

// ─────────────────────────────────────────
// Stock Takes (physical inventory count)
// ─────────────────────────────────────────
export const stockTakes = sqliteTable("stock_take", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),                              // ST-2024-0001
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  takenAt: integer("taken_at", { mode: "timestamp_ms" }).notNull(),
  status: text("status").notNull().default("DRAFT"),             // DRAFT, IN_PROGRESS, CONFIRMED
  notes: text("notes"),
  conductedById: text("conducted_by_id").references(() => users.id),
  confirmedById: text("confirmed_by_id").references(() => users.id),
  confirmedAt: integer("confirmed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const stockTakeLines = sqliteTable("stock_take_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  stockTakeId: text("stock_take_id").notNull().references(() => stockTakes.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  batchId: text("batch_id").references(() => stockBatches.id),
  binId: text("bin_id").references(() => binLocations.id),
  systemQty: real("system_qty").notNull().default(0),
  countedQty: real("counted_qty"),
  variance: real("variance"),                                    // counted - system
  unitCost: real("unit_cost").default(0),
  varianceCost: real("variance_cost").default(0),
  notes: text("notes"),
});
