import {
  LayoutDashboard, Building2, Warehouse, Package, BookOpen, Users, Truck,
  ShoppingCart, FileText, Beaker, FlaskConical, Wine, Boxes, ClipboardCheck,
  Receipt, Wallet, BarChart3, Settings, Route as RouteIcon, UserCircle,
  Car, Fuel, Wrench, Cog, FileBadge, Layers, ArrowLeftRight, ScanLine,
  ClipboardList, MapPin, ShieldCheck, type LucideIcon,
} from "lucide-react";

export type NavLeaf = { label: string; href: string; icon?: LucideIcon };
export type NavGroup = {
  label: string;
  icon: LucideIcon;
  items: NavLeaf[];
  defaultOpen?: boolean;
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
      { label: "My Sales", href: "/my-sales/dashboard", icon: UserCircle },
    ],
  },
  {
    label: "Operations",
    entries: [
      {
        label: "Master Data",
        icon: Building2,
        items: [
          { label: "Companies", href: "/masters/companies" },
          { label: "Warehouses", href: "/masters/warehouses" },
          { label: "Products", href: "/masters/products" },
          { label: "Recipes", href: "/masters/recipes" },
          { label: "Customers", href: "/masters/customers" },
          { label: "Suppliers", href: "/masters/suppliers" },
        ],
      },
      {
        label: "Procurement",
        icon: ShoppingCart,
        items: [
          { label: "Requisitions", href: "/procurement/purchase-requisitions" },
          { label: "Purchase Orders", href: "/procurement/purchase-orders" },
          { label: "Goods Receipts", href: "/procurement/goods-receipts" },
          { label: "Supplier Invoices", href: "/procurement/supplier-invoices" },
        ],
      },
      {
        label: "Inventory",
        icon: Boxes,
        items: [
          { label: "Stock Balance", href: "/inventory/stock" },
          { label: "Lots & Batches", href: "/inventory/batches" },
          { label: "Transfers", href: "/inventory/transfers" },
          { label: "Stock Takes", href: "/inventory/stock-takes" },
          { label: "Bin Locations", href: "/inventory/bins" },
        ],
      },
      {
        label: "Production",
        icon: Beaker,
        items: [
          { label: "Brews (Beer)", href: "/production/brews" },
          { label: "Distillations", href: "/production/distillations" },
          { label: "Aging / Barrels", href: "/production/aging" },
          { label: "Bottling", href: "/production/bottling" },
        ],
      },
      {
        label: "Quality",
        icon: ClipboardCheck,
        items: [
          { label: "QC Checks", href: "/quality" },
          { label: "Check Templates", href: "/quality/templates" },
          { label: "Non-Conformances", href: "/quality/non-conformance" },
          { label: "Hold / Release", href: "/quality/batches" },
        ],
      },
      {
        label: "Excise & Regulatory",
        icon: ShieldCheck,
        items: [
          { label: "Dashboard", href: "/excise" },
          { label: "Excise Rates", href: "/excise/rates" },
          { label: "Tax Stamps", href: "/excise/stamps" },
          { label: "Bonded Warehouse", href: "/excise/bonded" },
          { label: "Declarations", href: "/excise/declarations" },
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
        items: [
          { label: "Orders", href: "/sales/orders" },
          { label: "Invoices", href: "/sales/invoices" },
          { label: "Customers", href: "/sales/customers" },
          { label: "Routes", href: "/sales/routes" },
        ],
      },
      {
        label: "Finance",
        icon: Wallet,
        items: [
          { label: "Receivables", href: "/finance/receivables" },
          { label: "Payables", href: "/finance/payables" },
          { label: "Tax (TRA)", href: "/finance/tax" },
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
        items: [
          { label: "Vehicles", href: "/transport/vehicles" },
          { label: "Drivers", href: "/transport/drivers" },
          { label: "Fuel Logs", href: "/transport/fuel" },
          { label: "Fuel Stations", href: "/transport/fuel-stations" },
          { label: "Maintenance", href: "/transport/maintenance" },
          { label: "Spares", href: "/transport/spares" },
          { label: "Documents", href: "/transport/documents" },
          { label: "Trips", href: "/transport/trips" },
        ],
      },
    ],
  },
  {
    label: "System",
    entries: [
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const ICONS = {
  LayoutDashboard, Building2, Warehouse, Package, BookOpen, Users, Truck,
  ShoppingCart, FileText, Beaker, FlaskConical, Wine, Boxes, ClipboardCheck,
  Receipt, Wallet, BarChart3, Settings, Route: RouteIcon, UserCircle,
  Car, Fuel, Wrench, Cog, FileBadge, Layers, ArrowLeftRight, ScanLine,
  ClipboardList, MapPin,
};
