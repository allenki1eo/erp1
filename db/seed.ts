/**
 * Initial seed: one admin user, one company, role presets, default tax codes.
 * Run with: pnpm db:seed (or npm run db:seed)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  users, companies, roles, userCompanies, taxCodes, exciseRates,
} from "@/db/schema";
import { ROLE_PRESETS } from "@/lib/rbac";

async function main() {
  const adminEmail = "admin@example.com";
  const adminPassword = "admin12345";

  console.log("Seeding admin user...");
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const [admin] = await db.insert(users).values({
    email: adminEmail, name: "Admin", passwordHash,
  }).returning();

  console.log("Seeding company...");
  const [company] = await db.insert(companies).values({
    name: "Demo Brewery & Distillery Ltd",
    legalName: "Demo Brewery & Distillery Limited",
    country: "TZ",
    baseCurrency: "TZS",
    tin: "000-000-000",
  }).returning();

  console.log("Seeding roles...");
  const [adminRole] = await db.insert(roles).values({
    companyId: company.id, name: "ADMIN", permissions: ROLE_PRESETS.ADMIN,
  }).returning();

  await db.insert(roles).values(
    Object.entries(ROLE_PRESETS)
      .filter(([n]) => n !== "ADMIN")
      .map(([name, permissions]) => ({ companyId: company.id, name, permissions }))
  );

  await db.insert(userCompanies).values({
    userId: admin.id, companyId: company.id, roleId: adminRole.id, isDefault: true,
  });

  console.log("Seeding tax codes...");
  await db.insert(taxCodes).values([
    { companyId: company.id, code: "VAT18", name: "VAT 18%", rate: 0.18, type: "VAT" },
    { companyId: company.id, code: "VAT0", name: "Zero-rated VAT", rate: 0, type: "VAT" },
    { companyId: company.id, code: "EXEMPT", name: "Exempt", rate: 0, type: "VAT" },
  ]);

  console.log("Seeding excise rates...");
  await db.insert(exciseRates).values([
    { companyId: company.id, productClass: "BEER", ratePerLitre: 765, effectiveFrom: new Date() },
    { companyId: company.id, productClass: "SPIRIT", ratePerLitre: 3655, effectiveFrom: new Date() },
  ]);

  console.log("Done.");
  console.log(`Login → ${adminEmail} / ${adminPassword}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
