import {
  LayoutDashboard, Building2, Warehouse, Package, BookOpen, Users, Truck,
  ShoppingCart, FileText, Beaker, FlaskConical, Wine, Boxes, ClipboardCheck,
  Receipt, Wallet, BarChart3, Settings, Route as RouteIcon, UserCircle,
  Car, Fuel, Wrench, Cog, FileBadge, Layers, ArrowLeftRight, ScanLine,
  ClipboardList, MapPin, ShieldCheck, type LucideIcon,
} from "lucide-react";
import { PERMISSIONS, type Permission } from "@/lib/permissions";

export type NavLeaf = {
  label: string;
  href: string;
  icon?: LucideIcon;
  perm?: Permission | Permission[];
};
export type NavGroup = {
  label: string;
  icon: LucideIcon;
  items: NavLeaf[];
  defaultOpen?: boolean;
  perm?: Permission | Permission[];
};
export type NavSection = {
  label: string;
  entries: (NavLeaf | NavGroup)[];
};

export const isGroup = (e: NavLeaf | NavGroup): e is NavGroup =>
  (e as NavGroup).items !== undefined;

export const NAV: NavSection[] = [
  {
    label: "Overview",
    entries: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Sales", href: "/my-sales/dashboard", icon: UserCircle, perm: PERMISSIONS.SALES_OWN },
    ],
  },
  {
    label: "Operations",
    entries: [
      {
        label: "Master Data",
        icon: Building2,
        items: [
          { label: "Companies", href: "/masters/companies" }, // permission-aware page; everyone may view their own
          { label: "Warehouses", href: "/masters/warehouses", perm: [PERMISSIONS.INVENTORY_MANAGE, PERMISSIONS.PRODUCT_MANAGE] },
          { label: "Products", href: "/masters/products", perm: PERMISSIONS.PRODUCT_MANAGE },
          { label: "Recipes", href: "/masters/recipes", perm: PERMISSIONS.RECIPE_MANAGE },
          { label: "Customers", href: "/masters/customers", perm: [PERMISSIONS.SALES_MANAGE, PERMISSIONS.SALES_OWN] },
          { label: "Suppliers", href: "/masters/suppliers", perm: [PERMISSIONS.PROCUREMENT_MANAGE, PERMISSIONS.PROCUREMENT_WRITE] },
        ],
      },
      {
        label: "Procurement",
        icon: ShoppingCart,
        perm: [PERMISSIONS.PROCUREMENT_WRITE, PERMISSIONS.PROCUREMENT_APPROVE, PERMISSIONS.PROCUREMENT_MANAGE],
        items: [
          { label: "Requisitions", href: "/procurement/purchase-requisitions", perm: [PERMISSIONS.PROCUREMENT_WRITE, PERMISSIONS.PROCUREMENT_MANAGE] },
          { label: "Purchase Orders", href: "/procurement/purchase-orders", perm: [PERMISSIONS.PROCUREMENT_WRITE, PERMISSIONS.PROCUREMENT_APPROVE, PERMISSIONS.PROCUREMENT_MANAGE] },
          { label: "Goods Receipts", href: "/procurement/goods-receipts", perm: [PERMISSIONS.PROCUREMENT_WRITE, PERMISSIONS.PROCUREMENT_MANAGE, PERMISSIONS.INVENTORY_WRITE] },
          { label: "Supplier Invoices", href: "/procurement/supplier-invoices", perm: [PERMISSIONS.PROCUREMENT_MANAGE, PERMISSIONS.FINANCE_WRITE, PERMISSIONS.FINANCE_MANAGE] },
        ],
      },
      {
        label: "Inventory",
        icon: Boxes,
        perm: [PERMISSIONS.INVENTORY_WRITE, PERMISSIONS.INVENTORY_MANAGE],
        items: [
          { label: "Stock Balance", href: "/inventory/stock", perm: [PERMISSIONS.INVENTORY_WRITE, PERMISSIONS.INVENTORY_MANAGE] },
          { label: "Lots & Batches", href: "/inventory/batches", perm: [PERMISSIONS.INVENTORY_WRITE, PERMISSIONS.INVENTORY_MANAGE] },
          { label: "Transfers", href: "/inventory/transfers", perm: [PERMISSIONS.INVENTORY_WRITE, PERMISSIONS.INVENTORY_MANAGE] },
          { label: "Stock Takes", href: "/inventory/stock-takes", perm: [PERMISSIONS.INVENTORY_MANAGE] },
          { label: "Bin Locations", href: "/inventory/bins", perm: [PERMISSIONS.INVENTORY_MANAGE] },
        ],
      },
      {
        label: "Production",
        icon: Beaker,
        perm: PERMISSIONS.PRODUCTION_MANAGE,
        items: [
          { label: "Brews (Beer)", href: "/production/brews", perm: PERMISSIONS.PRODUCTION_MANAGE },
          { label: "Distillations", href: "/production/distillations", perm: PERMISSIONS.PRODUCTION_MANAGE },
          { label: "Aging / Barrels", href: "/production/aging", perm: PERMISSIONS.PRODUCTION_MANAGE },
          { label: "Bottling", href: "/production/bottling", perm: PERMISSIONS.PRODUCTION_MANAGE },
        ],
      },
      {
        label: "Quality",
        icon: ClipboardCheck,
        perm: PERMISSIONS.QUALITY_MANAGE,
        items: [
          { label: "QC Checks", href: "/quality", perm: PERMISSIONS.QUALITY_MANAGE },
          { label: "Check Templates", href: "/quality/templates", perm: PERMISSIONS.QUALITY_MANAGE },
          { label: "Non-Conformances", href: "/quality/non-conformance", perm: PERMISSIONS.QUALITY_MANAGE },
          { label: "Hold / Release", href: "/quality/batches", perm: PERMISSIONS.QUALITY_MANAGE },
        ],
      },
      {
        label: "Excise & Regulatory",
        icon: ShieldCheck,
        perm: [PERMISSIONS.EXCISE_MANAGE, PERMISSIONS.EXCISE_DECLARE, PERMISSIONS.TAX_STAMP_MANAGE],
        items: [
          { label: "Dashboard", href: "/excise", perm: [PERMISSIONS.EXCISE_MANAGE, PERMISSIONS.EXCISE_DECLARE] },
          { label: "Excise Rates", href: "/excise/rates", perm: PERMISSIONS.EXCISE_MANAGE },
          { label: "Tax Stamps", href: "/excise/stamps", perm: [PERMISSIONS.TAX_STAMP_MANAGE, PERMISSIONS.EXCISE_MANAGE] },
          { label: "Bonded Warehouse", href: "/excise/bonded", perm: [PERMISSIONS.EXCISE_MANAGE, PERMISSIONS.INVENTORY_MANAGE] },
          { label: "Declarations", href: "/excise/declarations", perm: [PERMISSIONS.EXCISE_DECLARE, PERMISSIONS.EXCISE_MANAGE] },
        ],
      },
    ],
  },
  {
    label: "Commercial",
    entries: [
      {
        label: "Sales",
        icon: ShoppingCart,
        perm: [PERMISSIONS.SALES_MANAGE, PERMISSIONS.SALES_OWN],
        items: [
          { label: "Orders", href: "/sales/orders", perm: [PERMISSIONS.SALES_MANAGE, PERMISSIONS.SALES_OWN] },
          { label: "Invoices", href: "/sales/invoices", perm: [PERMISSIONS.SALES_MANAGE, PERMISSIONS.FINANCE_WRITE] },
          { label: "Customers", href: "/sales/customers", perm: [PERMISSIONS.SALES_MANAGE, PERMISSIONS.SALES_OWN] },
          { label: "Routes", href: "/sales/routes", perm: [PERMISSIONS.SALES_MANAGE, PERMISSIONS.SALES_OWN] },
        ],
      },
      {
        label: "Finance",
        icon: Wallet,
        perm: [PERMISSIONS.FINANCE_WRITE, PERMISSIONS.FINANCE_MANAGE],
        items: [
          { label: "Receivables", href: "/finance/receivables", perm: [PERMISSIONS.FINANCE_WRITE, PERMISSIONS.FINANCE_MANAGE] },
          { label: "Payables", href: "/finance/payables", perm: [PERMISSIONS.FINANCE_WRITE, PERMISSIONS.FINANCE_MANAGE] },
          { label: "Tax (TRA)", href: "/finance/tax", perm: [PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.EXCISE_MANAGE] },
        ],
      },
    ],
  },
  {
    label: "Fleet",
    entries: [
      {
        label: "Transport",
        icon: Truck,
        perm: [PERMISSIONS.TRANSPORT_MANAGE, PERMISSIONS.TRANSPORT_CROSS_COMPANY],
        items: [
          { label: "Vehicles", href: "/transport/vehicles", perm: PERMISSIONS.TRANSPORT_MANAGE },
          { label: "Drivers", href: "/transport/drivers", perm: PERMISSIONS.TRANSPORT_MANAGE },
          { label: "Fuel Logs", href: "/transport/fuel", perm: PERMISSIONS.TRANSPORT_MANAGE },
          { label: "Fuel Stations", href: "/transport/fuel-stations", perm: PERMISSIONS.TRANSPORT_MANAGE },
          { label: "Maintenance", href: "/transport/maintenance", perm: PERMISSIONS.TRANSPORT_MANAGE },
          { label: "Spares", href: "/transport/spares", perm: PERMISSIONS.TRANSPORT_MANAGE },
          { label: "Documents", href: "/transport/documents", perm: PERMISSIONS.TRANSPORT_MANAGE },
          { label: "Trips", href: "/transport/trips", perm: PERMISSIONS.TRANSPORT_MANAGE },
        ],
      },
    ],
  },
  {
    label: "System",
    entries: [
      { label: "Reports", href: "/reports", icon: BarChart3, perm: PERMISSIONS.REPORTS_VIEW },
      {
        label: "Administration",
        icon: ShieldCheck,
        perm: PERMISSIONS.USER_MANAGE,
        items: [
          { label: "Users", href: "/admin/users", perm: PERMISSIONS.USER_MANAGE },
          { label: "Roles & permissions", href: "/admin/roles", perm: PERMISSIONS.USER_MANAGE },
        ],
      },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

/**
 * Filter the nav tree by the user's current permissions.
 * Entries with no `perm` are always visible. Entries with `perm` are shown if
 * the user has at least one of the listed permissions. Groups with all items
 * filtered out are dropped, as are sections left with no entries.
 */
export function filterNavByPermissions(
  nav: NavSection[],
  userPerms: string[],
): NavSection[] {
  const perms = new Set(userPerms);
  const allows = (p: Permission | Permission[] | undefined): boolean => {
    if (!p) return true;
    const arr = Array.isArray(p) ? p : [p];
    return arr.some((x) => perms.has(x));
  };

  return nav
    .map((section) => {
      const entries: (NavLeaf | NavGroup)[] = [];
      for (const entry of section.entries) {
        if (isGroup(entry)) {
          if (!allows(entry.perm)) continue;
          const items = entry.items.filter((i) => allows(i.perm));
          if (items.length > 0) entries.push({ ...entry, items });
        } else if (allows(entry.perm)) {
          entries.push(entry);
        }
      }
      return { ...section, entries };
    })
    .filter((s) => s.entries.length > 0);
}

export const ICONS = {
  LayoutDashboard, Building2, Warehouse, Package, BookOpen, Users, Truck,
  ShoppingCart, FileText, Beaker, FlaskConical, Wine, Boxes, ClipboardCheck,
  Receipt, Wallet, BarChart3, Settings, Route: RouteIcon, UserCircle,
  Car, Fuel, Wrench, Cog, FileBadge, Layers, ArrowLeftRight, ScanLine,
  ClipboardList, MapPin,
};
