"use server";

import { z } from "zod";
import { and, eq, desc, sql, gte, lte, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  exciseRates, taxStampRolls, taxStampAllocations,
  bondedMovements, exciseDeclarations, exciseDeclarationLines,
  products, warehouses,
} from "@/db/schema";
import { getActiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";
import {
  calculateExcise, calculateVat, DEFAULT_EXCISE_TZS, type ProductClass,
} from "@/lib/tax/tanzania";

const strOpt = z.string().optional().or(z.literal("")).transform((v) => v || undefined);
const numOpt = z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().optional());
const numPos = z.preprocess((v) => Number(v), z.number().positive());
const numOr0 = z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().nonnegative());
const intPos = z.preprocess((v) => Math.trunc(Number(v)), z.number().int().positive());
const dateReq = z.preprocess((v) => new Date(String(v)), z.date());

// ============================================================
// EXCISE RATES
// ============================================================
const RateSchema = z.object({
  id: strOpt,
  productClass: z.enum(["BEER", "SPIRIT", "WINE", "NON_ALC"]),
  ratePerLitre: numOpt,
  ratePerLitreOfAlcohol: numOpt,
  effectiveFrom: dateReq,
});

export async function listExciseRates() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select().from(exciseRates)
    .where(eq(exciseRates.companyId, companyId))
    .orderBy(exciseRates.productClass, desc(exciseRates.effectiveFrom));
}

export async function upsertExciseRate(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.EXCISE_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(RateSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(exciseRates).set(data).where(and(eq(exciseRates.id, id), eq(exciseRates.companyId, companyId)));
  } else {
    await db.insert(exciseRates).values({ ...data, companyId });
  }
  revalidatePath("/excise/rates");
  return { ok: true };
}

export async function deleteExciseRate(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.EXCISE_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(exciseRates).where(and(eq(exciseRates.id, id), eq(exciseRates.companyId, companyId)));
  revalidatePath("/excise/rates");
  return { ok: true };
}

// Pick the most recent rate effective on/before `onDate` for a given class.
async function getActiveRate(companyId: string, productClass: string, onDate: Date) {
  const rows = await db.select().from(exciseRates)
    .where(and(
      eq(exciseRates.companyId, companyId),
      eq(exciseRates.productClass, productClass),
      lte(exciseRates.effectiveFrom, onDate),
    ))
    .orderBy(desc(exciseRates.effectiveFrom))
    .limit(1);
  return rows[0];
}

// ============================================================
// TAX STAMPS — rolls and allocations
// ============================================================
const RollSchema = z.object({
  id: strOpt,
  rollNumber: z.string().min(1, "Roll number required"),
  stampType: z.enum(["BEER", "SPIRIT", "WINE", "SOFT_DRINK"]),
  serialFrom: z.string().min(1, "Serial from required"),
  serialTo: z.string().min(1, "Serial to required"),
  quantity: intPos,
  issuedAt: z.preprocess((v) => (v === "" || v == null ? undefined : new Date(String(v))), z.date().optional()),
  receivedAt: z.preprocess((v) => (v === "" || v == null ? undefined : new Date(String(v))), z.date().optional()),
  warehouseId: strOpt,
  notes: strOpt,
});

export async function listStampRolls() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    roll: taxStampRolls,
    warehouse: { id: warehouses.id, name: warehouses.name },
  })
    .from(taxStampRolls)
    .leftJoin(warehouses, eq(taxStampRolls.warehouseId, warehouses.id))
    .where(eq(taxStampRolls.companyId, companyId))
    .orderBy(desc(taxStampRolls.createdAt));
}

export async function upsertStampRoll(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TAX_STAMP_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(RollSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(taxStampRolls).set(data).where(and(eq(taxStampRolls.id, id), eq(taxStampRolls.companyId, companyId)));
  } else {
    await db.insert(taxStampRolls).values({ ...data, companyId });
  }
  revalidatePath("/excise/stamps");
  return { ok: true };
}

export async function deleteStampRoll(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TAX_STAMP_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(taxStampRolls).where(and(eq(taxStampRolls.id, id), eq(taxStampRolls.companyId, companyId)));
  revalidatePath("/excise/stamps");
  return { ok: true };
}

