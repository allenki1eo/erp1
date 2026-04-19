"use server";

import { z } from "zod";
import { and, eq, desc, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  qualityChecks, qcCheckTemplates, nonConformances, batchHoldEvents,
  stockBatches, products, brews, distillations, bottlingRuns, agingBatches,
  goodsReceipts,
} from "@/db/schema";
import { getActiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const strOpt = z.string().optional().or(z.literal("")).transform((v) => v || undefined);
const numOpt = z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().optional());
const boolIn = z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean());

// ============================================================
// CHECK TEMPLATES
// ============================================================
const TemplateSchema = z.object({
  id: strOpt,
  name: z.string().min(2, "Name required"),
  refType: z.enum(["BREW", "DISTILLATION", "AGING", "BOTTLING", "GRN"]),
  stage: strOpt,
  checkType: z.enum(["ABV", "GRAVITY", "PH", "MICROBIAL", "SENSORY", "VISUAL", "TEMPERATURE", "VOLUME"]),
  productClass: strOpt,
  productId: strOpt,
  unit: strOpt,
  minSpec: numOpt,
  maxSpec: numOpt,
  mandatory: boolIn.default(true),
  holdOnFail: boolIn.default(true),
  isActive: boolIn.default(true),
});

export async function listTemplates() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    tpl: qcCheckTemplates,
    product: { id: products.id, sku: products.sku, name: products.name },
  })
    .from(qcCheckTemplates)
    .leftJoin(products, eq(qcCheckTemplates.productId, products.id))
    .where(eq(qcCheckTemplates.companyId, companyId))
    .orderBy(qcCheckTemplates.refType, qcCheckTemplates.stage, qcCheckTemplates.name);
}

export async function upsertTemplate(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.QUALITY_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(TemplateSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;
  if (id) {
    await db.update(qcCheckTemplates).set(data).where(and(eq(qcCheckTemplates.id, id), eq(qcCheckTemplates.companyId, companyId)));
  } else {
    await db.insert(qcCheckTemplates).values({ ...data, companyId });
  }
  revalidatePath("/quality/templates");
  return { ok: true };
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.QUALITY_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(qcCheckTemplates).where(and(eq(qcCheckTemplates.id, id), eq(qcCheckTemplates.companyId, companyId)));
  revalidatePath("/quality/templates");
  return { ok: true };
}

// ============================================================
// QC CHECKS
// ============================================================
const CheckSchema = z.object({
  id: strOpt,
  templateId: strOpt,
  refType: z.enum(["BREW", "DISTILLATION", "AGING", "BOTTLING", "GRN"]),
  refId: z.string().min(1, "Reference required"),
  stage: strOpt,
  checkType: z.enum(["ABV", "GRAVITY", "PH", "MICROBIAL", "SENSORY", "VISUAL", "TEMPERATURE", "VOLUME"]),
  measuredValue: numOpt,
  unit: strOpt,
  minSpec: numOpt,
  maxSpec: numOpt,
  result: z.enum(["PASS", "FAIL", "HOLD"]),
  notes: strOpt,
});

export async function listChecks(opts?: { refType?: string; refId?: string; result?: string }) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const conditions = [eq(qualityChecks.companyId, companyId)];
  if (opts?.refType) conditions.push(eq(qualityChecks.refType, opts.refType));
  if (opts?.refId) conditions.push(eq(qualityChecks.refId, opts.refId));
  if (opts?.result) conditions.push(eq(qualityChecks.result, opts.result));
  return db.select({
    check: qualityChecks,
    template: { id: qcCheckTemplates.id, name: qcCheckTemplates.name, holdOnFail: qcCheckTemplates.holdOnFail },
  })
    .from(qualityChecks)
    .leftJoin(qcCheckTemplates, eq(qualityChecks.templateId, qcCheckTemplates.id))
    .where(and(...conditions))
    .orderBy(desc(qualityChecks.checkedAt))
    .limit(300);
}

/** Evaluate PASS/FAIL from spec when possible (UI may override to HOLD). */
function evaluateResult(value: number | undefined, min: number | undefined, max: number | undefined): "PASS" | "FAIL" | null {
  if (value == null) return null;
  if (min != null && value < min) return "FAIL";
  if (max != null && value > max) return "FAIL";
  return "PASS";
}

