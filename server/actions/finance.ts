"use server";

import { z } from "zod";
import { and, eq, desc, sql, inArray, lt, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  invoices, invoicePayments, customers,
  supplierInvoices, suppliers,
  exciseDeclarations,
} from "@/db/schema";
import { getActiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const strOpt = z.string().optional().or(z.literal("")).transform((v) => v || undefined);
const numPos = z.preprocess((v) => Number(v), z.number().positive());
const dateReq = z.preprocess((v) => new Date(String(v)), z.date());

// ============================================================
// RECEIVABLES — customer aging
// ============================================================
type AgingBucket = "CURRENT" | "D1_30" | "D31_60" | "D61_90" | "D90PLUS";
const BUCKETS: AgingBucket[] = ["CURRENT", "D1_30", "D31_60", "D61_90", "D90PLUS"];

function ageBucket(dueDate: Date | null, today: Date): AgingBucket {
  if (!dueDate) return "CURRENT";
  const days = Math.floor((today.getTime() - dueDate.getTime()) / 86400000);
  if (days <= 0) return "CURRENT";
  if (days <= 30) return "D1_30";
  if (days <= 60) return "D31_60";
  if (days <= 90) return "D61_90";
  return "D90PLUS";
}

export async function listReceivables() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return { rows: [], totals: {} as Record<string, number> };
  const rows = await db.select({
    invoice: invoices,
    customer: { id: customers.id, code: customers.code, name: customers.name, phone: customers.phone },
  })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(
      eq(invoices.companyId, companyId),
      inArray(invoices.status, ["UNPAID", "PARTIAL"]),
    ))
    .orderBy(invoices.dueDate);

  const today = new Date();
  const enriched = rows.map((r) => {
    const outstanding = r.invoice.total - r.invoice.amountPaid;
    const bucket = ageBucket(r.invoice.dueDate, today);
    return { ...r, outstanding, bucket };
  });

  const totals: Record<string, number> = { CURRENT: 0, D1_30: 0, D31_60: 0, D61_90: 0, D90PLUS: 0, TOTAL: 0 };
  for (const r of enriched) {
    totals[r.bucket] += r.outstanding;
    totals.TOTAL += r.outstanding;
  }
  return { rows: enriched, totals };
}

/** Group outstanding by customer. */
export async function customerBalances() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    customerId: invoices.customerId,
    customerName: customers.name,
    customerCode: customers.code,
    creditLimit: customers.creditLimit,
    outstanding: sql<number>`COALESCE(SUM(${invoices.total} - ${invoices.amountPaid}), 0)`,
    openInvoices: sql<number>`COUNT(*)`,
  })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .where(and(
      eq(invoices.companyId, companyId),
      inArray(invoices.status, ["UNPAID", "PARTIAL"]),
    ))
    .groupBy(invoices.customerId, customers.name, customers.code, customers.creditLimit)
    .orderBy(sql`SUM(${invoices.total} - ${invoices.amountPaid}) DESC`);
}

// ============================================================
// PAYABLES — supplier aging
// ============================================================
export async function listPayables() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return { rows: [], totals: {} as Record<string, number> };
  const rows = await db.select({
    invoice: supplierInvoices,
    supplier: { id: suppliers.id, code: suppliers.code, name: suppliers.name },
  })
    .from(supplierInvoices)
    .leftJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
    .where(and(
      eq(supplierInvoices.companyId, companyId),
      inArray(supplierInvoices.status, ["APPROVED", "PARTIAL", "RECEIVED"]),
    ))
    .orderBy(supplierInvoices.dueDate);

  const today = new Date();
  const enriched = rows.map((r) => {
    const outstanding = r.invoice.total - r.invoice.paidAmount;
    const bucket = ageBucket(r.invoice.dueDate, today);
    return { ...r, outstanding, bucket };
  });

  const totals: Record<string, number> = { CURRENT: 0, D1_30: 0, D31_60: 0, D61_90: 0, D90PLUS: 0, TOTAL: 0 };
  for (const r of enriched) {
    totals[r.bucket] += r.outstanding;
    totals.TOTAL += r.outstanding;
  }
  return { rows: enriched, totals };
}