const AllocationSchema = z.object({
  rollId: z.string().min(1, "Roll required"),
  refType: z.enum(["BOTTLING", "BATCH", "MANUAL"]),
  refId: strOpt,
  serialFrom: z.string().min(1),
  serialTo: z.string().min(1),
  quantity: intPos,
  wastedQty: z.preprocess((v) => (v === "" || v == null ? 0 : Math.trunc(Number(v))), z.number().int().nonnegative()).default(0),
  notes: strOpt,
});

export async function listAllocations(rollId?: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const conditions = [eq(taxStampAllocations.companyId, companyId)];
  if (rollId) conditions.push(eq(taxStampAllocations.rollId, rollId));
  return db.select({
    allocation: taxStampAllocations,
    roll: { id: taxStampRolls.id, rollNumber: taxStampRolls.rollNumber, stampType: taxStampRolls.stampType },
  })
    .from(taxStampAllocations)
    .leftJoin(taxStampRolls, eq(taxStampAllocations.rollId, taxStampRolls.id))
    .where(and(...conditions))
    .orderBy(desc(taxStampAllocations.allocatedAt))
    .limit(200);
}

export async function allocateStamps(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.TAX_STAMP_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const user = await getCurrentUser();
  const parsed = fromFormData(AllocationSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const data = parsed.data;

  const [roll] = await db.select().from(taxStampRolls)
    .where(and(eq(taxStampRolls.id, data.rollId), eq(taxStampRolls.companyId, companyId)));
  if (!roll) return { ok: false, error: "Roll not found" };

  const remaining = roll.quantity - roll.usedQty - roll.wastedQty;
  const needed = data.quantity + data.wastedQty;
  if (needed > remaining) {
    return { ok: false, error: `Only ${remaining} stamps remain on roll ${roll.rollNumber}` };
  }

  await db.insert(taxStampAllocations).values({
    ...data,
    companyId,
    allocatedById: user?.id,
  });
  await db.update(taxStampRolls).set({
    usedQty: roll.usedQty + data.quantity,
    wastedQty: roll.wastedQty + data.wastedQty,
    status: remaining - needed === 0 ? "EXHAUSTED" : "IN_USE",
  }).where(eq(taxStampRolls.id, roll.id));

  revalidatePath("/excise/stamps");
  return { ok: true };
}

// ============================================================
// BONDED WAREHOUSE MOVEMENTS
// ============================================================
const BondedSchema = z.object({
  id: strOpt,
  movementType: z.enum(["ENTRY", "REMOVAL_DUTY_PAID", "REMOVAL_EXPORT", "TRANSFER_BONDED", "LOSS", "DESTRUCTION"]),
  productId: z.string().min(1, "Product required"),
  warehouseId: z.string().min(1, "Bonded warehouse required"),
  destinationWarehouseId: strOpt,
  batchId: strOpt,
  qtyLitres: numPos,
  abv: numOpt,
  movedAt: dateReq,
  reference: strOpt,
  notes: strOpt,
});

async function nextBwmNumber(companyId: string) {
  const year = new Date().getFullYear();
  const prefix = `BWM-${year}-`;
  const rows = await db.select({ n: bondedMovements.number }).from(bondedMovements)
    .where(and(eq(bondedMovements.companyId, companyId), sql`${bondedMovements.number} LIKE ${prefix + "%"}`));
  const max = rows.reduce((m, r) => {
    const seq = parseInt(r.n.split("-").pop() ?? "0", 10);
    return seq > m ? seq : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export async function listBondedMovements(opts?: { type?: string; warehouseId?: string }) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const conditions = [eq(bondedMovements.companyId, companyId)];
  if (opts?.type) conditions.push(eq(bondedMovements.movementType, opts.type));
  if (opts?.warehouseId) conditions.push(eq(bondedMovements.warehouseId, opts.warehouseId));
  return db.select({
    movement: bondedMovements,
    product: { id: products.id, sku: products.sku, name: products.name, abv: products.abv },
    warehouse: { id: warehouses.id, name: warehouses.name, code: warehouses.code },
  })
    .from(bondedMovements)
    .leftJoin(products, eq(bondedMovements.productId, products.id))
    .leftJoin(warehouses, eq(bondedMovements.warehouseId, warehouses.id))
    .where(and(...conditions))
    .orderBy(desc(bondedMovements.movedAt))
    .limit(500);
}

export async function upsertBondedMovement(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.EXCISE_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const user = await getCurrentUser();
  const parsed = fromFormData(BondedSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  // Enforce bonded warehouse type for source.
  const [wh] = await db.select().from(warehouses).where(eq(warehouses.id, data.warehouseId));
  if (!wh || wh.type !== "BONDED") {
    return { ok: false, error: "Source warehouse must be BONDED" };
  }

  const [product] = await db.select().from(products).where(eq(products.id, data.productId));
  if (!product) return { ok: false, error: "Product not found" };
  const productClass = (product.productClass ?? "NON_ALC") as ProductClass;
  const abv = data.abv ?? product.abv ?? undefined;
  const loa = abv != null ? data.qtyLitres * abv : undefined;

  // Excise + VAT are only recognised on duty-paid removals. Exports, bonded transfers,
  // approved losses are all duty-suspended (0 TZS).
  let exciseAmount = 0;
  let vatAmount = 0;
  let ratePerLitre: number | undefined;
  let ratePerLoa: number | undefined;
  if (data.movementType === "REMOVAL_DUTY_PAID") {
    const rate = await getActiveRate(companyId, productClass, data.movedAt);
    ratePerLitre = rate?.ratePerLitre ?? DEFAULT_EXCISE_TZS[productClass]?.perLitre;
    ratePerLoa = rate?.ratePerLitreOfAlcohol ?? DEFAULT_EXCISE_TZS[productClass]?.perLoA;
    exciseAmount = calculateExcise({
      productClass,
      litres: data.qtyLitres,
      abv,
      ratePerLitre,
      ratePerLoA: ratePerLoa,
    });
    // VAT on (cost base + excise) — cost base for duty-paid removal is internal and
    // typically captured on the sales invoice; here we only post excise, not VAT.
    vatAmount = 0;
  }

  if (id) {
    await db.update(bondedMovements).set({
      ...data,
      productClass,
      loa,
      ratePerLitre,
      ratePerLoa,
      exciseAmount,
      vatAmount,
    }).where(and(eq(bondedMovements.id, id), eq(bondedMovements.companyId, companyId)));
  } else {
    const number = await nextBwmNumber(companyId);
    await db.insert(bondedMovements).values({
      ...data,
      companyId,
      number,
      productClass,
      loa,
      ratePerLitre,
      ratePerLoa,
      exciseAmount,
      vatAmount,
      createdById: user?.id,
      status: "POSTED",
    });
  }
  revalidatePath("/excise/bonded");
  revalidatePath("/excise");
  return { ok: true };
}

export async function deleteBondedMovement(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.EXCISE_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const [m] = await db.select().from(bondedMovements)
    .where(and(eq(bondedMovements.id, id), eq(bondedMovements.companyId, companyId)));
  if (!m) return { ok: false, error: "Not found" };
  if (m.declarationId) return { ok: false, error: "Included in a declaration; reverse declaration first" };
  await db.delete(bondedMovements).where(eq(bondedMovements.id, id));
  revalidatePath("/excise/bonded");
  return { ok: true };
}

// Quick duty calculator — used by UI to show preview before posting a movement.
export async function previewDuty(opts: {
  productClass: ProductClass;
  litres: number;
  abv?: number;
  onDate?: Date;
}) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return { excise: 0, ratePerLitre: 0, ratePerLoa: 0 };
  const rate = await getActiveRate(companyId, opts.productClass, opts.onDate ?? new Date());
  const ratePerLitre = rate?.ratePerLitre ?? DEFAULT_EXCISE_TZS[opts.productClass]?.perLitre ?? 0;
  const ratePerLoa = rate?.ratePerLitreOfAlcohol ?? DEFAULT_EXCISE_TZS[opts.productClass]?.perLoA ?? 0;
  const excise = calculateExcise({
    productClass: opts.productClass,
    litres: opts.litres,
    abv: opts.abv,
    ratePerLitre,
    ratePerLoA: ratePerLoa,
  });
  return { excise, ratePerLitre, ratePerLoa };
}

// ============================================================
// STATUTORY DECLARATIONS
// ============================================================
const DeclarationSchema = z.object({
  id: strOpt,
  periodStart: dateReq,
  periodEnd: dateReq,
  periodLabel: z.string().min(4),
  notes: strOpt,
});

async function nextDeclarationNumber(companyId: string) {
  const year = new Date().getFullYear();
  const prefix = `ED-${year}-`;
  const rows = await db.select({ n: exciseDeclarations.number }).from(exciseDeclarations)
    .where(and(eq(exciseDeclarations.companyId, companyId), sql`${exciseDeclarations.number} LIKE ${prefix + "%"}`));
  const max = rows.reduce((m, r) => {
    const seq = parseInt(r.n.split("-").pop() ?? "0", 10);
    return seq > m ? seq : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export async function listDeclarations() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select().from(exciseDeclarations)
    .where(eq(exciseDeclarations.companyId, companyId))
    .orderBy(desc(exciseDeclarations.periodEnd));
}

export async function getDeclaration(id: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return null;
  const [decl] = await db.select().from(exciseDeclarations)
    .where(and(eq(exciseDeclarations.id, id), eq(exciseDeclarations.companyId, companyId)));
  if (!decl) return null;
  const lines = await db.select().from(exciseDeclarationLines)
    .where(eq(exciseDeclarationLines.declarationId, id));
  return { decl, lines };
}

export async function createDeclaration(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.EXCISE_DECLARE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const user = await getCurrentUser();
  const parsed = fromFormData(DeclarationSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    await db.update(exciseDeclarations).set(data)
      .where(and(eq(exciseDeclarations.id, id), eq(exciseDeclarations.companyId, companyId)));
    revalidatePath("/excise/declarations");
    return { ok: true };
  }

  const number = await nextDeclarationNumber(companyId);
  const [decl] = await db.insert(exciseDeclarations).values({
    ...data,
    companyId,
    number,
    createdById: user?.id,
  }).returning();

  // Aggregate all unassigned duty-paid removals in this period.
  const movements = await db.select().from(bondedMovements).where(and(
    eq(bondedMovements.companyId, companyId),
    eq(bondedMovements.movementType, "REMOVAL_DUTY_PAID"),
    eq(bondedMovements.status, "POSTED"),
    isNull(bondedMovements.declarationId),
    gte(bondedMovements.movedAt, data.periodStart),
    lte(bondedMovements.movedAt, data.periodEnd),
  ));

  type Bucket = { litres: number; loa: number; excise: number; vat: number; count: number; productId?: string };
  const buckets = new Map<string, Bucket>();
  for (const m of movements) {
    const key = `${m.productClass}|${m.productId}`;
    const b = buckets.get(key) ?? { litres: 0, loa: 0, excise: 0, vat: 0, count: 0, productId: m.productId };
    b.litres += m.qtyLitres;
    b.loa += m.loa ?? 0;
    b.excise += m.exciseAmount;
    b.vat += m.vatAmount;
    b.count += 1;
    buckets.set(key, b);
  }

  let totalLitres = 0, totalLoa = 0, totalExcise = 0, totalVat = 0;
  for (const [key, b] of buckets) {
    const productClass = key.split("|")[0];
    await db.insert(exciseDeclarationLines).values({
      declarationId: decl.id,
      productClass,
      productId: b.productId,
      qtyLitres: b.litres,
      qtyLoa: b.loa,
      exciseAmount: b.excise,
      vatAmount: b.vat,
      movementCount: b.count,
    });
    totalLitres += b.litres;
    totalLoa += b.loa;
    totalExcise += b.excise;
    totalVat += b.vat;
  }

  await db.update(exciseDeclarations).set({
    totalLitres, totalLoa, totalExcise, totalVat,
  }).where(eq(exciseDeclarations.id, decl.id));

  // Link movements to this declaration so they can't be double-declared.
  if (movements.length) {
    for (const m of movements) {
      await db.update(bondedMovements).set({ declarationId: decl.id })
        .where(eq(bondedMovements.id, m.id));
    }
  }

  revalidatePath("/excise/declarations");
  return { ok: true };
}

export async function submitDeclaration(id: string, traReference?: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.EXCISE_DECLARE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.update(exciseDeclarations).set({
    status: "SUBMITTED",
    submittedAt: new Date(),
    traReference: traReference || null,
  }).where(and(eq(exciseDeclarations.id, id), eq(exciseDeclarations.companyId, companyId)));
  revalidatePath("/excise/declarations");
  return { ok: true };
}

export async function markDeclarationPaid(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.EXCISE_DECLARE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.update(exciseDeclarations).set({
    status: "PAID",
    paidAt: new Date(),
  }).where(and(eq(exciseDeclarations.id, id), eq(exciseDeclarations.companyId, companyId)));
  revalidatePath("/excise/declarations");
  return { ok: true };
}

export async function deleteDeclaration(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.EXCISE_DECLARE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const [decl] = await db.select().from(exciseDeclarations)
    .where(and(eq(exciseDeclarations.id, id), eq(exciseDeclarations.companyId, companyId)));
  if (!decl) return { ok: false, error: "Not found" };
  if (decl.status === "PAID" || decl.status === "SUBMITTED") {
    return { ok: false, error: `Cannot delete ${decl.status.toLowerCase()} declaration` };
  }
  // unassign movements so they can be re-declared
  await db.update(bondedMovements).set({ declarationId: null })
    .where(eq(bondedMovements.declarationId, id));
  await db.delete(exciseDeclarations).where(eq(exciseDeclarations.id, id));
  revalidatePath("/excise/declarations");
  return { ok: true };
}

// ============================================================
// DASHBOARD STATS
// ============================================================
export async function exciseStats() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return null;
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [mtd] = await db.select({
    totalLitres: sql<number>`coalesce(sum(${bondedMovements.qtyLitres}), 0)`,
    totalExcise: sql<number>`coalesce(sum(${bondedMovements.exciseAmount}), 0)`,
    count: sql<number>`count(*)`,
  })
    .from(bondedMovements)
    .where(and(
      eq(bondedMovements.companyId, companyId),
      eq(bondedMovements.movementType, "REMOVAL_DUTY_PAID"),
      gte(bondedMovements.movedAt, since),
    ));

  const [pending] = await db.select({
    count: sql<number>`count(*)`,
    excise: sql<number>`coalesce(sum(${bondedMovements.exciseAmount}), 0)`,
  })
    .from(bondedMovements)
    .where(and(
      eq(bondedMovements.companyId, companyId),
      eq(bondedMovements.movementType, "REMOVAL_DUTY_PAID"),
      isNull(bondedMovements.declarationId),
    ));

  const [stampStock] = await db.select({
    remaining: sql<number>`coalesce(sum(${taxStampRolls.quantity} - ${taxStampRolls.usedQty} - ${taxStampRolls.wastedQty}), 0)`,
    rolls: sql<number>`count(*)`,
  })
    .from(taxStampRolls)
    .where(and(
      eq(taxStampRolls.companyId, companyId),
      sql`${taxStampRolls.status} != 'EXHAUSTED'`,
    ));

  return {
    mtd: mtd ?? { totalLitres: 0, totalExcise: 0, count: 0 },
    pending: pending ?? { count: 0, excise: 0 },
    stampStock: stampStock ?? { remaining: 0, rolls: 0 },
  };
}

// Helper for UI: list BONDED warehouses only
export async function listBondedWarehouses() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select().from(warehouses)
    .where(and(eq(warehouses.companyId, companyId), eq(warehouses.type, "BONDED")))
    .orderBy(warehouses.name);
}

// Helper for UI: list excise-relevant products (BEER/SPIRIT/WINE)
export async function listExciseableProducts() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select().from(products)
    .where(and(
      eq(products.companyId, companyId),
      sql`${products.productClass} IN ('BEER','SPIRIT','WINE')`,
    ))
    .orderBy(products.name);
}
