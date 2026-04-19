import { getCurrentRole } from "./tenant";
import { PERMISSIONS, ROLE_PRESETS, type Permission } from "./permissions";

export { PERMISSIONS, ROLE_PRESETS };
export type { Permission };

export async function hasPermission(perm: Permission): Promise<boolean> {
  const role = await getCurrentRole();
  if (!role) return false;
  const perms = (role.permissions ?? []) as string[];
  return perms.includes(perm);
}

export async function requirePermission(perm: Permission) {
  const ok = await hasPermission(perm);
  if (!ok) throw new Error(`Forbidden: missing ${perm}`);
}

export async function canSeeAllCompaniesTransport(): Promise<boolean> {
  return hasPermission(PERMISSIONS.TRANSPORT_CROSS_COMPANY);
}
