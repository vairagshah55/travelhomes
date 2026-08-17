import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, CalendarDays, Plus, MessageSquare, Package } from "lucide-react";
import { BRAND_VARS } from "@/components/shared";
import { notificationsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Phone tab bar for the vendor console.
 *
 * Rewritten from five hand-inlined 20px SVG paths to lucide, which is the icon
 * system the rest of the console uses — the exported paths came from a
 * different set at a different optical weight, so the tab bar was visibly not
 * from the same product as the rail three pixels above it. They also carried
 * duplicate `clipPath` ids (`clip0_0_15209` …), which collide in the document
 * once more than one is mounted.
 *
 * Two routing bugs went with it: "Chat" pointed at `/chat` (the traveller-side
 * conversation view, which a vendor has no business landing on) instead of
 * `/vendor-chat`, and "Calendar" was labelled for the widget rather than for
 * what it opens.
 *
 * Five destinations, one of them the primary write action. `Add` is centred and
 * filled because on a phone the vendor is far more often adding a listing than
 * reading analytics, and a tab bar's centre slot is the easiest target to hit
 * one-handed.
 */

const TABS = [
  { label: "Home", path: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Bookings", path: "/bookings", icon: CalendarDays },
  { label: "Add", path: "/offering/add", icon: Plus, primary: true },
  { label: "Offerings", path: "/offering", icon: Package, exact: true },
  { label: "Messages", path: "/vendor-chat", icon: MessageSquare, badge: true },
] as const;

const MobileVendorNav = () => {
  const location = useLocation();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread", "vendor"],
    queryFn: async () => {
      const res = await notificationsApi.list(true, 1, "vendor");
      return res.success ? res.totalUnread : 0;
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: false,
  });

  /* `/offering` is a prefix of `/offering/add`, so a plain `startsWith` lights
     up both tabs at once. Exact-match the tabs whose path is another's prefix. */
  const isActive = (tab: (typeof TABS)[number]) => {
    if (tab.path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    if ("exact" in tab && tab.exact) return location.pathname === tab.path;
    return location.pathname === tab.path || location.pathname.startsWith(tab.path + "/");
  };

  return (
    <nav
      aria-label="Vendor navigation"
      style={BRAND_VARS}
      /* pb reserves the iOS home-indicator strip. Without it the last 34px of
         the bar sits under the system gesture area and the labels are
         unreadable on every notched phone. */
      className="bg-card border-t border-border lg:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const primary = "primary" in tab && tab.primary;
          const showBadge = "badge" in tab && tab.badge && unreadCount > 0;

          return (
            <li key={tab.path} className="flex-1">
              <Link
                to={tab.path}
                aria-current={active ? "page" : undefined}
                aria-label={
                  showBadge ? `${tab.label}, ${unreadCount} unread` : tab.label
                }
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 h-[58px] px-1",
                  "outline-none transition-colors duration-150",
                  "focus-visible:bg-muted",
                  active ? "text-brand" : "text-muted-foreground",
                )}
              >
                {/* The active marker is a 2px cap on the top edge, aligned with
                    the bar's own hairline — the same vocabulary as the tab strip
                    and the table's selected-row edge. */}
                {active && !primary && (
                  <span
                    aria-hidden
                    className="absolute top-0 inset-x-5 h-[2px] rounded-full bg-brand"
                  />
                )}

                {primary ? (
                  <span className="grid place-items-center w-9 h-9 -mt-0.5 rounded-full bg-brand text-brand-fg shadow-[0_1px_2px_hsl(var(--brand)/0.3)]">
                    <tab.icon size={19} strokeWidth={2.6} aria-hidden />
                  </span>
                ) : (
                  <span className="relative">
                    <tab.icon size={19} strokeWidth={active ? 2.3 : 1.9} aria-hidden />
                    {showBadge && (
                      <span className="absolute -top-0.5 -right-1 grid place-items-center min-w-[15px] h-[15px] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold leading-none tabular-nums ring-2 ring-card">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </span>
                )}

                <span
                  className={cn(
                    "text-[10.5px] leading-none tracking-tight",
                    active ? "font-bold" : "font-medium",
                    primary && "sr-only",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileVendorNav;
