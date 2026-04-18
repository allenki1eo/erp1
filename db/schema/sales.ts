import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { companies } from "./companies";
import { customers, products, routes, warehouses } from "./masters";
import { users } from "./auth";

export const salesOrders = sqliteTable("sales_order", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  salesRepId: text("sales_rep_id").references(() => users.id),
  warehouseId: text("warehouse_id").references(() => warehouses.id),
  routeId: text("route_id").references(() => routes.id),
  orderDate: integer("order_date", { mode: "timestamp_ms" }).notNull(),
  deliveryDate: integer("delivery_date", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("DRAFT"),  // DRAFT, CONFIRMED, PICKED, DELIVERED, INVOICED, CANCELLED
  subtotal: real("subtotal").notNull().default(0),
  discountTotal: real("discount_total").notNull().default(0),
  taxTotal: real("tax_total").notNull().default(0),
  exciseTotal: real("excise_total").notNull().default(0),
  total: real("total").notNull().default(0),
  currency: text("currency").notNull().default("TZS"),
  notes: text("notes"),
  createdById: text("created_by_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(sql`(unixepoch() * 1000)`),
});

export const salesOrderLines = sqliteTable("sales_order_line", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => salesOrders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  qty: real("qty").notNull(),
  uom: text("uom").notNull(),
  unitPrice: real("unit_price").notNull(),
  discount: real("discount").notNull().default(0),
  taxRate: real("tax_rate").notNull().default(0),
  exciseAmount: real("excise_amount").notNull().default(0),
  lineTotal: real("line_total").notNull(),
});

export const invoices = sqliteTable("invoice", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  orderId: text("order_id").references(() => salesOrders.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  salesRepId: text("sales_rep_id").references(() => users.id),
  invoiceDate: integer("invoice_date", { mode: "timestamp_ms" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp_ms" }),
  status: text("status").notNull().default("UNPAID"),   // UNPAID, PARTIAL, PAID, VOID
  subtotal: real("subtotal").notNull().default(0),
  taxTotal: real("tax_total").notNull().default(0),
  exciseTotal: real("excise_total").notNull().default(0),
  total: real("total").notNull().default(0),
  amountPaid: real("amount_paid").notNull().default(0),
  currency: text("currency").notNull().default("TZS"),
});

export const invoicePayments = sqliteTable("invoice_payment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }).notNull(),
  amount: real("amount").notNull(),
  method: text("method").notNull(),                // CASH, BANK, MOBILE_MONEY, CHEQUE
  reference: text("reference"),
  receivedById: text("received_by_id"),
});

export const customerVisits = sqliteTable("customer_visit", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  salesRepId: text("sales_rep_id").notNull().references(() => users.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  visitedAt: integer("visited_at", { mode: "timestamp_ms" }).notNull(),
  outcome: text("outcome").notNull(),              // ORDER, NO_ORDER, FOLLOW_UP, COMPLAINT
  orderId: text("order_id").references(() => salesOrders.id),
  latitude: real("latitude"),
  longitude: real("longitude"),
  notes: text("notes"),
});

export const salesReturns = sqliteTable("sales_return", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  number: text("number").notNull(),
  invoiceId: text("invoice_id").references(() => invoices.id),
  customerId: text("customer_id").notNull().references(() => customers.id),
  returnDate: integer("return_date", { mode: "timestamp_ms" }).notNull(),
  reason: text("reason"),
  total: real("total").notNull().default(0),
  status: text("status").notNull().default("DRAFT"),
});