const PayBillSchema = z.object({
  invoiceId: z.string().min(1),
  paidAt: dateReq,
  amount: numPos,
  method: z.enum(["CASH", "BANK", "MOBILE_MONEY", "CHEQUE"]),
  reference: strOpt,
});

export async function paySupplierBill(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.FINANCE_WRITE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(PayBillSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const d = parsed.data;
  const [inv] = await db.select().from(supplierInvoices)
    .where(and(eq(supplierInvoices.id, d.invoiceId), eq(supplierInvoices.companyId, companyId)));
  if (!inv) return { ok: false, error: "Invoice not found" };
  const newPaid = inv.paidAmount + d.amount;
  const status = newPaid >= inv.total ? "PAID" : newPaid > 0 ? "PARTIAL" : inv.status;
  await db.update(supplierInvoices).set({ paidAmount: newPaid, status }).where(eq(supplierInvoices.id, d.invoiceId));
  revalidatePath("/finance/payables");
  return { ok: true };
}

// ============================================================
// TAX — VAT summary for period
// ============================================================
export async function taxSummary(periodStart?: Date, periodEnd?: Date) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return null;
  const now = new Date();
  const start = periodStart ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const end = periodEnd ?? new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [outAgg] = await db.select({
    vat: sql<number>`COALESCE(SUM(${invoices.taxTotal}), 0)`,
    excise: sql<number>`COALESCE(SUM(${invoices.exciseTotal}), 0)`,
    net: sql<number>`COALESCE(SUM(${invoices.subtotal}), 0)`,
    count: sql<number>`COUNT(*)`,
  })
    .from(invoices)
    .where(and(
      eq(invoices.companyId, companyId),
      gte(invoices.invoiceDate, start),
      lt(invoices.invoiceDate, end),
    ));

  const [inAgg] = await db.select({
    vat: sql<number>`COALESCE(SUM(${supplierInvoices.taxTotal}), 0)`,
    net: sql<number>`COALESCE(SUM(${supplierInvoices.subtotal}), 0)`,
    count: sql<number>`COUNT(*)`,
  })
    .from(supplierInvoices)
    .where(and(
      eq(supplierInvoices.companyId, companyId),
      gte(supplierInvoices.invoiceDate, start),
      lt(supplierInvoices.invoiceDate, end),
    ));

  const [exciseDecl] = await db.select({
    totalExcise: sql<number>`COALESCE(SUM(${exciseDeclarations.totalExcise}), 0)`,
    count: sql<number>`COUNT(*)`,
  })
    .from(exciseDeclarations)
    .where(and(
      eq(exciseDeclarations.companyId, companyId),
      gte(exciseDeclarations.periodStart, start),
      lt(exciseDeclarations.periodStart, end),
    ));

  return {
    periodStart: start,
    periodEnd: end,
    outputVat: outAgg.vat ?? 0,
    outputNet: outAgg.net ?? 0,
    outputExcise: outAgg.excise ?? 0,
    outputInvoiceCount: outAgg.count ?? 0,
    inputVat: inAgg.vat ?? 0,
    inputNet: inAgg.net ?? 0,
    inputInvoiceCount: inAgg.count ?? 0,
    netVatPayable: (outAgg.vat ?? 0) - (inAgg.vat ?? 0),
    exciseDeclared: exciseDecl?.totalExcise ?? 0,
    exciseDeclarationCount: exciseDecl?.count ?? 0,
  };
}

// ============================================================
// FINANCE STATS
// ============================================================
export async function financeStats() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return null;
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
  const today = new Date();
  const [arOverdue] = await db.select({
    amt: sql<number>`COALESCE(SUM(${invoices.total} - ${invoices.amountPaid}), 0)`,
  })
    .from(invoices)
    .where(and(
      eq(invoices.companyId, companyId),
      inArray(invoices.status, ["UNPAID", "PARTIAL"]),
      lt(invoices.dueDate, today),
    ));
  return {
    receivables: ar.outstanding ?? 0,
    payables: ap.outstanding ?? 0,
    overdueReceivables: arOverdue.amt ?? 0,
    workingCapital: (ar.outstanding ?? 0) - (ap.outstanding ?? 0),
  };
}
