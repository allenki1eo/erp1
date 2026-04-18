import { getCurrentRole } from "./tenant";

export const PERMISSIONS = {
  COMPANY_MANAGE: "company:manage",
  USER_MANAGE: "user:manage",
  PRODUCT_MANAGE: "product:manage",
  RECIPE_MANAGE: "recipe:manage",
  PROCUREMENT_MANAGE: "procurement:manage",
  INVENTORY_MANAGE: "inventory:manage",
  PRODUCTION_MANAGE: "production:manage",
  QUALITY_MANAGE: "quality:manage",
  SALES_MANAGE: "sales:manage",
  SALES_OWN: "sales:own",
  FINANCE_MANAGE: "finance:manage",
  REPORTS_VIEW: "reports:view",
  TRANSPORT_MANAGE: "transport:manage",
  TRANSPORT_CROSS_COMPANY: "transport:cross_company",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PRESETS: Record<string, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS),
  PLANT_MANAGER: [
    PERMISSIONS.PRODUCT_MANAGE,
    PERMISSIONS.RECIPE_MANAGE,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.PRODUCTION_MANAGE,
    PERMISSIONS.QUALITY_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  QC: [PERMISSIONS.QUALITY_MANAGE, PERMISSIONS.PRODUCTION_MANAGE],
  WAREHOUSE: [PERMISSIONS.INVENTORY_MANAGE, PERMISSIONS.PROCUREMENT_MANAGE],
  SALES_MANAGER: [PERMISSIONS.SALES_MANAGE, PERMISSIONS.REPORTS_VIEW],
  SALES_REP: [PERMISSIONS.SALES_OWN],
  FINANCE: [PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.REPORTS_VIEW],
  TRANSPORT_OFFICER: [
    PERMISSIONS.TRANSPORT_MANAGE,
    PERMISSIONS.TRANSPORT_CROSS_COMPANY,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

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
