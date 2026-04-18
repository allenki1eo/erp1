"use server";

import { z } from "zod";
import { and, eq, desc, sql, count, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  stockBatches, stockMovements, stockBalances,
  stockTransfers, stockTransferLines,
  stockTakes, stockTakeLines,
  binLocations,
  products, warehouses, companies,
} from "@/db/schema";
import { getActiveCompanyId } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const numPos = z.preprocess((v) => Number(v), z.number().positive());
const numOr0 = z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().nonnegative());
const dateReq = z.preprocess((v) => new Date(String(v)), z.date());
const dateOpt = z.preprocess((v) => (v === "" || v == null ? undefined : new Date(String(v))), z.date().optional());
const strOpt = z.string().optional().or(z.literal("")).transform((v) => v || undefined);

async function nextTrfNumber(companyId: string) {
  const year = new Date().getFullYear();
  const prefix = `TRF-${year}-`;
  const rows = await db.select({ n: stockTransfers.number }).from(stockTransfers)
    .where(and(eq(stockTransfers.companyId, companyId), sql`${stockTransfers.number} LIKE ${prefix + "%"}`));
  const max = rows.reduce((m, r) => {
    const seq = parseInt(r.n.split("-").pop() ?? "0", 10);
    return seq > m ? seq : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

async function nextSTNumber(companyId: string) {
  const year = new Date().getFullYear();
  const prefix = `ST-${year}-`;
  const rows = await db.select({ n: stockTakes.number }).from(stockTakes)
    .where(and(eq(stockTakes.companyId, companyId), sql`${stockTakes.number} LIKE ${prefix + "%"}`));
  const max = rows.reduce((m, r) => {
    const seq = parseInt(r.n.split("-").pop() ?? "0", 10);
    return seq > m ? seq : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

// ============================================================
// STOCK BALANCES & BATCHES
// ============================================================
export async function listStockBalances() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    balance: stockBalances,
    product: { id: products.id, sku: products.sku, name: products.name, uom: products.uom, reorderLevel: products.reorderLevel },
    warehouse: { id: warehouses.id, name: warehouses.name, code: warehouses.code },
  })
    .from(stockBalances)
    .leftJoin(products, eq(stockBalances.productId, products.id))
    .leftJoin(warehouses, eq(stockBalances.warehouseId, warehouses.id))
    .where(and(eq(stockBalances.companyId, companyId), sql`${stockBalances.qty} > 0`))
    .orderBy(products.name, warehouses.name);
}

export async function listStockBatches(warehouseId?: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const conditions = [
    eq(stockBatches.companyId, companyId),
    sql`${stockBatches.qtyOnHand} > 0`,
  ];
  if (warehouseId) conditions.push(eq(stockBatches.warehouseId, warehouseId));
  return db.select({
    batch: stockBatches,
    product: { id: products.id, sku: products.sku, name: products.name, uom: products.uom },
    warehouse: { id: warehouses.id, name: warehouses.name },
    bin: { id: binLocations.id, code: binLocations.code },
  })
    .from(stockBatches)
    .leftJoin(products, eq(stockBatches.productId, products.id))
    .leftJoin(warehouses, eq(stockBatches.warehouseId, warehouses.id))
    .leftJoin(binLocations, eq(stockBatches.binId, binLocations.id))
    .where(and(...conditions))
    .orderBy(stockBatches.expiryDate, products.name);
}

export async function listStockMovements(productId?: string, warehouseId?: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const conditions = [eq(stockMovements.companyId, companyId)];
  if (productId) conditions.push(eq(stockMovements.productId, productId));
  if (warehouseId) conditions.push(eq(stockMovements.warehouseId, warehouseId));
  return db.select({
    movement: stockMovements,
    product: { id: products.id, sku: products.sku, name: products.name },
    warehouse: { id: warehouses.id, name: warehouses.name },
  })
    .from(stockMovements)
    .leftJoin(products, eq(stockMovements.productId, products.id))
    .leftJoin(warehouses, eq(stockMovements.warehouseId, warehouses.id))
    .where(and(...conditions))
    .orderBy(desc(stockMovements.transactedAt))
    .limit(200);
}

// ============================================================
// BIN LOCATIONS
// ============================================================
const BinSchema = z.object({
  id: strOpt,
  warehouseId: z.string().min(1, "Warehouse required"),
  code: z.string().min(1, "Code required"),
  name: strOpt,
  zone: strOpt,
  isActive: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()).default(true),
});

export async function listBinLocations(warehouseId?: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const wIds = warehouseId
    ? [warehouseId]
    : (await db.select({ id: warehouses.id }).from(warehouses).where(eq(warehouses.companyId, companyId))).map((w) => w.id);
  if (!wIds.length) return [];
  return db.select({ bin: binLocations, warehouse: { id: warehouses.id, name: warehouses.name } })
    .from(binLocations)
    .leftJoin(warehouses, eq(binLocations.warehouseId, warehouses.id))
    .where(sql`${binLocations.warehouseId} IN ${wIds}`)
    .orderBy(warehouses.name, binLocations.code);
}

export async function upsertBinLocation(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  const parsed = fromFormData(BinSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(binLocations).set(data).where(eq(binLocations.id, id));
  } else {
    await db.insert(binLocations).values(data);
  }
  revalidatePath("/inventory/bins");
  return { ok: true };
}

export async function deleteBinLocation(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  await db.delete(binLocations).where(eq(binLocations.id, id));
  revalidatePath("/inventory/bins");
  return { ok: true };
}

// ============================================================
// WAREHOUSE TRANSFERS
// ============================================================
const TransferSchema = z.object({
  id: strOpt,
  fromWarehouseId: z.string().min(1, "Source warehouse required"),
  toWarehouseId: z.string().min(1, "Destination warehouse required"),
  transferredAt: dateOpt,
  notes: strOpt,
});

export async function listTransfers() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const fromWh = { id: warehouses.id, name: warehouses.name, code: warehouses.code };
  return db.select({
    transfer: stockTransfers,
    fromWarehouse: fromWh,
    lineCount: count(stockTransferLines.id),
  })
    .from(stockTransfers)
    .leftJoin(warehouses, eq(stockTransfers.fromWarehouseId, warehouses.id))
    .leftJoin(stockTransferLines, eq(stockTransferLines.transferId, stockTransfers.id))
    .where(eq(stockTransfers.companyId, companyId))
    .groupBy(stockTransfers.id)
    .orderBy(desc(stockTransfers.createdAt));
}

export async function getTransfer(id: string) {
  const [transfer] = await db.select().from(stockTransfers).where(eq(stockTransfers.id, id));
  if (!transfer) return null;
  const lines = await db.select({
    line: stockTransferLines,
    product: { id: products.id, sku: products.sku, name: products.name, uom: products.uom },
    batch: { id: stockBatches.id, lotNumber: stockBatches.lotNumber, qtyOnHand: stockBatches.qtyOnHand },
  })
    .from(stockTransferLines)
    .leftJoin(products, eq(stockTransferLines.productId, products.id))
    .leftJoin(stockBatches, eq(stockTransferLines.batchId, stockBatches.id))
    .where(eq(stockTransferLines.transferId, id));
  return { transfer, lines };
}

export async function upsertTransfer(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(TransferSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(stockTransfers).set(data).where(eq(stockTransfers.id, id));
  } else {
    const number = await nextTrfNumber(companyId);
    await db.insert(stockTransfers).values({ ...data, companyId, number });
  }
  revalidatePath("/inventory/transfers");
  return { ok: true };
}

export async function deleteTransfer(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  await db.delete(stockTransfers).where(eq(stockTransfers.id, id));
  revalidatePath("/inventory/transfers");
  return { ok: true };
}

const TransferLineSchema = z.object({
  id: strOpt,
  transferId: z.string().min(1),
  productId: z.string().min(1, "Product required"),
  batchId: strOpt,
  fromBinId: strOpt,
  toBinId: strOpt,
  qty: numPos,
  unitCost: numOr0,
  notes: strOpt,
});

export async function upsertTransferLine(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  const parsed = fromFormData(TransferLineSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(stockTransferLines).set(data).where(eq(stockTransferLines.id, id));
  } else {
    await db.insert(stockTransferLines).values(data);
  }
  revalidatePath("/inventory/transfers");
  return { ok: true };
}

export async function deleteTransferLine(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  await db.delete(stockTransferLines).where(eq(stockTransferLines.id, id));
  revalidatePath("/inventory/transfers");
  return { ok: true };
}

/** Confirm transfer: create OUT movements at source, IN movements at destination, update balances */
export async function confirmTransfer(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  const companyId = await getActiveCompanyId();
  const data = await getTransfer(id);
  if (!data) return { ok: false, error: "Transfer not found" };
  if (data.transfer.status !== "DRAFT") return { ok: false, error: "Transfer already confirmed" };

  for (const { line } of data.lines) {
    // OUT from source
    await db.insert(stockMovements).values({
      companyId: companyId!,
      batchId: line.batchId ?? undefined,
      productId: line.productId,
      warehouseId: data.transfer.fromWarehouseId,
      binId: line.fromBinId ?? undefined,
      type: "TRANSFER_OUT",
      refType: "TRANSFER",
      refId: id,
      qty: -line.qty,
      unitCost: line.unitCost ?? 0,
    });
    // IN to destination
    await db.insert(stockMovements).values({
      companyId: companyId!,
      batchId: line.batchId ?? undefined,
      productId: line.productId,
      warehouseId: data.transfer.toWarehouseId,
      binId: line.toBinId ?? undefined,
      type: "TRANSFER_IN",
      refType: "TRANSFER",
      refId: id,
      qty: line.qty,
      unitCost: line.unitCost ?? 0,
    });
    // Update source balance
    const [srcBal] = await db.select().from(stockBalances).where(and(
      eq(stockBalances.companyId, companyId!),
      eq(stockBalances.productId, line.productId),
      eq(stockBalances.warehouseId, data.transfer.fromWarehouseId),
    ));
    if (srcBal) {
      await db.update(stockBalances).set({ qty: srcBal.qty - line.qty, updatedAt: new Date() })
        .where(eq(stockBalances.id, srcBal.id));
    }
    // Update destination balance
    const [dstBal] = await db.select().from(stockBalances).where(and(
      eq(stockBalances.companyId, companyId!),
      eq(stockBalances.productId, line.productId),
      eq(stockBalances.warehouseId, data.transfer.toWarehouseId),
    ));
    if (dstBal) {
      await db.update(stockBalances).set({ qty: dstBal.qty + line.qty, updatedAt: new Date() })
        .where(eq(stockBalances.id, dstBal.id));
    } else {
      await db.insert(stockBalances).values({
        companyId: companyId!,
        productId: line.productId,
        warehouseId: data.transfer.toWarehouseId,
        qty: line.qty,
        unitCost: line.unitCost ?? 0,
      });
    }
    // Update batch location if specified
    if (line.batchId) {
      await db.update(stockBatches).set({
        warehouseId: data.transfer.toWarehouseId,
        binId: line.toBinId ?? undefined,
      }).where(eq(stockBatches.id, line.batchId));
    }
  }
  await db.update(stockTransfers).set({ status: "RECEIVED", transferredAt: new Date() })
    .where(eq(stockTransfers.id, id));
  revalidatePath("/inventory/transfers");
  revalidatePath("/inventory/stock");
  return { ok: true };
}

// ============================================================
// STOCK TAKES
// ============================================================
const StockTakeSchema = z.object({
  id: strOpt,
  warehouseId: z.string().min(1, "Warehouse required"),
  takenAt: dateReq,
  notes: strOpt,
});

export async function listStockTakes() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    stockTake: stockTakes,
    warehouse: { id: warehouses.id, name: warehouses.name },
    lineCount: count(stockTakeLines.id),
  })
    .from(stockTakes)
    .leftJoin(warehouses, eq(stockTakes.warehouseId, warehouses.id))
    .leftJoin(stockTakeLines, eq(stockTakeLines.stockTakeId, stockTakes.id))
    .where(eq(stockTakes.companyId, companyId))
    .groupBy(stockTakes.id)
    .orderBy(desc(stockTakes.takenAt));
}

