"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { customers } from "@/db/schema";
import { getActiveCompanyId } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const numberOr0 = z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number());
const intOr0 = z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int());

const UpsertSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Code is required"),
  name: z.string().min(2),
  type: z.enum(["RETAIL", "WHOLESALE", "ON_TRADE", "OFF_TRADE"]).default("RETAIL"),
  tin: z.string().optional(),
  vrn: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
  address: z.string().optional(),
  region: z.string().optional(),
  creditLimit: numberOr0,
  paymentTerms: intOr0,
  isActive: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()).default(true),
});

export async function listCustomers() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select().from(customers).where(eq(customers.companyId, companyId)).orderBy(customers.code);
}

export async function upsertCustomer(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.SALES_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };

  const parsed = fromFormData(UpsertSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    await db.update(customers).set({ ...data, paymentTerms: data.paymentTerms }).where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
  } else {
    await db.insert(customers).values({ ...data, companyId, paymentTerms: data.paymentTerms });
  }
  revalidatePath("/masters/customers");
  return { ok: true };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.SALES_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  await db.delete(customers).where(and(eq(customers.id, id), eq(customers.companyId, companyId)));
  revalidatePath("/masters/customers");
  return { ok: true };
}
