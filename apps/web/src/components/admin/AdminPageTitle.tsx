import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import { PAGE_CONTAINER } from "./adminUI";

/**
 * The page header BAND — a white strip that runs edge to edge under the top
 * bar, carrying breadcrumb, title, description, actions and (optionally) the
 * page's tab strip.
 *
 * It is deliberately full-bleed rather than another rounded card. Previously
 * the title floated on the grey page above a card that held everything else,
 * which gave the page no anchor: every element was the same white rounded
 * rectangle and nothing announced "this is the top". A flush band with a
 * hairline base reads as structure — the same move Linear, Stripe and Vercel
 * make — and it lets the tab strip sit ON the band, so switching tabs clearly
 * swaps the content below rather than changing something inside a card.
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
  /** Tab strip rendered flush with the band's bottom edge. */
  tabs?: React.ReactNode;
}

export default function AdminPageTitle({ title, subtitle, actions, tabs }: AdminPageTitleProps) {
  const crumbs = useBreadcrumbs();
  const isNested = crumbs.length > 1;

  return (
    <header className="bg-app-surface border-b border-app-border">
      <div className={`${PAGE_CONTAINER} px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5`}>
        {isNested && (
          <nav
            aria-label="Breadcrumb"
            className="mb-2.5 flex items-center gap-0.5 text-[12px] font-medium text-app-fg-subtle"
          >
            <Link
              to="/admin/dashboard"
              className="grid place-items-center w-5 h-5 rounded hover:text-app-accent transition-colors"
              aria-label="Admin dashboard"
            >
              <LayoutDashboard size={12.5} strokeWidth={2} />
            </Link>
            {crumbs.slice(0, -1).map((crumb) => (
              <React.Fragment key={crumb.href}>
                <ChevronRight size={12} strokeWidth={2.2} className="shrink-0 opacity-45" aria-hidden />
                <Link
                  to={crumb.href}
                  className="px-1 py-0.5 rounded truncate max-w-[180px] hover:text-app-accent transition-colors"
                >
                  {crumb.label}
                </Link>
              </React.Fragment>
            ))}
            <ChevronRight size={12} strokeWidth={2.2} className="shrink-0 opacity-45" aria-hidden />
            <span aria-current="page" className="px-1 font-semibold text-app-fg-muted truncate">
              {crumbs[crumbs.length - 1]?.label}
            </span>
          </nav>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0">
            {/* 30px and tight. The old 22–27px title was barely heavier than a
                card heading, which is why nothing on the page felt like the
                top of it. */}
            <h1 className="text-[26px] sm:text-[30px] font-bold text-app-fg tracking-[-0.028em] leading-[1.1]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-app-fg-muted max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2 shrink-0 sm:pt-1">{actions}</div>
          )}
        </div>

        {/* Tabs hang off the band's bottom edge: -mb-px lets the active
            underline sit exactly on the band's border rather than above it. */}
        {tabs && <div className="mt-4 sm:mt-5 -mb-px">{tabs}</div>}
        {!tabs && <div className="h-4 sm:h-5" />}
      </div>
    </header>
  );
}