export async function recordCheck(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.QUALITY_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const user = await getCurrentUser();
  const parsed = fromFormData(CheckSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  // If a template was picked, pull its specs to ensure consistency.
  let specs = { minSpec: data.minSpec, maxSpec: data.maxSpec, unit: data.unit, holdOnFail: true };
  if (data.templateId) {
    const [tpl] = await db.select().from(qcCheckTemplates).where(eq(qcCheckTemplates.id, data.templateId));
    if (tpl) {
      specs = {
        minSpec: tpl.minSpec ?? data.minSpec,
        maxSpec: tpl.maxSpec ?? data.maxSpec,
        unit: tpl.unit ?? data.unit,
        holdOnFail: tpl.holdOnFail,
      };
    }
  }

  // If caller did not explicitly set HOLD, derive PASS/FAIL from measurement when specs exist.
  let finalResult: "PASS" | "FAIL" | "HOLD" = data.result;
  if (data.result !== "HOLD") {
    const derived = evaluateResult(data.measuredValue, specs.minSpec ?? undefined, specs.maxSpec ?? undefined);
    if (derived) finalResult = derived;
  }

  if (id) {
    await db.update(qualityChecks).set({
      ...data,
      minSpec: specs.minSpec,
      maxSpec: specs.maxSpec,
      unit: specs.unit,
      result: finalResult,
    }).where(and(eq(qualityChecks.id, id), eq(qualityChecks.companyId, companyId)));
    revalidatePath("/quality");
    return { ok: true };
  }

  await db.insert(qualityChecks).values({
    ...data,
    companyId,
    minSpec: specs.minSpec,
    maxSpec: specs.maxSpec,
    unit: specs.unit,
    result: finalResult,
    inspectorId: user?.id,
  });

  revalidatePath("/quality");
  return { ok: true };
}

export async function deleteCheck(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.QUALITY_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(qualityChecks).where(and(eq(qualityChecks.id, id), eq(qualityChecks.companyId, companyId)));
  revalidatePath("/quality");
  return { ok: true };
}

// ============================================================
// REFERENCE LOOKUPS — used by the QC dialog to pick a brew/run
// ============================================================
export async function listQcReferences(refType: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  switch (refType) {
    case "BREW":
      return db.select({ id: brews.id, label: sql<string>`${brews.batchNumber}` })
        .from(brews).where(eq(brews.companyId, companyId)).orderBy(desc(brews.startDate)).limit(100);
    case "DISTILLATION":
      return db.select({ id: distillations.id, label: sql<string>`${distillations.runNumber}` })
        .from(distillations).where(eq(distillations.companyId, companyId)).orderBy(desc(distillations.startDate)).limit(100);
    case "AGING":
      return db.select({ id: agingBatches.id, label: sql<string>`${agingBatches.id}` })
        .from(agingBatches).where(eq(agingBatches.companyId, companyId)).limit(100);
    case "BOTTLING":
      return db.select({ id: bottlingRuns.id, label: sql<string>`${bottlingRuns.runNumber}` })
        .from(bottlingRuns).where(eq(bottlingRuns.companyId, companyId)).orderBy(desc(bottlingRuns.startDate)).limit(100);
    case "GRN":
      return db.select({ id: goodsReceipts.id, label: sql<string>`${goodsReceipts.number}` })
        .from(goodsReceipts).where(eq(goodsReceipts.companyId, companyId)).orderBy(desc(goodsReceipts.receivedDate)).limit(100);
    default:
      return [];
  }
}

// ============================================================
// NON-CONFORMANCES
// ============================================================
const NcSchema = z.object({
  id: strOpt,
  refType: strOpt,
  refId: strOpt,
  batchId: strOpt,
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]),
  description: z.string().min(4, "Description required"),
  rootCause: strOpt,
  correctiveAction: strOpt,
  disposition: strOpt,
  status: z.enum(["OPEN", "IN_REVIEW", "CLOSED"]).default("OPEN"),
});

