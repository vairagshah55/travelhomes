import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

/**
 * Page H1 rendered at the top of the admin CONTENT area, on the white/light
 * surface. The top bar (AdminHeader) stays slim — search + account only — so
 * the page's main heading now lives with its own content.
 */

const ROUTE_LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
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
  profile: "Profile",
  help: "Help",
};

const isId = (s: string) =>
  /^[a-f0-9]{24}$/i.test(s) || /^[0-9a-fA-F-]{36}$/.test(s) || /^\d+$/.test(s);

function useBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const trail = segments[0] === "admin" ? segments.slice(1) : segments;
  return trail.map((seg, i) => ({
    label: isId(seg) ? "Details" : (ROUTE_LABELS[seg] ?? seg),
    href: "/admin/" + trail.slice(0, i + 1).join("/"),
    isLast: i === trail.length - 1,
  }));
}

interface AdminPageTitleProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AdminPageTitle({ title, subtitle, actions }: AdminPageTitleProps) {
  const crumbs = useBreadcrumbs();
  const isNested = crumbs.length > 1;

  return (
    <div className="mb-5 md:mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {isNested && (
          <nav
            aria-label="Breadcrumb"
            className="mb-1.5 hidden md:flex items-center text-[12px] font-medium text-gray-400"
          >
            <Link
              to="/admin/dashboard"
              className="flex items-center justify-center w-5 h-5 rounded hover:text-[#0d9488] transition-colors"
              aria-label="Admin dashboard"
            >
              <LayoutDashboard size={13} strokeWidth={1.75} />
            </Link>
            {crumbs.slice(0, -1).map((crumb) => (
              <React.Fragment key={crumb.href}>
                <span className="mx-1 select-none">/</span>
                <Link
                  to={crumb.href}
                  className="px-1 rounded hover:text-[#0d9488] transition-colors truncate max-w-[160px]"
                >
                  {crumb.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>
        )}

        <h1 className="text-[24px] md:text-[28px] font-bold text-gray-900 tracking-tight leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[14px] text-gray-500 leading-tight truncate">{subtitle}</p>
        )}
      </div>

      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
}
