"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { companies, userCompanies } from "@/db/schema";
import { getActiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

const strOpt = z.string().optional().or(z.literal("")).transform((v) => v || undefined);

const CompanySchema = z.object({
  id: strOpt,
  name: z.string().min(2, "Name too short"),
  legalName: strOpt,
  tin: strOpt,
  vrn: strOpt,
  country: z.string().min(2).default("TZ"),
  baseCurrency: z.string().min(3).default("TZS"),
  address: strOpt,
  phone: strOpt,
  email: strOpt,
  logoUrl: strOpt,
});

export async function getActiveCompany() {
  const id = await getActiveCompanyId();
  if (!id) return null;
  const [row] = await db.select().from(companies).where(eq(companies.id, id));
  return row ?? null;
}

export async function listMyCompanies() {
  const user = await getCurrentUser();
  if (!user) return [];
  return db.select({ company: companies, link: userCompanies })
    .from(userCompanies)
    .innerJoin(companies, eq(userCompanies.companyId, companies.id))
    .where(eq(userCompanies.userId, user.id))
    .orderBy(companies.name);
}

export async function updateActiveCompany(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.COMPANY_MANAGE);
  const activeId = await getActiveCompanyId();
  if (!activeId) return { ok: false, error: "No active company" };
  const parsed = fromFormData(CompanySchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id: _id, ...data } = parsed.data;
  await db.update(companies).set(data).where(eq(companies.id, activeId));
  revalidatePath("/masters/companies");
  revalidatePath("/settings");
  return { ok: true };
}
