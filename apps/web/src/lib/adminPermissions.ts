/**
 * Route → required feature map for the admin SPA.
 *
 * Single source of truth shared by AdminSidebar (what to show) and
 * AdminProtectedRoute (what to let through), so the nav can't drift from the
 * guard. The slugs must match `AdminRole.AVAILABLE_FEATURES` on the server and
 * the mounts in `Server/api/index.js` — the server is the real enforcement
 * point; this only stops the UI from offering a page the API would 403.
 */

/** Feature slugs, mirroring AdminRole.AVAILABLE_FEATURES. */
export const ADMIN_FEATURES = {
  dashboard: "view_dashboard",
  management: "access_management",
  users: "manage_users",
  vendors: "manage_vendors",
  inventory: "manage_inventory",
  bookings: "access_bookings",
  payments: "manage_payments",
  helpdesk: "support_tickets",
  analytics: "view_analytics",
  cms: "manage_cms",
  marketing: "manage_marketing",
  plugins: "manage_plugins",
  staff: "manage_staff",
  roles: "manage_roles",
  crm: "manage_crm",
  settings: "manage_settings",
} as const;

/**
 * Longest-prefix wins, so "/admin/management/user" resolves to manage_users
 * rather than access_management. Routes absent from this map need no feature
 * beyond being a signed-in admin (own profile, notifications, help).
 */
const ROUTE_FEATURES: Array<{ prefix: string; feature: string | string[] }> = [
  { prefix: "/admin/dashboard", feature: ADMIN_FEATURES.dashboard },

  { prefix: "/admin/management/listing", feature: ADMIN_FEATURES.inventory },
  { prefix: "/admin/management/user", feature: ADMIN_FEATURES.users },
  { prefix: "/admin/management/vendor", feature: ADMIN_FEATURES.vendors },
  { prefix: "/admin/management/booking", feature: ADMIN_FEATURES.bookings },
  // The hub itself is a static card grid, so holding ANY of its areas is enough
  // to open it — otherwise a staff member granted only "Users" would have no
  // route into the page that links there.
  {
    prefix: "/admin/management",
    feature: [
      ADMIN_FEATURES.management,
      ADMIN_FEATURES.inventory,
      ADMIN_FEATURES.users,
      ADMIN_FEATURES.vendors,
      ADMIN_FEATURES.bookings,
    ],
  },

  { prefix: "/admin/payments", feature: ADMIN_FEATURES.payments },
  { prefix: "/admin/help-desk", feature: ADMIN_FEATURES.helpdesk },
  { prefix: "/admin/analytics", feature: ADMIN_FEATURES.analytics },
  { prefix: "/admin/marketing", feature: ADMIN_FEATURES.marketing },
  { prefix: "/admin/cms", feature: ADMIN_FEATURES.cms },
  { prefix: "/admin/crm", feature: ADMIN_FEATURES.crm },
  { prefix: "/admin/plugins", feature: ADMIN_FEATURES.plugins },
  { prefix: "/admin/global-settings", feature: ADMIN_FEATURES.settings },

  { prefix: "/admin/staff/roles", feature: ADMIN_FEATURES.roles },
  { prefix: "/admin/staff/permissions", feature: ADMIN_FEATURES.roles },
  { prefix: "/admin/staff", feature: ADMIN_FEATURES.staff },
];

/** The feature a path requires, or null when any signed-in admin may open it. */
export function featureForPath(pathname: string): string | string[] | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  let best: { prefix: string; feature: string | string[] } | null = null;
  for (const entry of ROUTE_FEATURES) {
    if (path === entry.prefix || path.startsWith(`${entry.prefix}/`)) {
      if (!best || entry.prefix.length > best.prefix.length) best = entry;
    }
  }
  return best ? best.feature : null;
}

/**
 * Where to send an admin who has no rights to the page they asked for. Falls
 * back through the areas most staff are likely to hold before giving up on the
 * dashboard, so a restricted account still lands somewhere usable.
 */
export const LANDING_CANDIDATES: Array<{ path: string; feature: string | null }> = [
  { path: "/admin/dashboard", feature: ADMIN_FEATURES.dashboard },
  { path: "/admin/management", feature: ADMIN_FEATURES.management },
  { path: "/admin/management/listing", feature: ADMIN_FEATURES.inventory },
  { path: "/admin/management/booking", feature: ADMIN_FEATURES.bookings },
  { path: "/admin/payments", feature: ADMIN_FEATURES.payments },
  { path: "/admin/help-desk", feature: ADMIN_FEATURES.helpdesk },
  { path: "/admin/cms", feature: ADMIN_FEATURES.cms },
  { path: "/admin/analytics", feature: ADMIN_FEATURES.analytics },
  // Always reachable — no feature required.
  { path: "/admin/profile", feature: null },
];
