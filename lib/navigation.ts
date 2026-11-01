import {
  BarChart3,
  Building2,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  type LucideIcon,
  PackageCheck,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
  /** Only shown to (and accessible by) the Super Admin. */
  superAdminOnly?: boolean;
};

export const DASHBOARD: NavItem = {
  title: "Dashboard",
  href: "/",
  icon: LayoutDashboard,
  description: "Overview of procurement master data and modules.",
};

export const MASTER_DATA: NavItem[] = [
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    description: "Projects that procurement activity is recorded against.",
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: Truck,
    description: "Supplier details, registration and contact information.",
  },
  {
    title: "Departments",
    href: "/departments",
    icon: Building2,
    description: "Organisational departments that raise procurement requests.",
  },
  {
    title: "Categories",
    href: "/categories",
    icon: Tags,
    description: "Categories used to classify procured items and services.",
  },
];

export const WORKFLOWS: NavItem[] = [
  {
    title: "Material Request",
    href: "/material-requests",
    icon: ClipboardList,
    description: "Material requests raised for projects and departments.",
  },
  {
    title: "Purchase Order",
    href: "/purchase-orders",
    icon: ShoppingCart,
    description: "Purchase orders issued to suppliers.",
  },
  {
    title: "Payment Request",
    href: "/payment-requests",
    icon: Wallet,
    description: "Payment requests for supplier invoices.",
  },
  {
    title: "GRN",
    href: "/grn",
    icon: PackageCheck,
    description: "Goods Received Notes for delivered materials.",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Procurement reports.",
  },
];

export const ADMINISTRATION: NavItem[] = [
  {
    title: "Users",
    href: "/users",
    icon: Users,
    description: "Manage user accounts and access.",
  },
  {
    title: "Roles",
    href: "/roles",
    icon: ShieldCheck,
    description: "Manage roles and permissions.",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "System-wide configuration.",
  },
];

export const NAV_GROUPS: NavGroup[] = [
  { label: "Overview", items: [DASHBOARD] },
  { label: "Master Data", items: MASTER_DATA },
  { label: "Procurement", items: WORKFLOWS },
  { label: "Administration", items: ADMINISTRATION, superAdminOnly: true },
];

/** Finds the nav group and item that a pathname belongs to. */
export function findNavEntry(pathname: string) {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (isActivePath(pathname, item.href)) {
        return { group, item };
      }
    }
  }
  return null;
}

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getNavItem(href: string) {
  const entry = findNavEntry(href);
  if (!entry) throw new Error(`No navigation entry for ${href}`);
  return entry.item;
}
