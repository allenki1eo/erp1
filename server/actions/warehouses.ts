"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { warehouses } from "@/db/schema";
import { getActiveCompanyId } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const UpsertSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Code is required").max(20),
  name: z.string().min(2, "Name is required"),
  type: z.enum(["MAIN", "BONDED", "TRANSIT", "RETAIL"]).default("MAIN"),
  address: z.string().optional(),
  isActive: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()).default(true),
});

export async function listWarehouses() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select().from(warehouses).where(eq(warehouses.companyId, companyId)).orderBy(warehouses.code);
}

export async function upsertWarehouse(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };

  const parsed = fromFormData(UpsertSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    await db.update(warehouses).set(data).where(and(eq(warehouses.id, id), eq(warehouses.companyId, companyId)));
  } else {
    await db.insert(warehouses).values({ ...data, companyId });
  }
  revalidatePath("/masters/warehouses");
  return { ok: true };
}

export async function deleteWarehouse(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(warehouses).where(and(eq(warehouses.id, id), eq(warehouses.companyId, companyId)));
  revalidatePath("/masters/warehouses");
  return { ok: true };
}
