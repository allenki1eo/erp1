import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, companies, roles, userCompanies } from "@/db/schema";
import { ROLE_PRESETS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_EMAIL env var is not set" },
      { status: 400 }
    );
  }

  // Find or create the admin user
  let [user] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

  if (!user) {
    if (!adminPassword || adminPassword.length < 8) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_PASSWORD must be set (min 8 chars) to create the admin user" },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    [user] = await db
      .insert(users)
      .values({ name: "Admin", email: adminEmail, passwordHash, isActive: true })
      .returning();
  } else if (!user.isActive) {
    await db.update(users).set({ isActive: true }).where(eq(users.id, user.id));
    user.isActive = true;
  }

  // Find or create a default company
  const allCompanies = await db.select().from(companies).limit(1);
  let company = allCompanies[0];

  if (!company) {
    [company] = await db
      .insert(companies)
      .values({
        name: "My Company",
        country: process.env.DEFAULT_COUNTRY ?? "TZ",
        baseCurrency: process.env.DEFAULT_CURRENCY ?? "TZS",
      })
      .returning();
  }

  // Seed all role presets for the company (idempotent)
  const existingRoles = await db.select().from(roles).where(eq(roles.companyId, company.id));
  const haveNames = new Set(existingRoles.map((r) => r.name));
  const toCreate = Object.entries(ROLE_PRESETS)
    .filter(([name]) => !haveNames.has(name))
    .map(([name, permissions]) => ({ companyId: company.id, name, permissions }));
  if (toCreate.length) {
    await db.insert(roles).values(toCreate);
  }

  // Find ADMIN role
  const [adminRole] = await db
    .select()
    .from(roles)
    .where(eq(roles.companyId, company.id))
    .then((r) => r.filter((x) => x.name === "ADMIN"));

  if (!adminRole) {
    return NextResponse.json({ ok: false, error: "ADMIN role not found after seeding" }, { status: 500 });
  }

  // Link user to company as ADMIN (upsert)
  const [existing] = await db
    .select()
    .from(userCompanies)
    .where(eq(userCompanies.userId, user.id))
    .then((rows) => rows.filter((r) => r.companyId === company.id));

  if (existing) {
    await db
      .update(userCompanies)
      .set({ roleId: adminRole.id, isDefault: true })
      .where(eq(userCompanies.userId, user.id));
  } else {
    await db.insert(userCompanies).values({
      userId: user.id,
      companyId: company.id,
      roleId: adminRole.id,
      isDefault: true,
    });
  }

  return NextResponse.json({
    ok: true,
    message: `Admin setup complete. User ${adminEmail} is ADMIN of company "${company.name}".`,
    companyId: company.id,
    userId: user.id,
  });
}
