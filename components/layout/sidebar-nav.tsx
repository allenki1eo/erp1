"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Warehouse, Package, BookOpen, Users, Truck,
  ShoppingCart, FileText, Beaker, FlaskConical, Wine, Boxes, ClipboardCheck,
  Receipt, Wallet, BarChart3, Settings, Route as RouteIcon, UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavSection = { label: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Sales", href: "/my-sales/dashboard", icon: UserCircle },
    ],
  },
  {
    label: "Master Data",
    items: [
      { label: "Companies", href: "/masters/companies", icon: Building2 },
      { label: "Warehouses", href: "/masters/warehouses", icon: Warehouse },
      { label: "Products", href: "/masters/products", icon: Package },
      { label: "Recipes", href: "/masters/recipes", icon: BookOpen },
      { label: "Customers", href: "/masters/customers", icon: Users },
      { label: "Suppliers", href: "/masters/suppliers", icon: Truck },
    ],
  },
  {
    label: "Procurement",
    items: [
      { label: "Purchase Orders", href: "/procurement/purchase-orders", icon: ShoppingCart },
      { label: "Goods Receipts", href: "/procurement/goods-receipts", icon: FileText },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Stock", href: "/inventory/stock", icon: Boxes },
      { label: "Batches", href: "/inventory/batches", icon: Package },
      { label: "Transfers", href: "/inventory/transfers", icon: Truck },
    ],
  },
  {
    label: "Production",
    items: [
      { label: "Brews (Beer)", href: "/production/brews", icon: Beaker },
      { label: "Distillations", href: "/production/distillations", icon: FlaskConical },
      { label: "Aging / Barrels", href: "/production/aging", icon: Wine },
      { label: "Bottling", href: "/production/bottling", icon: Package },
    ],
  },
  {
    label: "Quality",
    items: [{ label: "QC Checks", href: "/quality", icon: ClipboardCheck }],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/sales/orders", icon: ShoppingCart },
      { label: "Invoices", href: "/sales/invoices", icon: Receipt },
      { label: "Customers", href: "/sales/customers", icon: Users },
      { label: "Routes", href: "/sales/routes", icon: RouteIcon },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Receivables", href: "/finance/receivables", icon: Wallet },
      { label: "Payables", href: "/finance/payables", icon: Wallet },
      { label: "Tax (TRA)", href: "/finance/tax", icon: Receipt },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-4 px-3 py-4">
      {sections.map((section) => (
        <div key={section.label}>
          <h4 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
          </h4>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
