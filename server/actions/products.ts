"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { getActiveCompanyId } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const numberOpt = z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().optional());
const numberOr0 = z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number());

const UpsertSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "SKU is required").max(40),
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["RAW_MATERIAL", "PACKAGING", "WIP", "FINISHED_GOOD", "CONSUMABLE"]),
  productClass: z.enum(["BEER", "SPIRIT", "WINE", "NON_ALC"]).optional().or(z.literal("")).transform((v) => v || undefined),
  uom: z.string().default("PCS"),
  packSize: numberOpt,
  unitsPerCase: numberOpt,
  abv: numberOpt,
  costPrice: numberOr0,
  sellingPrice: numberOr0,
  reorderLevel: numberOr0,
  isActive: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()).default(true),
});

export async function listProducts() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select().from(products).where(eq(products.companyId, companyId)).orderBy(products.sku);
}

export async function upsertProduct(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCT_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };

  const parsed = fromFormData(UpsertSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    await db.update(products).set(data).where(and(eq(products.id, id), eq(products.companyId, companyId)));
  } else {
    await db.insert(products).values({ ...data, companyId });
  }
  revalidatePath("/masters/products");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.PRODUCT_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(products).where(and(eq(products.id, id), eq(products.companyId, companyId)));
  revalidatePath("/masters/products");
  return { ok: true };
}
