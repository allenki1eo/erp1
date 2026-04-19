"use server";

import { z } from "zod";
import { and, eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  brews, distillations, distillationCuts, barrels, agingBatches,
  bottlingRuns, products, recipes,
} from "@/db/schema";
import { getActiveCompanyId } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const strOpt = z.string().optional().or(z.literal("")).transform((v) => v || undefined);
const numOpt = z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().optional());
const dateIn = z.preprocess((v) => (v ? new Date(String(v)) : undefined), z.date().optional());
const dateReq = z.preprocess((v) => (v ? new Date(String(v)) : undefined), z.date({ required_error: "Date required" }));

// ============================================================
// BREWS
// ============================================================
const BREW_STATUSES = ["PLANNED", "MASHING", "BOILING", "FERMENTING", "CONDITIONING", "PACKAGED", "CANCELLED"] as const;

const BrewSchema = z.object({
  id: strOpt,
  batchNumber: z.string().min(1, "Batch number required"),
  productId: z.string().min(1, "Product required"),
  recipeId: strOpt,
  vesselId: strOpt,
  plannedVolume: z.preprocess((v) => Number(v), z.number().positive("Must be positive")),
  actualVolume: numOpt,
  startDate: dateReq,
  endDate: dateIn,
  status: z.enum(BREW_STATUSES).default("PLANNED"),
  finalAbv: numOpt,
  yieldPercent: numOpt,
  notes: strOpt,
});

export async function listBrews() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    brew: brews,
    product: { id: products.id, sku: products.sku, name: products.name },
    recipe: { id: recipes.id, name: recipes.name, version: recipes.version },
  })
    .from(brews)
    .leftJoin(products, eq(brews.productId, products.id))
    .leftJoin(recipes, eq(brews.recipeId, recipes.id))
    .where(eq(brews.companyId, companyId))
    .orderBy(desc(brews.startDate))
    .limit(200);
}

export async function upsertBrew(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(BrewSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    await db.update(brews).set(data).where(and(eq(brews.id, id), eq(brews.companyId, companyId)));
  } else {
    await db.insert(brews).values({ ...data, companyId });
  }
  revalidatePath("/production/brews");
  return { ok: true };
}

export async function deleteBrew(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(brews).where(and(eq(brews.id, id), eq(brews.companyId, companyId)));
  revalidatePath("/production/brews");
  return { ok: true };
}

// ============================================================
// DISTILLATIONS
// ============================================================
const DIST_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

const DistSchema = z.object({
  id: strOpt,
  runNumber: z.string().min(1, "Run number required"),
  productId: z.string().min(1, "Product required"),
  recipeId: strOpt,
  stillId: strOpt,
  startDate: dateReq,
  endDate: dateIn,
  status: z.enum(DIST_STATUSES).default("PLANNED"),
  feedVolume: numOpt,
  feedAbv: numOpt,
  totalOutput: numOpt,
  notes: strOpt,
});

export async function listDistillations() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    run: distillations,
    product: { id: products.id, sku: products.sku, name: products.name },
  })
    .from(distillations)
    .leftJoin(products, eq(distillations.productId, products.id))
    .where(eq(distillations.companyId, companyId))
    .orderBy(desc(distillations.startDate))
    .limit(200);
}

export async function upsertDistillation(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(DistSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    await db.update(distillations).set(data).where(and(eq(distillations.id, id), eq(distillations.companyId, companyId)));
  } else {
    await db.insert(distillations).values({ ...data, companyId });
  }
  revalidatePath("/production/distillations");
  return { ok: true };
}

export async function deleteDistillation(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(distillations).where(and(eq(distillations.id, id), eq(distillations.companyId, companyId)));
  revalidatePath("/production/distillations");
  return { ok: true };
}

const CutSchema = z.object({
  distillationId: z.string().min(1),
  cutType: z.enum(["HEADS", "HEARTS", "TAILS"]),
  volume: z.preprocess((v) => Number(v), z.number().positive()),
  abv: z.preprocess((v) => Number(v), z.number().min(0).max(100)),
  destination: strOpt,
});

