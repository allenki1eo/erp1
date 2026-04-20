import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, roles, userCompanies } from "@/db/schema";
import { PERMISSIONS, ROLE_PRESETS } from "@/lib/permissions";

const ADMIN_ROLE_NAME = "Administrator";

function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(/[\s,]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Grants ADMIN role to users whose email is in ADMIN_EMAILS.
 * Idempotent: creates the default company + admin role on first run,
 * then links (or re-links) the user as admin.
 *
 * Called from the authenticated layout so it re-applies if the list changes.
 * Bails out quickly when the email isn't listed — one Set lookup, no DB hits.
 */
export async function ensureAdminBootstrap(userId: string, email: string) {
  const allowed = parseAdminEmails();
  if (allowed.length === 0) return;
  if (!allowed.includes(email.toLowerCase())) return;

  const adminPerms = Object.values(PERMISSIONS) as string[];

  let [company] = await db.select().from(companies).limit(1);
  if (!company) {
    [company] = await db
      .insert(companies)
      .values({ name: "My Company" })
      .returning();
  }

  let [role] = await db
    .select()
    .from(roles)
    .where(and(eq(roles.companyId, company.id), eq(roles.name, ADMIN_ROLE_NAME)))
    .limit(1);
  if (!role) {
    [role] = await db
      .insert(roles)
      .values({
        companyId: company.id,
        name: ADMIN_ROLE_NAME,
        permissions: ROLE_PRESETS.ADMIN as string[],
      })
      .returning();
  } else if ((role.permissions ?? []).length < adminPerms.length) {
    // keep admin role up to date as PERMISSIONS grows
    await db
      .update(roles)
      .set({ permissions: adminPerms })
      .where(eq(roles.id, role.id));
  }

  const [link] = await db
    .select()
    .from(userCompanies)
    .where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, company.id)))
    .limit(1);

  if (!link) {
    await db.insert(userCompanies).values({
      userId,
      companyId: company.id,
      roleId: role.id,
      isDefault: true,
    });
  } else if (link.roleId !== role.id) {
    await db
      .update(userCompanies)
      .set({ roleId: role.id })
      .where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, company.id)));
  }
}
