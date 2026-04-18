"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, userCompanies } from "@/db/schema";
import { getCurrentUser } from "@/lib/tenant";
import { canSeeAllCompaniesTransport } from "@/lib/rbac";

/** Companies visible to the current user, broader when they have cross-company transport access. */
export async function listAccessibleCompanies() {
  const user = await getCurrentUser();
  if (!user) return [];

  const all = await canSeeAllCompaniesTransport();
  if (all) {
    return db.select({ id: companies.id, name: companies.name }).from(companies).orderBy(companies.name);
  }

  return db
    .select({ id: companies.id, name: companies.name })
    .from(userCompanies)
    .innerJoin(companies, eq(userCompanies.companyId, companies.id))
    .where(eq(userCompanies.userId, user.id))
    .orderBy(companies.name);
}
