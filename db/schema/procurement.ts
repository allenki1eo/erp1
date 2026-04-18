import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { products, suppliers, warehouses } from "./masters";
import { users } from "./auth";

// ─────────────────────────────────────────
// Purchase Requisitions (internal request)
// ─────────────────────────────────────────
export const purchaseRequisitions = sqliteTable("purchase_requisition", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),                             // PR-2024-0001
  requestedById: text("requested_by_id").references(() => users.id),
  requestedAt: integer("requested_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
  requiredByDate: integer("required_by_date", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("DRAFT"),            // DRAFT, SUBMITTED, APPROVED, REJECTED, PO_RAISED
  approvedById: text("approved_by_id").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const purchaseRequisitionLines = sqliteTable("purchase_requisition_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  requisitionId: text("requisition_id").notNull().references(() => purchaseRequisitions.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id),
  description: text("description").notNull(),
  qty: real("qty").notNull(),
  uom: text("uom").notNull().default("PCS"),
  estimatedUnitCost: real("estimated_unit_cost").default(0),
  estimatedTotal: real("estimated_total").default(0),
  notes: text("notes"),
  status: text("status").notNull().default("PENDING"),          // PENDING, ORDERED, CANCELLED
});

// ─────────────────────────────────────────
// Purchase Orders
// ─────────────────────────────────────────
export const purchaseOrders = sqliteTable("purchase_order", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),                             // PO-2024-0001
  requisitionId: text("requisition_id").references(() => purchaseRequisitions.id),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  warehouseId: text("warehouse_id").references(() => warehouses.id),
  orderDate: integer("order_date", { mode: "timestamp_ms" }).notNull(),
  expectedDate: integer("expected_date", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("DRAFT"),            // DRAFT, APPROVED, SENT, PARTIAL, RECEIVED, CANCELLED
  subtotal: real("subtotal").notNull().default(0),
  taxTotal: real("tax_total").notNull().default(0),
  total: real("total").notNull().default(0),
  currency: text("currency").notNull().default("TZS"),
  notes: text("notes"),
  approvedById: text("approved_by_id").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const purchaseOrderLines = sqliteTable("purchase_order_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  poId: text("po_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  requisitionLineId: text("requisition_line_id").references(() => purchaseRequisitionLines.id),
  productId: text("product_id").notNull().references(() => products.id),
  description: text("description"),
  qty: real("qty").notNull(),
  qtyReceived: real("qty_received").notNull().default(0),
  unitPrice: real("unit_price").notNull(),
  taxRate: real("tax_rate").notNull().default(0),
  lineTotal: real("line_total").notNull(),
});

// ─────────────────────────────────────────
// Goods Receipt Notes (GRN)
// ─────────────────────────────────────────
export const goodsReceipts = sqliteTable("goods_receipt", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),                             // GRN-2024-0001
  poId: text("po_id").references(() => purchaseOrders.id),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  receivedDate: integer("received_date", { mode: "timestamp_ms" }).notNull(),
  deliveryNoteNumber: text("delivery_note_number"),
  status: text("status").notNull().default("DRAFT"),            // DRAFT, CONFIRMED
  notes: text("notes"),
  receivedById: text("received_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const goodsReceiptLines = sqliteTable("goods_receipt_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  grnId: text("grn_id").notNull().references(() => goodsReceipts.id, { onDelete: "cascade" }),
  poLineId: text("po_line_id").references(() => purchaseOrderLines.id),
  productId: text("product_id").notNull().references(() => products.id),
  qtyOrdered: real("qty_ordered").default(0),
  qtyReceived: real("qty_received").notNull(),
  qtyRejected: real("qty_rejected").notNull().default(0),
  rejectionReason: text("rejection_reason"),
  unitCost: real("unit_cost").notNull(),
  lotNumber: text("lot_number"),
  batchNumber: text("batch_number"),
  manufacturedOn: integer("manufactured_on", { mode: "timestamp_ms" }),
  expiryDate: integer("expiry_date", { mode: "timestamp_ms" }),
  qcPassed: integer("qc_passed", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
});

// ─────────────────────────────────────────
// Supplier Invoices
// ─────────────────────────────────────────
export const supplierInvoices = sqliteTable("supplier_invoice", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  ourRef: text("our_ref").notNull(),                            // SI-2024-0001
  supplierInvoiceNumber: text("supplier_invoice_number"),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  poId: text("po_id").references(() => purchaseOrders.id),
  grnId: text("grn_id").references(() => goodsReceipts.id),
  invoiceDate: integer("invoice_date", { mode: "timestamp_ms" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("RECEIVED"),         // RECEIVED, APPROVED, PARTIAL, PAID, DISPUTED, VOID
  subtotal: real("subtotal").notNull().default(0),
  taxTotal: real("tax_total").notNull().default(0),
  total: real("total").notNull().default(0),
  paidAmount: real("paid_amount").notNull().default(0),
  currency: text("currency").notNull().default("TZS"),
  notes: text("notes"),
  approvedById: text("approved_by_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const supplierInvoiceLines = sqliteTable("supplier_invoice_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceId: text("invoice_id").notNull().references(() => supplierInvoices.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id),
  description: text("description").notNull(),
  qty: real("qty").notNull(),
  unitCost: real("unit_cost").notNull(),
  taxRate: real("tax_rate").notNull().default(0),
  lineTotal: real("line_total").notNull(),
});

// ─────────────────────────────────────────
// Supplier Performance Logs
// ─────────────────────────────────────────
export const supplierPerformanceLogs = sqliteTable("supplier_performance_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id),
  poId: text("po_id").references(() => purchaseOrders.id),
  grnId: text("grn_id").references(() => goodsReceipts.id),
  deliveryDaysPromised: integer("delivery_days_promised"),
  deliveryDaysActual: integer("delivery_days_actual"),
  qtyOrdered: real("qty_ordered"),
  qtyReceived: real("qty_received"),
  qtyRejected: real("qty_rejected").notNull().default(0),
  onTimeDelivery: integer("on_time_delivery", { mode: "boolean" }),
  qualityScore: real("quality_score"),                          // 0–100
  notes: text("notes"),
  recordedAt: integer("recorded_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});
