import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { userCompanies, companies, roles } from "@/db/schema";
import { auth } from "@/lib/auth";

const COMPANY_COOKIE = "active_company_id";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user as { id: string; email: string; name?: string | null } | null;
}

export async function getActiveCompanyId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(COMPANY_COOKIE)?.value;

  if (cookieVal) {
    const [link] = await db
      .select()
      .from(userCompanies)
      .where(and(eq(userCompanies.userId, user.id), eq(userCompanies.companyId, cookieVal)))
      .limit(1);
    if (link) return cookieVal;
  }

  const [defaultLink] = await db
    .select()
    .from(userCompanies)
    .where(eq(userCompanies.userId, user.id))
    .limit(1);

  return defaultLink?.companyId ?? null;
}

export async function getCurrentCompany() {
  const id = await getActiveCompanyId();
  if (!id) return null;
  const [company] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return company ?? null;
}

export async function getUserCompanies() {
  const user = await getCurrentUser();
  if (!user) return [];
  return db
    .select({ company: companies, role: roles, link: userCompanies })
    .from(userCompanies)
    .innerJoin(companies, eq(userCompanies.companyId, companies.id))
    .leftJoin(roles, eq(userCompanies.roleId, roles.id))
    .where(eq(userCompanies.userId, user.id));
}

export async function setActiveCompany(companyId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COMPANY_COOKIE, companyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getCurrentRole() {
  const user = await getCurrentUser();
  const companyId = await getActiveCompanyId();
  if (!user || !companyId) return null;

  const [link] = await db
    .select({ role: roles })
    .from(userCompanies)
    .leftJoin(roles, eq(userCompanies.roleId, roles.id))
    .where(and(eq(userCompanies.userId, user.id), eq(userCompanies.companyId, companyId)))
    .limit(1);

  return link?.role ?? null;
}
