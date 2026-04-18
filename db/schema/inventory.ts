import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { products, warehouses } from "./masters";

export const stockBatches = sqliteTable("stock_batch", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  batchNumber: text("batch_number").notNull(),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  qtyOnHand: real("qty_on_hand").notNull().default(0),
  uom: text("uom").notNull(),
  manufactureDate: integer("manufacture_date", { mode: "timestamp_ms" }),
  expiryDate: integer("expiry_date", { mode: "timestamp_ms" }),
  unitCost: real("unit_cost").default(0),
  source: text("source"),                          // PRODUCTION, PURCHASE, ADJUSTMENT
  sourceRef: text("source_ref"),
  status: text("status").notNull().default("AVAILABLE"), // AVAILABLE, ON_HOLD, QUARANTINE, EXPIRED
});

export const stockMovements = sqliteTable("stock_movement", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  batchId: text("batch_id").references(() => stockBatches.id),
  productId: text("product_id").notNull().references(() => products.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  type: text("type").notNull(),                    // IN, OUT, TRANSFER, ADJUSTMENT
  refType: text("ref_type"),                       // GRN, SO, PRODUCTION, TRANSFER, ADJ
  refId: text("ref_id"),
  qty: real("qty").notNull(),
  unitCost: real("unit_cost"),
  notes: text("notes"),
  createdById: text("created_by_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const stockTransfers = sqliteTable("stock_transfer", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  fromWarehouseId: text("from_warehouse_id").notNull().references(() => warehouses.id),
  toWarehouseId: text("to_warehouse_id").notNull().references(() => warehouses.id),
  status: text("status").notNull().default("DRAFT"), // DRAFT, IN_TRANSIT, RECEIVED, CANCELLED
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const stockTransferLines = sqliteTable("stock_transfer_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  transferId: text("transfer_id").notNull().references(() => stockTransfers.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  batchId: text("batch_id").references(() => stockBatches.id),
  qty: real("qty").notNull(),
});
