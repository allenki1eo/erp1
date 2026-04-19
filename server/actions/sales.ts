"use server";

import { z } from "zod";
import { and, eq, desc, sql, inArray, gte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  salesOrders, salesOrderLines, invoices, invoicePayments,
  customers, products, routes, warehouses, customerVisits,
} from "@/db/schema";
import { getActiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { requirePermission, PERMISSIONS, hasPermission } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const strOpt = z.string().optional().or(z.literal("")).transform((v) => v || undefined);
const numPos = z.preprocess((v) => Number(v), z.number().positive());
const numOr0 = z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().nonnegative());
const dateReq = z.preprocess((v) => new Date(String(v)), z.date());
const dateOpt = z.preprocess((v) => (v === "" || v == null ? undefined : new Date(String(v))), z.date().optional());

// ============================================================
// NUMBERING
// ============================================================
async function nextOrderNumber(companyId: string) {
  const year = new Date().getFullYear();
  const prefix = `SO-${year}-`;
  const rows = await db.select({ n: salesOrders.number }).from(salesOrders)
    .where(and(eq(salesOrders.companyId, companyId), sql`${salesOrders.number} LIKE ${prefix + "%"}`));
  const max = rows.reduce((m, r) => {
    const seq = parseInt(r.n.split("-").pop() ?? "0", 10);
    return seq > m ? seq : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

async function nextInvoiceNumber(companyId: string) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const rows = await db.select({ n: invoices.number }).from(invoices)
    .where(and(eq(invoices.companyId, companyId), sql`${invoices.number} LIKE ${prefix + "%"}`));
  const max = rows.reduce((m, r) => {
    const seq = parseInt(r.n.split("-").pop() ?? "0", 10);
    return seq > m ? seq : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

// ============================================================
// SALES ORDERS
// ============================================================
const OrderSchema = z.object({
  customerId: z.string().min(1, "Customer required"),
  warehouseId: strOpt,
  routeId: strOpt,
  orderDate: dateReq,
  deliveryDate: dateOpt,
  notes: strOpt,
});

/** Sales rep scoping: SALES_OWN sees only their own orders. */
async function scopedOrderFilter(companyId: string) {
  const conditions = [eq(salesOrders.companyId, companyId)];
  const canSeeAll = await hasPermission(PERMISSIONS.SALES_MANAGE);
  if (!canSeeAll) {
    const user = await getCurrentUser();
    if (user) conditions.push(eq(salesOrders.salesRepId, user.id));
  }
  return conditions;
}

export async function listOrders(status?: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const conditions = await scopedOrderFilter(companyId);
  if (status) conditions.push(eq(salesOrders.status, status));
  return db.select({
    order: salesOrders,
    customer: { id: customers.id, code: customers.code, name: customers.name },
  })
    .from(salesOrders)
    .leftJoin(customers, eq(salesOrders.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(salesOrders.orderDate))
    .limit(200);
}

export async function getOrder(id: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return null;
  const [order] = await db.select().from(salesOrders)
    .where(and(eq(salesOrders.id, id), eq(salesOrders.companyId, companyId)));
  if (!order) return null;
  const lines = await db.select({
    line: salesOrderLines,
    product: { id: products.id, sku: products.sku, name: products.name, uom: products.uom },
  })
    .from(salesOrderLines)
    .leftJoin(products, eq(salesOrderLines.productId, products.id))
    .where(eq(salesOrderLines.orderId, id));
  const [customer] = await db.select().from(customers).where(eq(customers.id, order.customerId));
  return { order, lines, customer };
}

export async function createOrder(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const canManage = await hasPermission(PERMISSIONS.SALES_MANAGE);
  const canOwn = await hasPermission(PERMISSIONS.SALES_OWN);
  if (!canManage && !canOwn) return { ok: false, error: "Forbidden" };

  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const user = await getCurrentUser();
  const parsed = fromFormData(OrderSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);

  const number = await nextOrderNumber(companyId);
  const [row] = await db.insert(salesOrders).values({
    ...parsed.data,
    companyId,
    number,
    salesRepId: user?.id,
    createdById: user?.id,
  }).returning({ id: salesOrders.id });

  revalidatePath("/sales/orders");
  return { ok: true, data: { id: row.id } };
}

const OrderLineSchema = z.object({
  orderId: z.string().min(1),
  productId: z.string().min(1),
  qty: numPos,
  uom: z.string().min(1),
  unitPrice: numPos,
  discount: numOr0,
  taxRate: numOr0.default(0),
});

async function recalcOrder(orderId: string) {
  const lines = await db.select().from(salesOrderLines).where(eq(salesOrderLines.orderId, orderId));
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxTotal = lines.reduce((s, l) => s + l.lineTotal * l.taxRate, 0);
  const discountTotal = lines.reduce((s, l) => s + (l.discount ?? 0), 0);
  const total = subtotal + taxTotal;
  await db.update(salesOrders).set({ subtotal, taxTotal, discountTotal, total }).where(eq(salesOrders.id, orderId));
}

export async function addOrderLine(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const canManage = await hasPermission(PERMISSIONS.SALES_MANAGE);
  const canOwn = await hasPermission(PERMISSIONS.SALES_OWN);
  if (!canManage && !canOwn) return { ok: false, error: "Forbidden" };
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(OrderLineSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const d = parsed.data;

  const [order] = await db.select().from(salesOrders)
    .where(and(eq(salesOrders.id, d.orderId), eq(salesOrders.companyId, companyId)));
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status !== "DRAFT") return { ok: false, error: "Order locked" };

  const lineTotal = (d.qty * d.unitPrice) - d.discount;
  await db.insert(salesOrderLines).values({ ...d, lineTotal });
  await recalcOrder(d.orderId);
  revalidatePath(`/sales/orders/${d.orderId}`);
  return { ok: true };
}

export async function deleteOrderLine(id: string): Promise<ActionResult> {
  const canManage = await hasPermission(PERMISSIONS.SALES_MANAGE);
  const canOwn = await hasPermission(PERMISSIONS.SALES_OWN);
  if (!canManage && !canOwn) return { ok: false, error: "Forbidden" };
  const [line] = await db.select().from(salesOrderLines).where(eq(salesOrderLines.id, id));
  if (!line) return { ok: false, error: "Not found" };
  await db.delete(salesOrderLines).where(eq(salesOrderLines.id, id));
  await recalcOrder(line.orderId);
  revalidatePath(`/sales/orders/${line.orderId}`);
  return { ok: true };
}

export async function confirmOrder(id: string): Promise<ActionResult> {
  const canManage = await hasPermission(PERMISSIONS.SALES_MANAGE);
  const canOwn = await hasPermission(PERMISSIONS.SALES_OWN);
  if (!canManage && !canOwn) return { ok: false, error: "Forbidden" };
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const [order] = await db.select().from(salesOrders)
    .where(and(eq(salesOrders.id, id), eq(salesOrders.companyId, companyId)));
  if (!order) return { ok: false, error: "Not found" };
  if (order.status !== "DRAFT") return { ok: false, error: "Already confirmed" };

  // Credit limit check
  const [cust] = await db.select().from(customers).where(eq(customers.id, order.customerId));
  if (cust?.creditLimit && cust.creditLimit > 0) {
    const openInvoices = await db.select({ bal: sql<number>`COALESCE(SUM(${invoices.total} - ${invoices.amountPaid}), 0)` })
      .from(invoices)
      .where(and(eq(invoices.customerId, cust.id), inArray(invoices.status, ["UNPAID", "PARTIAL"])));
    const outstanding = openInvoices[0]?.bal ?? 0;
    if (outstanding + order.total > cust.creditLimit) {
      return { ok: false, error: `Credit limit exceeded (outstanding ${outstanding} + order ${order.total} > limit ${cust.creditLimit})` };
    }
  }
  await db.update(salesOrders).set({ status: "CONFIRMED" }).where(eq(salesOrders.id, id));
  revalidatePath(`/sales/orders/${id}`);
  revalidatePath("/sales/orders");
  return { ok: true };
}

export async function invoiceOrder(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.SALES_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const [order] = await db.select().from(salesOrders)
    .where(and(eq(salesOrders.id, id), eq(salesOrders.companyId, companyId)));
  if (!order) return { ok: false, error: "Not found" };
  if (order.status === "INVOICED") return { ok: false, error: "Already invoiced" };
  if (order.status === "DRAFT") return { ok: false, error: "Confirm the order first" };

  const number = await nextInvoiceNumber(companyId);
  const [cust] = await db.select().from(customers).where(eq(customers.id, order.customerId));
  const dueDate = cust?.paymentTerms && cust.paymentTerms > 0
    ? new Date(order.orderDate.getTime() + cust.paymentTerms * 86400000)
    : null;

  await db.insert(invoices).values({
    companyId,
    number,
    orderId: order.id,
    customerId: order.customerId,
    salesRepId: order.salesRepId,
    invoiceDate: new Date(),
    dueDate,
    subtotal: order.subtotal,
    taxTotal: order.taxTotal,
    exciseTotal: order.exciseTotal,
    total: order.total,
    currency: order.currency,
  });
  await db.update(salesOrders).set({ status: "INVOICED" }).where(eq(salesOrders.id, id));
  revalidatePath(`/sales/orders/${id}`);
  revalidatePath("/sales/invoices");
  return { ok: true };
}

export async function cancelOrder(id: string): Promise<ActionResult> {
  const canManage = await hasPermission(PERMISSIONS.SALES_MANAGE);
  const canOwn = await hasPermission(PERMISSIONS.SALES_OWN);
  if (!canManage && !canOwn) return { ok: false, error: "Forbidden" };
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.update(salesOrders).set({ status: "CANCELLED" })
    .where(and(eq(salesOrders.id, id), eq(salesOrders.companyId, companyId)));
  revalidatePath("/sales/orders");
  return { ok: true };
}

// ============================================================
// INVOICES
// ============================================================
export async function listInvoices(status?: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const conditions = [eq(invoices.companyId, companyId)];
  if (status) conditions.push(eq(invoices.status, status));
  return db.select({
    invoice: invoices,
    customer: { id: customers.id, code: customers.code, name: customers.name },
  })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(invoices.invoiceDate))
    .limit(300);
}

const PaymentSchema = z.object({
  invoiceId: z.string().min(1),
  paidAt: dateReq,
  amount: numPos,
  method: z.enum(["CASH", "BANK", "MOBILE_MONEY", "CHEQUE"]),
  reference: strOpt,
});

export async function recordPayment(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.FINANCE_WRITE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const user = await getCurrentUser();
  const parsed = fromFormData(PaymentSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const d = parsed.data;

  const [inv] = await db.select().from(invoices)
    .where(and(eq(invoices.id, d.invoiceId), eq(invoices.companyId, companyId)));
  if (!inv) return { ok: false, error: "Invoice not found" };
  if (inv.status === "VOID") return { ok: false, error: "Invoice is void" };

  await db.insert(invoicePayments).values({ ...d, receivedById: user?.id });
  const newPaid = inv.amountPaid + d.amount;
  const status = newPaid >= inv.total ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";
  await db.update(invoices).set({ amountPaid: newPaid, status })
    .where(eq(invoices.id, d.invoiceId));
  revalidatePath("/sales/invoices");
  revalidatePath("/finance/receivables");
  return { ok: true };
}

// ============================================================
// REFERENCE LOOKUPS
// ============================================================
export async function listCustomersForSelect() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({ id: customers.id, code: customers.code, name: customers.name, creditLimit: customers.creditLimit, paymentTerms: customers.paymentTerms })
    .from(customers)
    .where(and(eq(customers.companyId, companyId), eq(customers.isActive, true)))
    .orderBy(customers.name);
}

export async function listFinishedGoodsForSelect() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({ id: products.id, sku: products.sku, name: products.name, uom: products.uom, sellingPrice: products.sellingPrice })
    .from(products)
    .where(and(
      eq(products.companyId, companyId),
      eq(products.isActive, true),
      eq(products.type, "FINISHED_GOOD"),
    ))
    .orderBy(products.name);
}

export async function listRoutesForSelect() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select().from(routes).where(eq(routes.companyId, companyId)).orderBy(routes.name);
}

// ============================================================
// STATS (dashboard)
// ============================================================
export async function salesStats() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return null;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const user = await getCurrentUser();
  const canSeeAll = await hasPermission(PERMISSIONS.SALES_MANAGE);

  const base = [eq(salesOrders.companyId, companyId), gte(salesOrders.orderDate, monthStart)];
  if (!canSeeAll && user) base.push(eq(salesOrders.salesRepId, user.id));

  const [orderAgg] = await db.select({
    count: sql<number>`COUNT(*)`,
    total: sql<number>`COALESCE(SUM(${salesOrders.total}), 0)`,
  }).from(salesOrders).where(and(...base));

  const invBase = [eq(invoices.companyId, companyId)];
  if (!canSeeAll && user) invBase.push(eq(invoices.salesRepId, user.id));
  const [arAgg] = await db.select({
    outstanding: sql<number>`COALESCE(SUM(${invoices.total} - ${invoices.amountPaid}), 0)`,
  }).from(invoices).where(and(...invBase, inArray(invoices.status, ["UNPAID", "PARTIAL"])));

  const visitBase = [eq(customerVisits.companyId, companyId), gte(customerVisits.visitedAt, monthStart)];
  if (!canSeeAll && user) visitBase.push(eq(customerVisits.salesRepId, user.id));
  const [visitAgg] = await db.select({
    count: sql<number>`COUNT(*)`,
  }).from(customerVisits).where(and(...visitBase));

  return {
    ordersMtd: orderAgg.count ?? 0,
    salesMtd: orderAgg.total ?? 0,
    outstanding: arAgg.outstanding ?? 0,
    visitsMtd: visitAgg.count ?? 0,
  };
}

export async function topCustomersMtd() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return db.select({
    customerId: salesOrders.customerId,
    customerName: customers.name,
    total: sql<number>`COALESCE(SUM(${salesOrders.total}), 0)`,
    orderCount: sql<number>`COUNT(*)`,
  })
    .from(salesOrders)
    .innerJoin(customers, eq(salesOrders.customerId, customers.id))
    .where(and(eq(salesOrders.companyId, companyId), gte(salesOrders.orderDate, monthStart)))
    .groupBy(salesOrders.customerId, customers.name)
    .orderBy(sql`SUM(${salesOrders.total}) DESC`)
    .limit(10);
}

export async function topProductsMtd() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return db.select({
    productId: salesOrderLines.productId,
    productName: products.name,
    sku: products.sku,
    qty: sql<number>`COALESCE(SUM(${salesOrderLines.qty}), 0)`,
    revenue: sql<number>`COALESCE(SUM(${salesOrderLines.lineTotal}), 0)`,
  })
    .from(salesOrderLines)
    .innerJoin(salesOrders, eq(salesOrderLines.orderId, salesOrders.id))
    .innerJoin(products, eq(salesOrderLines.productId, products.id))
    .where(and(eq(salesOrders.companyId, companyId), gte(salesOrders.orderDate, monthStart)))
    .groupBy(salesOrderLines.productId, products.name, products.sku)
    .orderBy(sql`SUM(${salesOrderLines.lineTotal}) DESC`)
    .limit(10);
}