export async function addDistillationCut(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(CutSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { distillationId, volume, abv, ...rest } = parsed.data;

  const [run] = await db.select().from(distillations)
    .where(and(eq(distillations.id, distillationId), eq(distillations.companyId, companyId)));
  if (!run) return { ok: false, error: "Distillation not found" };

  const loa = volume * (abv / 100);
  await db.insert(distillationCuts).values({ distillationId, volume, abv, loa, ...rest });
  revalidatePath("/production/distillations");
  return { ok: true };
}

export async function listDistillationCuts(distillationId: string) {
  return db.select().from(distillationCuts)
    .where(eq(distillationCuts.distillationId, distillationId))
    .orderBy(distillationCuts.cutType);
}

// ============================================================
// BARRELS & AGING
// ============================================================
const BARREL_STATUSES = ["EMPTY", "FILLED", "EMPTIED", "RETIRED"] as const;

const BarrelSchema = z.object({
  id: strOpt,
  code: z.string().min(1, "Code required"),
  capacity: z.preprocess((v) => Number(v), z.number().positive()),
  woodType: strOpt,
  charLevel: strOpt,
  warehouseId: strOpt,
  status: z.enum(BARREL_STATUSES).default("EMPTY"),
});

export async function listBarrels() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select().from(barrels)
    .where(eq(barrels.companyId, companyId))
    .orderBy(barrels.code);
}

export async function upsertBarrel(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(BarrelSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    await db.update(barrels).set(data).where(and(eq(barrels.id, id), eq(barrels.companyId, companyId)));
  } else {
    await db.insert(barrels).values({ ...data, companyId });
  }
  revalidatePath("/production/aging");
  return { ok: true };
}

export async function deleteBarrel(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(barrels).where(and(eq(barrels.id, id), eq(barrels.companyId, companyId)));
  revalidatePath("/production/aging");
  return { ok: true };
}

const FillSchema = z.object({
  barrelId: z.string().min(1, "Barrel required"),
  productId: z.string().min(1, "Product required"),
  fillVolume: z.preprocess((v) => Number(v), z.number().positive()),
  fillAbv: z.preprocess((v) => Number(v), z.number().min(0).max(100)),
  filledAt: dateReq,
  notes: strOpt,
});

export async function fillBarrel(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(FillSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const data = parsed.data;

  const [barrel] = await db.select().from(barrels)
    .where(and(eq(barrels.id, data.barrelId), eq(barrels.companyId, companyId)));
  if (!barrel) return { ok: false, error: "Barrel not found" };
  if (barrel.status === "FILLED") return { ok: false, error: "Barrel already filled" };
  if (barrel.status === "RETIRED") return { ok: false, error: "Barrel is retired" };
  if (data.fillVolume > barrel.capacity) return { ok: false, error: `Fill volume exceeds capacity (${barrel.capacity}L)` };

  await db.insert(agingBatches).values({ ...data, companyId });
  await db.update(barrels).set({
    status: "FILLED",
    fillsCount: barrel.fillsCount + 1,
  }).where(eq(barrels.id, barrel.id));

  revalidatePath("/production/aging");
  return { ok: true };
}

const EmptySchema = z.object({
  agingBatchId: z.string().min(1),
  emptiedVolume: z.preprocess((v) => Number(v), z.number().positive()),
  emptiedAbv: z.preprocess((v) => Number(v), z.number().min(0).max(100)),
  emptiedAt: dateReq,
  notes: strOpt,
});

export async function emptyBarrel(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(EmptySchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { agingBatchId, emptiedVolume, emptiedAbv, emptiedAt, notes } = parsed.data;

  const [batch] = await db.select().from(agingBatches)
    .where(and(eq(agingBatches.id, agingBatchId), eq(agingBatches.companyId, companyId)));
  if (!batch) return { ok: false, error: "Aging batch not found" };
  if (batch.emptiedAt) return { ok: false, error: "Batch already emptied" };

  const angelsShare = batch.fillVolume > 0
    ? ((batch.fillVolume - emptiedVolume) / batch.fillVolume) * 100
    : 0;

  await db.update(agingBatches).set({
    emptiedAt, emptiedVolume, emptiedAbv, angelsShare,
    notes: notes ?? batch.notes,
  }).where(eq(agingBatches.id, agingBatchId));

  await db.update(barrels).set({ status: "EMPTIED" })
    .where(eq(barrels.id, batch.barrelId));

  revalidatePath("/production/aging");
  return { ok: true };
}

export async function listAgingBatches() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    batch: agingBatches,
    barrel: { id: barrels.id, code: barrels.code, capacity: barrels.capacity },
    product: { id: products.id, sku: products.sku, name: products.name },
  })
    .from(agingBatches)
    .leftJoin(barrels, eq(agingBatches.barrelId, barrels.id))
    .leftJoin(products, eq(agingBatches.productId, products.id))
    .where(eq(agingBatches.companyId, companyId))
    .orderBy(desc(agingBatches.filledAt));
}

