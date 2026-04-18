import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { products, suppliers, warehouses } from "./masters";

export const purchaseOrders = sqliteTable("purchase_order", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  warehouseId: text("warehouse_id").references(() => warehouses.id),
  orderDate: integer("order_date", { mode: "timestamp_ms" }).notNull(),
  expectedDate: integer("expected_date", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("DRAFT"),  // DRAFT, APPROVED, SENT, PARTIAL, RECEIVED, CANCELLED
  subtotal: real("subtotal").notNull().default(0),
  taxTotal: real("tax_total").notNull().default(0),
  total: real("total").notNull().default(0),
  currency: text("currency").notNull().default("TZS"),
  notes: text("notes"),
  createdById: text("created_by_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const purchaseOrderLines = sqliteTable("purchase_order_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  poId: text("po_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  qty: real("qty").notNull(),
  qtyReceived: real("qty_received").notNull().default(0),
  unitPrice: real("unit_price").notNull(),
  taxRate: real("tax_rate").notNull().default(0),
  lineTotal: real("line_total").notNull(),
});

export const goodsReceipts = sqliteTable("goods_receipt", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  poId: text("po_id").references(() => purchaseOrders.id),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  receivedDate: integer("received_date", { mode: "timestamp_ms" }).notNull(),
  status: text("status").notNull().default("DRAFT"),
  notes: text("notes"),
  createdById: text("created_by_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const goodsReceiptLines = sqliteTable("goods_receipt_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  grnId: text("grn_id").notNull().references(() => goodsReceipts.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  qty: real("qty").notNull(),
  unitCost: real("unit_cost").notNull(),
  batchNumber: text("batch_number"),
  expiryDate: integer("expiry_date", { mode: "timestamp_ms" }),
});