// ============================================================
// CUSTOMER VISITS (salesperson portal)
// ============================================================
const VisitSchema = z.object({
  customerId: z.string().min(1),
  visitedAt: dateReq,
  outcome: z.enum(["ORDER", "NO_ORDER", "FOLLOW_UP", "COMPLAINT"]),
  orderId: strOpt,
  latitude: z.preprocess((v) => v === "" || v == null ? undefined : Number(v), z.number().optional()),
  longitude: z.preprocess((v) => v === "" || v == null ? undefined : Number(v), z.number().optional()),
  notes: strOpt,
});

export async function listVisits(onlyMine = true) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const conditions = [eq(customerVisits.companyId, companyId)];
  if (onlyMine) {
    const user = await getCurrentUser();
    if (user) conditions.push(eq(customerVisits.salesRepId, user.id));
  }
  return db.select({
    visit: customerVisits,
    customer: { id: customers.id, code: customers.code, name: customers.name },
  })
    .from(customerVisits)
    .leftJoin(customers, eq(customerVisits.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(customerVisits.visitedAt))
    .limit(200);
}

export async function logVisit(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const canManage = await hasPermission(PERMISSIONS.SALES_MANAGE);
  const canOwn = await hasPermission(PERMISSIONS.SALES_OWN);
  if (!canManage && !canOwn) return { ok: false, error: "Forbidden" };
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const parsed = fromFormData(VisitSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  await db.insert(customerVisits).values({ ...parsed.data, companyId, salesRepId: user.id });
  revalidatePath("/my-sales/visits");
  revalidatePath("/my-sales/dashboard");
  return { ok: true };
}

// ============================================================
// Warehouses (for order dispatch selector)
// ============================================================
export async function listWarehousesForSales() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({ id: warehouses.id, code: warehouses.code, name: warehouses.name })
    .from(warehouses)
    .where(and(eq(warehouses.companyId, companyId), eq(warehouses.isActive, true)))
    .orderBy(warehouses.name);
}