export async function getStockTake(id: string) {
  const [st] = await db.select().from(stockTakes).where(eq(stockTakes.id, id));
  if (!st) return null;
  const lines = await db.select({
    line: stockTakeLines,
    product: { id: products.id, sku: products.sku, name: products.name, uom: products.uom },
    batch: { id: stockBatches.id, lotNumber: stockBatches.lotNumber },
    bin: { id: binLocations.id, code: binLocations.code },
  })
    .from(stockTakeLines)
    .leftJoin(products, eq(stockTakeLines.productId, products.id))
    .leftJoin(stockBatches, eq(stockTakeLines.batchId, stockBatches.id))
    .leftJoin(binLocations, eq(stockTakeLines.binId, binLocations.id))
    .where(eq(stockTakeLines.stockTakeId, id));
  return { st, lines };
}

export async function upsertStockTake(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(StockTakeSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(stockTakes).set(data).where(eq(stockTakes.id, id));
    revalidatePath("/inventory/stock-takes");
    return { ok: true };
  }
  const number = await nextSTNumber(companyId);
  const [created] = await db.insert(stockTakes).values({
    ...data, companyId, number, status: "IN_PROGRESS",
  }).returning();
  // Auto-populate lines from current stock balances for this warehouse
  const batches = await db.select().from(stockBatches)
    .where(and(
      eq(stockBatches.companyId, companyId),
      eq(stockBatches.warehouseId, data.warehouseId),
      sql`${stockBatches.qtyOnHand} > 0`,
    ));
  for (const b of batches) {
    await db.insert(stockTakeLines).values({
      stockTakeId: created.id,
      productId: b.productId,
      batchId: b.id,
      binId: b.binId ?? undefined,
      systemQty: b.qtyOnHand,
      unitCost: b.unitCost ?? 0,
    });
  }
  revalidatePath("/inventory/stock-takes");
  return { ok: true, data: { id: created.id } as unknown as undefined };
}

