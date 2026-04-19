"use server";

import { z } from "zod";
import { and, eq, desc, sql, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  purchaseRequisitions, purchaseRequisitionLines,
  purchaseOrders, purchaseOrderLines,
  goodsReceipts, goodsReceiptLines,
  supplierInvoices, supplierInvoiceLines,
  supplierPerformanceLogs,
  suppliers, products, warehouses, companies,
} from "@/db/schema";
import { stockBatches, stockMovements, stockBalances } from "@/db/schema";
import { getActiveCompanyId } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const numPos = z.preprocess((v) => Number(v), z.number().positive());
const numOr0 = z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().nonnegative());
const dateReq = z.preprocess((v) => new Date(String(v)), z.date());
const dateOpt = z.preprocess((v) => (v === "" || v == null ? undefined : new Date(String(v))), z.date().optional());
const strOpt = z.string().optional().or(z.literal("")).transform((v) => v || undefined);

/** Generate next sequential number: prefix + year + 4-digit seq */
async function nextNumber(table: "PR" | "PO" | "GRN" | "SI", companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${table}-${year}-`;
  const likePattern = prefix + "%";

  async function maxSeq(existing: string[]): Promise<number> {
    return existing.reduce((m, n) => {
      const seq = parseInt(n.split("-").pop() ?? "0", 10);
      return seq > m ? seq : m;
    }, 0);
  }

  let existing: string[];
  if (table === "PR") {
    const rows = await db.select({ n: purchaseRequisitions.number }).from(purchaseRequisitions)
      .where(and(eq(purchaseRequisitions.companyId, companyId), sql`${purchaseRequisitions.number} LIKE ${likePattern}`));
    existing = rows.map((r) => r.n);
  } else if (table === "PO") {
    const rows = await db.select({ n: purchaseOrders.number }).from(purchaseOrders)
      .where(and(eq(purchaseOrders.companyId, companyId), sql`${purchaseOrders.number} LIKE ${likePattern}`));
    existing = rows.map((r) => r.n);
  } else if (table === "GRN") {
    const rows = await db.select({ n: goodsReceipts.number }).from(goodsReceipts)
      .where(and(eq(goodsReceipts.companyId, companyId), sql`${goodsReceipts.number} LIKE ${likePattern}`));
    existing = rows.map((r) => r.n);
  } else {
    const rows = await db.select({ n: supplierInvoices.ourRef }).from(supplierInvoices)
      .where(and(eq(supplierInvoices.companyId, companyId), sql`${supplierInvoices.ourRef} LIKE ${likePattern}`));
    existing = rows.map((r) => r.n);
  }

  const max = await maxSeq(existing);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

async function recalcPO(poId: string) {
  const lines = await db.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.poId, poId));
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxTotal = lines.reduce((s, l) => s + l.lineTotal * l.taxRate, 0);
  await db.update(purchaseOrders).set({
    subtotal, taxTotal, total: subtotal + taxTotal,
  }).where(eq(purchaseOrders.id, poId));
}

async function recalcSI(invoiceId: string) {
  const lines = await db.select().from(supplierInvoiceLines).where(eq(supplierInvoiceLines.invoiceId, invoiceId));
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxTotal = lines.reduce((s, l) => s + l.lineTotal * l.taxRate, 0);
  await db.update(supplierInvoices).set({
    subtotal, taxTotal, total: subtotal + taxTotal,
  }).where(eq(supplierInvoices.id, invoiceId));
}

// ============================================================
// PURCHASE REQUISITIONS
// ============================================================
const PRSchema = z.object({
  id: strOpt,
  requiredByDate: dateOpt,
  notes: strOpt,
});

export async function listPRs() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const rows = await db.select({
    pr: purchaseRequisitions,
    lineCount: count(purchaseRequisitionLines.id),
  })
    .from(purchaseRequisitions)
    .leftJoin(purchaseRequisitionLines, eq(purchaseRequisitionLines.requisitionId, purchaseRequisitions.id))
    .where(eq(purchaseRequisitions.companyId, companyId))
    .groupBy(purchaseRequisitions.id)
    .orderBy(desc(purchaseRequisitions.createdAt));
  return rows;
}

export async function getPR(id: string) {
  const companyId = await getActiveCompanyId();
  const [pr] = await db.select().from(purchaseRequisitions)
    .where(and(eq(purchaseRequisitions.id, id), companyId ? eq(purchaseRequisitions.companyId, companyId) : sql`1=1`));
  if (!pr) return null;
  const lines = await db.select({ line: purchaseRequisitionLines, product: { id: products.id, sku: products.sku, name: products.name } })
    .from(purchaseRequisitionLines)
    .leftJoin(products, eq(purchaseRequisitionLines.productId, products.id))
    .where(eq(purchaseRequisitionLines.requisitionId, id));
  return { pr, lines };
}

export async function createPR(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(PRSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(purchaseRequisitions).set(data).where(eq(purchaseRequisitions.id, id));
  } else {
    const number = await nextNumber("PR", companyId);
    await db.insert(purchaseRequisitions).values({ ...data, companyId, number });
  }
  revalidatePath("/procurement/purchase-requisitions");
  return { ok: true };
}

export async function submitPR(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  await db.update(purchaseRequisitions).set({ status: "SUBMITTED" }).where(eq(purchaseRequisitions.id, id));
  revalidatePath("/procurement/purchase-requisitions");
  return { ok: true };
}

export async function approvePR(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_APPROVE);
  await db.update(purchaseRequisitions).set({ status: "APPROVED", approvedAt: new Date() }).where(eq(purchaseRequisitions.id, id));
  revalidatePath("/procurement/purchase-requisitions");
  return { ok: true };
}

export async function deletePR(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  await db.delete(purchaseRequisitions).where(eq(purchaseRequisitions.id, id));
  revalidatePath("/procurement/purchase-requisitions");
  return { ok: true };
}

const PRLineSchema = z.object({
  id: strOpt,
  requisitionId: z.string().min(1),
  productId: strOpt,
  description: z.string().min(1),
  qty: numPos,
  uom: z.string().default("PCS"),
  estimatedUnitCost: numOr0,
  notes: strOpt,
});

export async function upsertPRLine(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  const parsed = fromFormData(PRLineSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, estimatedUnitCost, qty, ...rest } = parsed.data;
  const estimatedTotal = qty * estimatedUnitCost;
  if (id) {
    await db.update(purchaseRequisitionLines).set({ ...rest, qty, estimatedUnitCost, estimatedTotal }).where(eq(purchaseRequisitionLines.id, id));
  } else {
    await db.insert(purchaseRequisitionLines).values({ ...rest, qty, estimatedUnitCost, estimatedTotal });
  }
  revalidatePath("/procurement/purchase-requisitions");
  return { ok: true };
}

export async function deletePRLine(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  await db.delete(purchaseRequisitionLines).where(eq(purchaseRequisitionLines.id, id));
  revalidatePath("/procurement/purchase-requisitions");
  return { ok: true };
}

// ============================================================
// PURCHASE ORDERS
// ============================================================
const POSchema = z.object({
  id: strOpt,
  supplierId: z.string().min(1, "Supplier required"),
  warehouseId: strOpt,
  requisitionId: strOpt,
  orderDate: dateReq,
  expectedDate: dateOpt,
  notes: strOpt,
});

export async function listPOs() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    po: purchaseOrders,
    supplier: { id: suppliers.id, name: suppliers.name, code: suppliers.code },
    lineCount: count(purchaseOrderLines.id),
  })
    .from(purchaseOrders)
    .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .leftJoin(purchaseOrderLines, eq(purchaseOrderLines.poId, purchaseOrders.id))
    .where(eq(purchaseOrders.companyId, companyId))
    .groupBy(purchaseOrders.id)
    .orderBy(desc(purchaseOrders.createdAt));
}

export async function getPO(id: string) {
  const companyId = await getActiveCompanyId();
  const [po] = await db.select({
    po: purchaseOrders,
    supplier: { id: suppliers.id, name: suppliers.name },
    warehouse: { id: warehouses.id, name: warehouses.name },
  })
    .from(purchaseOrders)
    .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .leftJoin(warehouses, eq(purchaseOrders.warehouseId, warehouses.id))
    .where(and(eq(purchaseOrders.id, id), companyId ? eq(purchaseOrders.companyId, companyId) : sql`1=1`));
  if (!po) return null;
  const lines = await db.select({
    line: purchaseOrderLines,
    product: { id: products.id, sku: products.sku, name: products.name, uom: products.uom },
  })
    .from(purchaseOrderLines)
    .leftJoin(products, eq(purchaseOrderLines.productId, products.id))
    .where(eq(purchaseOrderLines.poId, id));
  return { ...po, lines };
}

export async function upsertPO(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_WRITE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(POSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(purchaseOrders).set(data).where(eq(purchaseOrders.id, id));
  } else {
    const number = await nextNumber("PO", companyId);
    await db.insert(purchaseOrders).values({ ...data, companyId, number });
  }
  revalidatePath("/procurement/purchase-orders");
  return { ok: true };
}

export async function approvePO(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_APPROVE);
  await db.update(purchaseOrders).set({ status: "APPROVED", approvedAt: new Date() }).where(eq(purchaseOrders.id, id));
  revalidatePath("/procurement/purchase-orders");
  return { ok: true };
}

export async function deletePO(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_WRITE);
  await db.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
  revalidatePath("/procurement/purchase-orders");
  return { ok: true };
}

const POLineSchema = z.object({
  id: strOpt,
  poId: z.string().min(1),
  productId: z.string().min(1, "Product required"),
  description: strOpt,
  qty: numPos,
  unitPrice: numOr0,
  taxRate: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v) / 100), z.number().nonnegative()),
});

export async function upsertPOLine(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_WRITE);
  const parsed = fromFormData(POLineSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, qty, unitPrice, taxRate, ...rest } = parsed.data;
  const lineTotal = qty * unitPrice;
  if (id) {
    await db.update(purchaseOrderLines).set({ ...rest, qty, unitPrice, taxRate, lineTotal }).where(eq(purchaseOrderLines.id, id));
  } else {
    await db.insert(purchaseOrderLines).values({ ...rest, qty, unitPrice, taxRate, lineTotal });
  }
  await recalcPO(parsed.data.poId);
  revalidatePath("/procurement/purchase-orders");
  return { ok: true };
}

export async function deletePOLine(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_WRITE);
  const [line] = await db.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.id, id));
  await db.delete(purchaseOrderLines).where(eq(purchaseOrderLines.id, id));
  if (line) await recalcPO(line.poId);
  revalidatePath("/procurement/purchase-orders");
  return { ok: true };
}

// ============================================================
// GOODS RECEIPTS (GRN)
// ============================================================
const GRNSchema = z.object({
  id: strOpt,
  poId: strOpt,
  supplierId: z.string().min(1, "Supplier required"),
  warehouseId: z.string().min(1, "Warehouse required"),
  receivedDate: dateReq,
  deliveryNoteNumber: strOpt,
  notes: strOpt,
});

export async function listGRNs() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    grn: goodsReceipts,
    supplier: { id: suppliers.id, name: suppliers.name },
    warehouse: { id: warehouses.id, name: warehouses.name },
    lineCount: count(goodsReceiptLines.id),
  })
    .from(goodsReceipts)
    .leftJoin(suppliers, eq(goodsReceipts.supplierId, suppliers.id))
    .leftJoin(warehouses, eq(goodsReceipts.warehouseId, warehouses.id))
    .leftJoin(goodsReceiptLines, eq(goodsReceiptLines.grnId, goodsReceipts.id))
    .where(eq(goodsReceipts.companyId, companyId))
    .groupBy(goodsReceipts.id)
    .orderBy(desc(goodsReceipts.createdAt));
}

export async function getGRN(id: string) {
  const companyId = await getActiveCompanyId();
  const [grn] = await db.select({
    grn: goodsReceipts,
    supplier: { id: suppliers.id, name: suppliers.name },
    warehouse: { id: warehouses.id, name: warehouses.name },
  })
    .from(goodsReceipts)
    .leftJoin(suppliers, eq(goodsReceipts.supplierId, suppliers.id))
    .leftJoin(warehouses, eq(goodsReceipts.warehouseId, warehouses.id))
    .where(and(eq(goodsReceipts.id, id), companyId ? eq(goodsReceipts.companyId, companyId) : sql`1=1`));
  if (!grn) return null;
  const lines = await db.select({
    line: goodsReceiptLines,
    product: { id: products.id, sku: products.sku, name: products.name, uom: products.uom },
  })
    .from(goodsReceiptLines)
    .leftJoin(products, eq(goodsReceiptLines.productId, products.id))
    .where(eq(goodsReceiptLines.grnId, id));
  return { ...grn, lines };
}

export async function upsertGRN(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_WRITE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(GRNSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(goodsReceipts).set(data).where(eq(goodsReceipts.id, id));
  } else {
    const number = await nextNumber("GRN", companyId);
    await db.insert(goodsReceipts).values({ ...data, companyId, number });
  }
  revalidatePath("/procurement/goods-receipts");
  return { ok: true };
}

export async function deleteGRN(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_WRITE);
  await db.delete(goodsReceipts).where(eq(goodsReceipts.id, id));
  revalidatePath("/procurement/goods-receipts");
  return { ok: true };
}

const GRNLineSchema = z.object({
  id: strOpt,
  grnId: z.string().min(1),
  productId: z.string().min(1, "Product required"),
  qtyOrdered: numOr0,
  qtyReceived: numPos,
  qtyRejected: numOr0,
  unitCost: numOr0,
  lotNumber: strOpt,
  batchNumber: strOpt,
  manufacturedOn: dateOpt,
  expiryDate: dateOpt,
  rejectionReason: strOpt,
  notes: strOpt,
  qcPassed: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(true),
});

export async function upsertGRNLine(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_WRITE);
  const parsed = fromFormData(GRNLineSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(goodsReceiptLines).set(data).where(eq(goodsReceiptLines.id, id));
  } else {
    await db.insert(goodsReceiptLines).values(data);
  }
  revalidatePath("/procurement/goods-receipts");
  return { ok: true };
}

export async function deleteGRNLine(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_WRITE);
  await db.delete(goodsReceiptLines).where(eq(goodsReceiptLines.id, id));
  revalidatePath("/procurement/goods-receipts");
  return { ok: true };
}

/** Confirm GRN: create inventory lots + stock movements + update PO received qty */
export async function confirmGRN(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_WRITE);
  const companyId = await getActiveCompanyId();
  const grnData = await getGRN(id);
  if (!grnData) return { ok: false, error: "GRN not found" };
  if (grnData.grn.status !== "DRAFT") return { ok: false, error: "GRN already confirmed" };

  for (const { line, product } of grnData.lines) {
    if (line.qtyReceived <= 0) continue;
    // Create or get stock batch (lot)
    const lotNum = line.lotNumber ?? `GRN-${id.slice(-6)}-${line.productId.slice(-4)}`;
    const [batch] = await db.insert(stockBatches).values({
      companyId: companyId!,
      productId: line.productId,
      lotNumber: lotNum,
      batchNumber: line.batchNumber ?? undefined,
      warehouseId: grnData.grn.warehouseId,
      qtyOnHand: line.qtyReceived,
      uom: product?.uom ?? "PCS",
      manufacturedOn: line.manufacturedOn ?? undefined,
      expiryDate: line.expiryDate ?? undefined,
      unitCost: line.unitCost,
      source: "PURCHASE",
      sourceRef: id,
    }).returning();
    // Stock movement
    await db.insert(stockMovements).values({
      companyId: companyId!,
      batchId: batch.id,
      productId: line.productId,
      warehouseId: grnData.grn.warehouseId,
      type: "GRN_IN",
      refType: "GRN",
      refId: id,
      qty: line.qtyReceived,
      unitCost: line.unitCost,
    });
    // Update stock balance (upsert pattern)
    const [existing] = await db.select().from(stockBalances)
      .where(and(
        eq(stockBalances.companyId, companyId!),
        eq(stockBalances.productId, line.productId),
        eq(stockBalances.warehouseId, grnData.grn.warehouseId),
      ));
    if (existing) {
      const newQty = existing.qty + line.qtyReceived;
      const newCost = ((existing.qty * (existing.unitCost ?? 0)) + (line.qtyReceived * line.unitCost)) / newQty;
      await db.update(stockBalances).set({ qty: newQty, unitCost: newCost, updatedAt: new Date() })
        .where(eq(stockBalances.id, existing.id));
    } else {
      await db.insert(stockBalances).values({
        companyId: companyId!,
        productId: line.productId,
        warehouseId: grnData.grn.warehouseId,
        qty: line.qtyReceived,
        unitCost: line.unitCost,
      });
    }
    // Update PO line received qty
    if (line.poLineId) {
      const [poLine] = await db.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.id, line.poLineId));
      if (poLine) {
        await db.update(purchaseOrderLines).set({ qtyReceived: poLine.qtyReceived + line.qtyReceived })
          .where(eq(purchaseOrderLines.id, line.poLineId));
      }
    }
    // Supplier performance
    if (grnData.grn.poId) {
      await db.insert(supplierPerformanceLogs).values({
        companyId: companyId!,
        supplierId: grnData.grn.supplierId,
        poId: grnData.grn.poId,
        grnId: id,
        qtyOrdered: line.qtyOrdered,
        qtyReceived: line.qtyReceived,
        qtyRejected: line.qtyRejected,
        qualityScore: line.qcPassed ? 100 - (line.qtyRejected / (line.qtyReceived + line.qtyRejected)) * 100 : 0,
      });
    }
  }
  // Mark GRN confirmed + update PO status
  await db.update(goodsReceipts).set({ status: "CONFIRMED" }).where(eq(goodsReceipts.id, id));
  if (grnData.grn.poId) {
    // Check if PO fully received
    const poLines = await db.select().from(purchaseOrderLines).where(eq(purchaseOrderLines.poId, grnData.grn.poId));
    const allReceived = poLines.every((l) => l.qtyReceived >= l.qty);
    const someReceived = poLines.some((l) => l.qtyReceived > 0);
    await db.update(purchaseOrders)
      .set({ status: allReceived ? "RECEIVED" : someReceived ? "PARTIAL" : "SENT" })
      .where(eq(purchaseOrders.id, grnData.grn.poId));
  }
  revalidatePath("/procurement/goods-receipts");
  revalidatePath("/procurement/purchase-orders");
  revalidatePath("/inventory/stock");
  return { ok: true };
}

// ============================================================
// SUPPLIER INVOICES
// ============================================================
const SISchema = z.object({
  id: strOpt,
  supplierId: z.string().min(1, "Supplier required"),
  poId: strOpt,
  grnId: strOpt,
  supplierInvoiceNumber: strOpt,
  invoiceDate: dateReq,
  dueDate: dateOpt,
  notes: strOpt,
});

export async function listSupplierInvoices() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    inv: supplierInvoices,
    supplier: { id: suppliers.id, name: suppliers.name, code: suppliers.code },
  })
    .from(supplierInvoices)
    .leftJoin(suppliers, eq(supplierInvoices.supplierId, suppliers.id))
    .where(eq(supplierInvoices.companyId, companyId))
    .orderBy(desc(supplierInvoices.invoiceDate));
}

export async function getSupplierInvoice(id: string) {
  const [inv] = await db.select().from(supplierInvoices).where(eq(supplierInvoices.id, id));
  if (!inv) return null;
  const lines = await db.select({
    line: supplierInvoiceLines,
    product: { id: products.id, sku: products.sku, name: products.name },
  })
    .from(supplierInvoiceLines)
    .leftJoin(products, eq(supplierInvoiceLines.productId, products.id))
    .where(eq(supplierInvoiceLines.invoiceId, id));
  return { inv, lines };
}

export async function upsertSupplierInvoice(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.FINANCE_WRITE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(SISchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(supplierInvoices).set(data).where(eq(supplierInvoices.id, id));
  } else {
    const ourRef = await nextNumber("SI", companyId);
    await db.insert(supplierInvoices).values({ ...data, companyId, ourRef });
  }
  revalidatePath("/procurement/supplier-invoices");
  return { ok: true };
}

export async function deleteSupplierInvoice(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.FINANCE_WRITE);
  await db.delete(supplierInvoices).where(eq(supplierInvoices.id, id));
  revalidatePath("/procurement/supplier-invoices");
  return { ok: true };
}

const SILineSchema = z.object({
  id: strOpt,
  invoiceId: z.string().min(1),
  productId: strOpt,
  description: z.string().min(1),
  qty: numPos,
  unitCost: numOr0,
  taxRate: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v) / 100), z.number().nonnegative()),
});

export async function upsertSILine(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.FINANCE_WRITE);
  const parsed = fromFormData(SILineSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, qty, unitCost, taxRate, ...rest } = parsed.data;
  const lineTotal = qty * unitCost;
  if (id) {
    await db.update(supplierInvoiceLines).set({ ...rest, qty, unitCost, taxRate, lineTotal }).where(eq(supplierInvoiceLines.id, id));
  } else {
    await db.insert(supplierInvoiceLines).values({ ...rest, qty, unitCost, taxRate, lineTotal });
  }
  await recalcSI(parsed.data.invoiceId);
  revalidatePath("/procurement/supplier-invoices");
  return { ok: true };
}

export async function deleteSILine(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.FINANCE_WRITE);
  const [line] = await db.select().from(supplierInvoiceLines).where(eq(supplierInvoiceLines.id, id));
  await db.delete(supplierInvoiceLines).where(eq(supplierInvoiceLines.id, id));
  if (line) await recalcSI(line.invoiceId);
  revalidatePath("/procurement/supplier-invoices");
  return { ok: true };
}

export async function approveSupplierInvoice(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.FINANCE_WRITE);
  await db.update(supplierInvoices).set({ status: "APPROVED", approvedById: undefined }).where(eq(supplierInvoices.id, id));
  revalidatePath("/procurement/supplier-invoices");
  return { ok: true };
}

// ============================================================
// HELPERS for dropdowns
// ============================================================
export async function listSuppliersForSelect() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({ id: suppliers.id, name: suppliers.name, code: suppliers.code })
    .from(suppliers)
    .where(and(eq(suppliers.companyId, companyId), eq(suppliers.isActive, true)))
    .orderBy(suppliers.name);
}

export async function listWarehousesForSelect() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({ id: warehouses.id, name: warehouses.name, code: warehouses.code })
    .from(warehouses)
    .where(and(eq(warehouses.companyId, companyId), eq(warehouses.isActive, true)))
    .orderBy(warehouses.name);
}

export async function listProductsForSelect() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({ id: products.id, sku: products.sku, name: products.name, uom: products.uom })
    .from(products)
    .where(and(eq(products.companyId, companyId), eq(products.isActive, true)))
    .orderBy(products.name);
}
