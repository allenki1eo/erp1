import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, companies, roles, userCompanies } from "@/db/schema";
import { ROLE_PRESETS } from "@/lib/permissions";

/**
 * Idempotently ensures the user matching ADMIN_EMAIL env var is set up as
 * ADMIN of a default company, with all role presets seeded. Safe to call
 * repeatedly — bails out if the user already has a company link.
 */
export async function ensureAdminBootstrap(userId: string, email: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!adminEmail || email.toLowerCase() !== adminEmail) return;

  // Already linked to a company → nothing to do.
  const existing = await db
    .select()
    .from(userCompanies)
    .where(eq(userCompanies.userId, userId))
    .limit(1);
  if (existing.length > 0) return;

  // Find or create a default company.
  const [first] = await db.select().from(companies).limit(1);
  const company =
    first ??
    (await db
      .insert(companies)
      .values({
        name: "My Company",
        country: process.env.DEFAULT_COUNTRY ?? "TZ",
        baseCurrency: process.env.DEFAULT_CURRENCY ?? "TZS",
      })
      .returning())[0];

  // Seed role presets that don't exist yet.
  const existingRoles = await db.select().from(roles).where(eq(roles.companyId, company.id));
  const haveNames = new Set(existingRoles.map((r) => r.name));
  const toCreate = Object.entries(ROLE_PRESETS)
    .filter(([name]) => !haveNames.has(name))
    .map(([name, permissions]) => ({ companyId: company.id, name, permissions }));
  if (toCreate.length) {
    await db.insert(roles).values(toCreate);
  }

  const allRoles = await db.select().from(roles).where(eq(roles.companyId, company.id));
  const adminRole = allRoles.find((r) => r.name === "ADMIN");
  if (!adminRole) return;

  await db.insert(userCompanies).values({
    userId,
    companyId: company.id,
    roleId: adminRole.id,
    isDefault: true,
  });
}

/**
 * Create the admin user from ADMIN_EMAIL / ADMIN_PASSWORD if they don't exist,
 * then run the bootstrap. Used by the /api/setup endpoint. Returns an outcome
 * string for the API response.
 */
export async function runFullAdminSetup(): Promise<
  | { ok: true; message: string; userId: string; companyId: string }
  | { ok: false; error: string; status: number }
> {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail) {
    return { ok: false, error: "ADMIN_EMAIL env var is not set", status: 400 };
  }

  let [user] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

  if (!user) {
    if (!adminPassword || adminPassword.length < 8) {
      return {
        ok: false,
        error: "ADMIN_PASSWORD must be set (min 8 chars) to create the admin user",
        status: 400,
      };
    }
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    [user] = await db
      .insert(users)
      .values({ name: "Admin", email: adminEmail, passwordHash, isActive: true })
      .returning();
  } else if (!user.isActive) {
    await db.update(users).set({ isActive: true }).where(eq(users.id, user.id));
  }

  await ensureAdminBootstrap(user.id, adminEmail);

  const [link] = await db
    .select()
    .from(userCompanies)
    .where(eq(userCompanies.userId, user.id))
    .limit(1);

  if (!link) {
    return { ok: false, error: "Bootstrap ran but no company link was created", status: 500 };
  }

  return {
    ok: true,
    message: `Admin setup complete. ${adminEmail} is ADMIN of the default company.`,
    userId: user.id,
    companyId: link.companyId,
  };
}
