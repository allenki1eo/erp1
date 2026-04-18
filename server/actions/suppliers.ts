"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { suppliers } from "@/db/schema";
import { getActiveCompanyId } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const intOr0 = z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int());

const UpsertSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  name: z.string().min(2),
  tin: z.string().optional(),
  vrn: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
  address: z.string().optional(),
  paymentTerms: intOr0,
  isActive: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()).default(true),
});

export async function listSuppliers() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select().from(suppliers).where(eq(suppliers.companyId, companyId)).orderBy(suppliers.code);
}

export async function upsertSupplier(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };

  const parsed = fromFormData(UpsertSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    await db.update(suppliers).set(data).where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)));
  } else {
    await db.insert(suppliers).values({ ...data, companyId });
  }
  revalidatePath("/masters/suppliers");
  return { ok: true };
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PROCUREMENT_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(suppliers).where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)));
  revalidatePath("/masters/suppliers");
  return { ok: true };
}
