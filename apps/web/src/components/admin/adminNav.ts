import { useLocation } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Blocks,
  Building2,
  CalendarCheck,
  CreditCard,
  FileBarChart,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MessagesSquare,
  Settings,
  Store,
  UserCog,
  Users2,
  type LucideIcon,
} from "lucide-react";

/**
 * The admin information architecture — ONE definition, consumed by the sidebar,
 * the command palette and the breadcrumb trail.
 *
 * All three previously kept their own copy and had drifted: the rail nested
 * Listings/Users/Vendors/Bookings under a single "Management" row, the palette
 * listed them flat under "Navigate", and the breadcrumb had a third label map.
 * Renaming a section meant editing three files and usually missing one.
 *
 * The structure is deliberately FLAT at the destination level. Hiding five of
 * the highest-traffic pages behind a hub row cost two clicks and a page load to
 * reach the thing an operator opens twenty times a day, and it made the rail
 * look sparse enough to read as a brochure menu rather than a workspace.
 */

export interface AdminNavChild {
  label: string;
  path: string;
}

export interface AdminNavItem {
  icon: LucideIcon;
  label: string;
  path?: string;
  children?: AdminNavChild[];
}

export interface AdminNavGroup {
  /** Stable key for persisting collapsed state. */
  id: string;
  /** Section caption. Omitted for the first group, which needs no label. */
  label?: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    id: "overview",
    items: [{ icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" }],
  },
  {
    id: "management",
    label: "Management",
    items: [
      { icon: Building2, label: "Listings", path: "/admin/management/listing" },
      { icon: Users2, label: "Users", path: "/admin/management/user" },
      { icon: Store, label: "Vendors", path: "/admin/management/vendor" },
      { icon: CalendarCheck, label: "Bookings", path: "/admin/management/booking" },
      { icon: CreditCard, label: "Payments", path: "/admin/payments" },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { icon: FileText, label: "CMS", path: "/admin/cms" },
      { icon: Megaphone, label: "Marketing", path: "/admin/marketing" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { icon: LifeBuoy, label: "Help Desk", path: "/admin/help-desk" },
      { icon: MessagesSquare, label: "CRM", path: "/admin/crm" },
      { icon: Bell, label: "Notifications", path: "/admin/notifications" },
      {
        icon: UserCog,
        label: "Staff",
        children: [
          { label: "All staff", path: "/admin/staff" },
          { label: "Roles", path: "/admin/staff/roles" },
          { label: "Permissions", path: "/admin/staff/permissions" },
        ],
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
      { icon: FileBarChart, label: "Reports", path: "/admin/analytics/report" },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { icon: Settings, label: "Settings", path: "/admin/global-settings" },
      { icon: Blocks, label: "Plugins", path: "/admin/plugins" },
    ],
  },
];

/** Flattened destinations — every leaf a user can actually navigate to. */
export interface AdminRoute {
  path: string;
  /** "Bookings", or "Staff · Roles" for a child route. */
  label: string;
  icon: LucideIcon;
  /** Section caption, for grouping in the command palette. */
  group: string;
}

export const ADMIN_ROUTES: AdminRoute[] = ADMIN_NAV.flatMap((group) =>
  group.items.flatMap((item) => {
    const groupLabel = group.label ?? "Overview";
    if (item.children?.length) {
      return item.children.map((child) => ({
        path: child.path,
        label: `${item.label} · ${child.label}`,
        icon: item.icon,
        group: groupLabel,
      }));
    }
    return item.path
      ? [{ path: item.path, label: item.label, icon: item.icon, group: groupLabel }]
      : [];
  }),
);

/** Routes that exist but are reached from the account menu rather than the rail. */
export const ADMIN_ACCOUNT_ROUTES: AdminRoute[] = [
  { path: "/admin/profile", label: "Profile", icon: UserCog, group: "Account" },
  { path: "/admin/help", label: "Help & support", icon: LifeBuoy, group: "Account" },
];

const ALL_NAV_PATHS = ADMIN_ROUTES.map((r) => r.path);

/**
 * Resolves the single best-matching nav path for the current URL: the LONGEST
 * entry the pathname falls under. Without the longest-wins rule a parent path
 * (/admin/analytics) stays active on its child route (/admin/analytics/report)
 * and both rows light up.
 */
export function useActiveNavPath() {
  const { pathname } = useLocation();
  const best = ALL_NAV_PATHS.filter(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  ).sort((a, b) => b.length - a.length)[0];
  return (path?: string) => !!path && path === best;
}

/** Where a row goes when clicked — its own path, or its first child's. */
export const targetOf = (item: AdminNavItem) => item.path ?? item.children?.[0]?.path;

/* ── Breadcrumbs ──────────────────────────────────────────────────────────
   Labels come from ADMIN_ROUTES where a segment path resolves to a real
   destination, and fall back to a small map for intermediate segments that
   are not themselves routes (e.g. /admin/management). */

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  management: "Management",
  listing: "Listings",
  user: "Users",
  vendor: "Vendors",
  booking: "Bookings",
  payments: "Payments",
  "help-desk": "Help Desk",
  analytics: "Analytics",
  report: "Reports",
  marketing: "Marketing",
  cms: "CMS",
  crm: "CRM",
  plugins: "Plugins",
  staff: "Staff",
  roles: "Roles",
  permissions: "Permissions",
  "global-settings": "Settings",
  notifications: "Notifications",
  dashboard: "Dashboard",
  profile: "Profile",
  help: "Help",
};

const isId = (s: string) =>
  /^[a-f0-9]{24}$/i.test(s) || /^[0-9a-fA-F-]{36}$/.test(s) || /^\d+$/.test(s);

export interface Crumb {
  label: string;
  href: string;
  isLast: boolean;
}

export function useAdminBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  const trail = segments[0] === "admin" ? segments.slice(1) : segments;

  return trail.map((seg, i) => {
    const href = "/admin/" + trail.slice(0, i + 1).join("/");
    return {
      label: isId(seg) ? "Details" : (SEGMENT_LABELS[seg] ?? seg),
      href,
      isLast: i === trail.length - 1,
    };
  });
}
