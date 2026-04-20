import { redirect } from "next/navigation";
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

/**
 * Same check as requirePermission, but for server components / pages:
 * sends the user to /forbidden instead of throwing (which React masks in prod).
 */
export async function requirePermissionOrRedirect(perm: Permission) {
  const ok = await hasPermission(perm);
  if (!ok) redirect(`/forbidden?p=${encodeURIComponent(perm)}`);
}

export async function canSeeAllCompaniesTransport(): Promise<boolean> {
  return hasPermission(PERMISSIONS.TRANSPORT_CROSS_COMPANY);
}

export async function getCurrentPermissions(): Promise<string[]> {
  const role = await getCurrentRole();
  return (role?.permissions ?? []) as string[];
}