// ============================================================
// BOTTLING
// ============================================================
const BOTTLING_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

const BottlingSchema = z.object({
  id: strOpt,
  runNumber: z.string().min(1, "Run number required"),
  finishedProductId: z.string().min(1, "Finished product required"),
  sourceBatchId: strOpt,
  sourceType: z.enum(["BREW", "AGING", "BLEND"]).optional(),
  plannedQty: z.preprocess((v) => Number(v), z.number().positive()),
  actualQty: numOpt,
  uom: z.string().default("PCS"),
  startDate: dateReq,
  endDate: dateIn,
  status: z.enum(BOTTLING_STATUSES).default("PLANNED"),
  notes: strOpt,
});

export async function listBottlingRuns() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    run: bottlingRuns,
    product: { id: products.id, sku: products.sku, name: products.name },
  })
    .from(bottlingRuns)
    .leftJoin(products, eq(bottlingRuns.finishedProductId, products.id))
    .where(eq(bottlingRuns.companyId, companyId))
    .orderBy(desc(bottlingRuns.startDate))
    .limit(200);
}

export async function upsertBottling(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(BottlingSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    await db.update(bottlingRuns).set(data).where(and(eq(bottlingRuns.id, id), eq(bottlingRuns.companyId, companyId)));
  } else {
    await db.insert(bottlingRuns).values({ ...data, companyId });
  }
  revalidatePath("/production/bottling");
  return { ok: true };
}

export async function deleteBottling(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCTION_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(bottlingRuns).where(and(eq(bottlingRuns.id, id), eq(bottlingRuns.companyId, companyId)));
  revalidatePath("/production/bottling");
  return { ok: true };
}

// ============================================================
// HELPERS
// ============================================================
export async function listRecipesForSelect(productClass?: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const conditions = [eq(recipes.companyId, companyId), eq(recipes.isActive, true)];
  const rows = await db.select({
    id: recipes.id, name: recipes.name, version: recipes.version,
    productId: recipes.productId, productClass: products.productClass,
  })
    .from(recipes)
    .leftJoin(products, eq(recipes.productId, products.id))
    .where(and(...conditions))
    .orderBy(recipes.name);
  return productClass ? rows.filter((r) => r.productClass === productClass) : rows;
}

export async function productionStats() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return null;

  const [br] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`sum(case when ${brews.status} in ('MASHING','BOILING','FERMENTING','CONDITIONING') then 1 else 0 end)`,
  }).from(brews).where(eq(brews.companyId, companyId));

  const [di] = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`sum(case when ${distillations.status} = 'IN_PROGRESS' then 1 else 0 end)`,
  }).from(distillations).where(eq(distillations.companyId, companyId));

  const [ba] = await db.select({
    total: sql<number>`count(*)`,
    filled: sql<number>`sum(case when ${barrels.status} = 'FILLED' then 1 else 0 end)`,
  }).from(barrels).where(eq(barrels.companyId, companyId));

  return { brews: br, distillations: di, barrels: ba };
}