export async function deleteStockTake(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  await db.delete(stockTakes).where(eq(stockTakes.id, id));
  revalidatePath("/inventory/stock-takes");
  return { ok: true };
}

const StockTakeLineSchema = z.object({
  id: z.string().min(1),
  countedQty: numOr0,
  notes: strOpt,
});

export async function updateStockTakeLine(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_WRITE);
  const parsed = fromFormData(StockTakeLineSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, countedQty, notes } = parsed.data;
  const [line] = await db.select().from(stockTakeLines).where(eq(stockTakeLines.id, id));
  if (!line) return { ok: false, error: "Line not found" };
  const variance = countedQty - line.systemQty;
  const varianceCost = variance * (line.unitCost ?? 0);
  await db.update(stockTakeLines).set({ countedQty, variance, varianceCost, notes })
    .where(eq(stockTakeLines.id, id));
  revalidatePath("/inventory/stock-takes");
  return { ok: true };
}

/** Confirm stock take: post ADJUSTMENT movements for all variances, then lock */
export async function confirmStockTake(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  const companyId = await getActiveCompanyId();
  const data = await getStockTake(id);
  if (!data) return { ok: false, error: "Stock take not found" };
  if (data.st.status === "CONFIRMED") return { ok: false, error: "Already confirmed" };

  for (const { line } of data.lines) {
    if (line.countedQty == null) continue;
    const variance = line.countedQty - line.systemQty;
    if (variance === 0) continue;
    // Post adjustment movement
    await db.insert(stockMovements).values({
      companyId: companyId!,
      batchId: line.batchId ?? undefined,
      productId: line.productId,
      warehouseId: data.st.warehouseId,
      binId: line.binId ?? undefined,
      type: "STOCKTAKE_ADJ",
      refType: "STOCKTAKE",
      refId: id,
      qty: variance,
      unitCost: line.unitCost ?? 0,
    });
    // Update batch qty
    if (line.batchId) {
      await db.update(stockBatches).set({ qtyOnHand: line.countedQty })
        .where(eq(stockBatches.id, line.batchId));
    }
    // Update balance
    const [bal] = await db.select().from(stockBalances).where(and(
      eq(stockBalances.companyId, companyId!),
      eq(stockBalances.productId, line.productId),
      eq(stockBalances.warehouseId, data.st.warehouseId),
    ));
    if (bal) {
      await db.update(stockBalances).set({ qty: bal.qty + variance, updatedAt: new Date() })
        .where(eq(stockBalances.id, bal.id));
    }
  }
  await db.update(stockTakes).set({ status: "CONFIRMED", confirmedAt: new Date() })
    .where(eq(stockTakes.id, id));
  revalidatePath("/inventory/stock-takes");
  revalidatePath("/inventory/stock");
  return { ok: true };
}
