"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { companies } from "@/db/schema";
import { getCurrentUser, getActiveCompanyId } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const UpsertSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Company name is required"),
  legalName: z.string().optional(),
  tin: z.string().optional(),
  vrn: z.string().optional(),
  country: z.string().default("TZ"),
  baseCurrency: z.string().default("TZS"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  isActive: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()).default(true),
});

export async function listAllCompanies() {
  await requirePermission(PERMISSIONS.COMPANY_MANAGE);
  return db.select().from(companies).orderBy(companies.name);
}

export async function getCompanyById(id: string) {
  await requirePermission(PERMISSIONS.COMPANY_MANAGE);
  const [company] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return company ?? null;
}

export async function upsertCompany(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.COMPANY_MANAGE);
  const parsed = fromFormData(UpsertSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, ...data } = parsed.data;

  if (id) {
    await db.update(companies).set(data).where(eq(companies.id, id));
  } else {
    await db.insert(companies).values(data);
  }
  revalidatePath("/masters/companies");
  return { ok: true };
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.COMPANY_MANAGE);
  
  // Prevent deleting the currently active company
  const activeCompanyId = await getActiveCompanyId();
  if (id === activeCompanyId) {
    return { ok: false, error: "Cannot delete the currently active company" };
  }
  
  await db.delete(companies).where(eq(companies.id, id));
  revalidatePath("/masters/companies");
  return { ok: true };
}

export async function toggleCompanyStatus(id: string, isActive: boolean): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.COMPANY_MANAGE);
  await db.update(companies).set({ isActive }).where(eq(companies.id, id));
  revalidatePath("/masters/companies");
  return { ok: true };
}
