"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users, roles, userCompanies } from "@/db/schema";
import { getActiveCompanyId, getCurrentUser } from "@/lib/tenant";
import { requirePermission, PERMISSIONS, ROLE_PRESETS, type Permission } from "@/lib/rbac";
import { errorFromParse, fromFormData, type ActionResult } from "@/lib/actions";

// ============================================================
// LIST / READ
// ============================================================
export async function listCompanyUsers() {
  await requirePermission(PERMISSIONS.USER_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      isActive: users.isActive,
      createdAt: users.createdAt,
      roleId: roles.id,
      roleName: roles.name,
      isDefault: userCompanies.isDefault,
      salesTargetMonthly: userCompanies.salesTargetMonthly,
    })
    .from(userCompanies)
    .innerJoin(users, eq(userCompanies.userId, users.id))
    .leftJoin(roles, eq(userCompanies.roleId, roles.id))
    .where(eq(userCompanies.companyId, companyId))
    .orderBy(users.email);
}

export async function listRolesForCompany() {
  const companyId = await getActiveCompanyId();
  if (!companyId) return [];
  return db.select().from(roles).where(eq(roles.companyId, companyId)).orderBy(roles.name);
}

// ============================================================
// CREATE / INVITE USER (by email)
// ============================================================
const CreateUserSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleId: z.string().min(1, "Role required"),
  salesTargetMonthly: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().nonnegative()).default(0),
});

export async function createCompanyUser(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.USER_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };

  const parsed = fromFormData(CreateUserSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { name, password, roleId, salesTargetMonthly } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  // Role must belong to this company
  const [role] = await db.select().from(roles).where(and(eq(roles.id, roleId), eq(roles.companyId, companyId))).limit(1);
  if (!role) return { ok: false, error: "Role not found in this company" };

  // Find or create user
  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    [user] = await db.insert(users).values({ name, email, passwordHash }).returning();
  } else {
    // Already linked?
    const [existing] = await db.select().from(userCompanies)
      .where(and(eq(userCompanies.userId, user.id), eq(userCompanies.companyId, companyId))).limit(1);
    if (existing) return { ok: false, error: "User is already a member of this company" };
  }

  await db.insert(userCompanies).values({
    userId: user.id,
    companyId,
    roleId,
    salesTargetMonthly,
    isDefault: false,
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

// ============================================================
// UPDATE ROLE / TARGET
// ============================================================
const UpdateMembershipSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
  salesTargetMonthly: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().nonnegative()).default(0),
  isActive: z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean()).default(true),
});

export async function updateCompanyUser(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.USER_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };

  const parsed = fromFormData(UpdateMembershipSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { userId, roleId, salesTargetMonthly, isActive } = parsed.data;

  const [role] = await db.select().from(roles).where(and(eq(roles.id, roleId), eq(roles.companyId, companyId))).limit(1);
  if (!role) return { ok: false, error: "Role not found in this company" };

  await db.update(userCompanies)
    .set({ roleId, salesTargetMonthly })
    .where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId)));

  await db.update(users).set({ isActive }).where(eq(users.id, userId));

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function removeUserFromCompany(userId: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.USER_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };

  const me = await getCurrentUser();
  if (me?.id === userId) return { ok: false, error: "You cannot remove yourself" };

  await db.delete(userCompanies)
    .where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId)));

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.USER_MANAGE);
  if (!newPassword || newPassword.length < 8) return { ok: false, error: "Password must be at least 8 characters" };
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  return { ok: true };
}

// ============================================================
// ROLE MANAGEMENT
// ============================================================
const UpsertRoleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name required"),
  permissions: z.string().optional(),  // comma-separated or JSON array
  preset: z.string().optional(),       // apply preset permissions
});

export async function upsertRole(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.USER_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };

  const parsed = fromFormData(UpsertRoleSchema, formData);
  if (!parsed.success) return errorFromParse(parsed);
  const { id, name, preset } = parsed.data;

  // Collect permissions: either from preset OR checkbox list ("perm:xxx" entries with value "on")
  let permissions: Permission[] = [];
  if (preset && ROLE_PRESETS[preset]) {
    permissions = ROLE_PRESETS[preset] as Permission[];
  } else {
    const checks: Permission[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("perm:") && (value === "on" || value === "true")) {
        checks.push(key.slice(5) as Permission);
      }
    }
    permissions = checks;
  }

  if (id) {
    // Prevent renaming to a conflicting name
    const [conflict] = await db.select().from(roles)
      .where(and(eq(roles.companyId, companyId), eq(roles.name, name), ne(roles.id, id))).limit(1);
    if (conflict) return { ok: false, error: "Another role already uses that name" };
    await db.update(roles).set({ name, permissions })
      .where(and(eq(roles.id, id), eq(roles.companyId, companyId)));
  } else {
    const [conflict] = await db.select().from(roles)
      .where(and(eq(roles.companyId, companyId), eq(roles.name, name))).limit(1);
    if (conflict) return { ok: false, error: "A role with that name already exists" };
    await db.insert(roles).values({ companyId, name, permissions });
  }

  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteRole(id: string): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.USER_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };
  // Block delete if any membership uses it
  const [inUse] = await db.select().from(userCompanies).where(eq(userCompanies.roleId, id)).limit(1);
  if (inUse) return { ok: false, error: "Role is assigned to one or more users — reassign them first" };
  await db.delete(roles).where(and(eq(roles.id, id), eq(roles.companyId, companyId)));
  revalidatePath("/admin/roles");
  return { ok: true };
}

// Seed the standard preset roles for the current company (idempotent).
export async function seedRolePresets(): Promise<ActionResult> {
  await requirePermission(PERMISSIONS.USER_MANAGE);
  const companyId = await getActiveCompanyId();
  if (!companyId) return { ok: false, error: "No active company" };

  const existing = await db.select().from(roles).where(eq(roles.companyId, companyId));
  const have = new Set(existing.map((r) => r.name));
  const toCreate = Object.entries(ROLE_PRESETS)
    .filter(([name]) => !have.has(name))
    .map(([name, permissions]) => ({ companyId, name, permissions }));
  if (toCreate.length) await db.insert(roles).values(toCreate);
  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
  return { ok: true, data: { created: toCreate.length } };
}
