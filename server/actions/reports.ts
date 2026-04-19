"use server";

import { and, eq, desc, sql, inArray, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  salesOrders, salesOrderLines, invoices,
  stockBalances, products, warehouses,
  brews, distillations, bottlingRuns,
  supplierInvoices,
  exciseDeclarations,
} from "@/db/schema";
import { getActiveCompanyId } from "@/lib/tenant";

export async function reportsOverview() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return null;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [sales] = await db.select({
    count: sql<number>`COUNT(*)`,
    total: sql<number>`COALESCE(SUM(${salesOrders.total}), 0)`,
  }).from(salesOrders).where(and(eq(salesOrders.companyId, companyId), gte(salesOrders.orderDate, monthStart)));

  const [ar] = await db.select({
    outstanding: sql<number>`COALESCE(SUM(${invoices.total} - ${invoices.amountPaid}), 0)`,
  })
    .from(invoices)
    .where(and(eq(invoices.companyId, companyId), inArray(invoices.status, ["UNPAID", "PARTIAL"])));

  const [ap] = await db.select({
    outstanding: sql<number>`COALESCE(SUM(${supplierInvoices.total} - ${supplierInvoices.paidAmount}), 0)`,
  })
    .from(supplierInvoices)
    .where(and(
      eq(supplierInvoices.companyId, companyId),
      inArray(supplierInvoices.status, ["APPROVED", "PARTIAL", "RECEIVED"]),
    ));

  const [inv] = await db.select({
    stockValue: sql<number>`COALESCE(SUM(${stockBalances.qty} * COALESCE(${stockBalances.unitCost}, 0)), 0)`,
  })
    .from(stockBalances)
    .where(eq(stockBalances.companyId, companyId));

  const [prodBrews] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(brews).where(and(eq(brews.companyId, companyId), gte(brews.startDate, monthStart)));
  const [prodDist] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(distillations).where(and(eq(distillations.companyId, companyId), gte(distillations.startDate, monthStart)));
  const [prodBottle] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(bottlingRuns).where(and(eq(bottlingRuns.companyId, companyId), gte(bottlingRuns.startDate, monthStart)));

  const [excise] = await db.select({
    total: sql<number>`COALESCE(SUM(${exciseDeclarations.totalExcise}), 0)`,
    count: sql<number>`COUNT(*)`,
  })
    .from(exciseDeclarations)
    .where(and(eq(exciseDeclarations.companyId, companyId), gte(exciseDeclarations.periodStart, monthStart)));

  return {
    salesMtd: sales.total ?? 0,
    orderCount: sales.count ?? 0,
    receivables: ar.outstanding ?? 0,
    payables: ap.outstanding ?? 0,
    stockValue: inv.stockValue ?? 0,
    brewsMtd: prodBrews.count ?? 0,
    distillationsMtd: prodDist.count ?? 0,
    bottlingRunsMtd: prodBottle.count ?? 0,
    exciseDeclaredMtd: excise.total ?? 0,
  };
}

export async function salesByMonth(months = 6) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const since = new Date();
  since.setMonth(since.getMonth() - months + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await db.select({
    order: salesOrders,
  })
    .from(salesOrders)
    .where(and(eq(salesOrders.companyId, companyId), gte(salesOrders.orderDate, since)));

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }
  for (const { order } of rows) {
    const key = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + order.total);
  }
  return Array.from(buckets, ([period, total]) => ({ period, total }));
}

export async function stockValueByWarehouse() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    warehouseId: stockBalances.warehouseId,
    warehouseName: warehouses.name,
    qty: sql<number>`COALESCE(SUM(${stockBalances.qty}), 0)`,
    value: sql<number>`COALESCE(SUM(${stockBalances.qty} * COALESCE(${stockBalances.unitCost}, 0)), 0)`,
  })
    .from(stockBalances)
    .innerJoin(warehouses, eq(stockBalances.warehouseId, warehouses.id))
    .where(eq(stockBalances.companyId, companyId))
    .groupBy(stockBalances.warehouseId, warehouses.name)
    .orderBy(sql`SUM(${stockBalances.qty} * COALESCE(${stockBalances.unitCost}, 0)) DESC`);
}

export async function topSellingProducts(limit = 10) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const since = new Date();
  since.setMonth(since.getMonth() - 3);
  return db.select({
    productId: products.id,
    sku: products.sku,
    name: products.name,
    qty: sql<number>`COALESCE(SUM(${salesOrderLines.qty}), 0)`,
    revenue: sql<number>`COALESCE(SUM(${salesOrderLines.lineTotal}), 0)`,
  })
    .from(products)
    .innerJoin(salesOrderLines, eq(salesOrderLines.productId, products.id))
    .innerJoin(salesOrders, eq(salesOrderLines.orderId, salesOrders.id))
    .where(and(eq(salesOrders.companyId, companyId), gte(salesOrders.orderDate, since)))
    .groupBy(products.id, products.sku, products.name)
    .orderBy(sql`SUM(${salesOrderLines.lineTotal}) DESC`)
    .limit(limit);
}