async function nextNcNumber(companyId: string) {
  const year = new Date().getFullYear();
  const prefix = `NCR-${year}-`;
  const rows = await db.select({ n: nonConformances.number }).from(nonConformances)
    .where(and(eq(nonConformances.companyId, companyId), sql`${nonConformances.number} LIKE ${prefix + "%"}`));
  const max = rows.reduce((m, r) => {
    const seq = parseInt(r.n.split("-").pop() ?? "0", 10);
    return seq > m ? seq : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

export async function listNonConformances(status?: string) {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  const conditions = [eq(nonConformances.companyId, companyId)];
  if (status) conditions.push(eq(nonConformances.status, status));
  return db.select().from(nonConformances)
    .where(and(...conditions))
    .orderBy(desc(nonConformances.raisedAt));
}

export async function upsertNonConformance(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.QUALITY_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const user = await getCurrentUser();
  const parsed = fromFormData(NcSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    const patch: Record<string, unknown> = { ...data };
    if (data.status === "CLOSED") {
      patch.closedAt = new Date();
      patch.closedById = user?.id;
    }
    await db.update(nonConformances).set(patch).where(and(eq(nonConformances.id, id), eq(nonConformances.companyId, companyId)));
  } else {
    const number = await nextNcNumber(companyId);
    await db.insert(nonConformances).values({
      ...data,
      companyId,
      number,
      raisedById: user?.id,
    });
  }
  revalidatePath("/quality/non-conformance");
  return { ok: true };
}

export async function deleteNonConformance(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.QUALITY_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(nonConformances).where(and(eq(nonConformances.id, id), eq(nonConformances.companyId, companyId)));
  revalidatePath("/quality/non-conformance");
  return { ok: true };
}

// ============================================================
// BATCH HOLD / RELEASE
// ============================================================
const HoldSchema = z.object({
  batchId: z.string().min(1),
  action: z.enum(["HOLD", "QUARANTINE", "RELEASE", "REJECT"]),
  reason: strOpt,
  ncId: strOpt,
});

const statusForAction: Record<string, string> = {
  HOLD: "ON_HOLD",
  QUARANTINE: "QUARANTINE",
  RELEASE: "AVAILABLE",
  REJECT: "EXPIRED",
};

export async function listHeldBatches() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select({
    batch: stockBatches,
    product: { id: products.id, sku: products.sku, name: products.name },
  })
    .from(stockBatches)
    .leftJoin(products, eq(stockBatches.productId, products.id))
    .where(and(
      eq(stockBatches.companyId, companyId),
      inArray(stockBatches.status, ["ON_HOLD", "QUARANTINE"]),
    ))
    .orderBy(desc(stockBatches.createdAt));
}

export async function listBatchHoldEvents(batchId: string) {
  return db.select().from(batchHoldEvents)
    .where(eq(batchHoldEvents.batchId, batchId))
    .orderBy(desc(batchHoldEvents.actionedAt));
}

export async function changeBatchStatus(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.QUALITY_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  const user = await getCurrentUser();
  const parsed = fromFormData(HoldSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { batchId, action, reason, ncId } = parsed.data;

  const [batch] = await db.select().from(stockBatches)
    .where(and(eq(stockBatches.id, batchId), eq(stockBatches.companyId, companyId)));
  if (!batch) return { ok: false, error: "Batch not found" };

  const newStatus = statusForAction[action];
  await db.update(stockBatches).set({ status: newStatus }).where(eq(stockBatches.id, batchId));
  await db.insert(batchHoldEvents).values({
    companyId,
    batchId,
    action,
    reason,
    ncId,
    previousStatus: batch.status,
    newStatus,
    actionedById: user?.id,
  });

  revalidatePath("/quality/batches");
  revalidatePath("/inventory/batches");
  return { ok: true };
}

// ============================================================
// DASHBOARD STATS
// ============================================================
export async function qcStats() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return null;
  const [checks30] = await db.select({
    total: sql<number>`count(*)`,
    passed: sql<number>`sum(case when ${qualityChecks.result} = 'PASS' then 1 else 0 end)`,
    failed: sql<number>`sum(case when ${qualityChecks.result} = 'FAIL' then 1 else 0 end)`,
    held: sql<number>`sum(case when ${qualityChecks.result} = 'HOLD' then 1 else 0 end)`,
  })
    .from(qualityChecks)
    .where(and(
      eq(qualityChecks.companyId, companyId),
      sql`${qualityChecks.checkedAt} >= ${Date.now() - 30 * 24 * 60 * 60 * 1000}`,
    ));

  const [ncs] = await db.select({
    open: sql<number>`sum(case when ${nonConformances.status} = 'OPEN' then 1 else 0 end)`,
    inReview: sql<number>`sum(case when ${nonConformances.status} = 'IN_REVIEW' then 1 else 0 end)`,
    critical: sql<number>`sum(case when ${nonConformances.severity} = 'CRITICAL' and ${nonConformances.status} != 'CLOSED' then 1 else 0 end)`,
  })
    .from(nonConformances)
    .where(eq(nonConformances.companyId, companyId));

  const [held] = await db.select({
    n: sql<number>`count(*)`,
  })
    .from(stockBatches)
    .where(and(
      eq(stockBatches.companyId, companyId),
      inArray(stockBatches.status, ["ON_HOLD", "QUARANTINE"]),
    ));

  return {
    checks30: checks30 ?? { total: 0, passed: 0, failed: 0, held: 0 },
    ncs: ncs ?? { open: 0, inReview: 0, critical: 0 },
    heldBatches: held?.n ?? 0,
  };
}
