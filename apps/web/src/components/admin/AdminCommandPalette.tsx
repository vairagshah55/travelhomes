import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ExternalLink,
  HelpCircle,
  LogOut,
  Monitor,
  Moon,
  Store,
  Sun,
  User,
  type LucideIcon,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useTheme } from "@/components/admin/ThemeProvider";
import { useAuth } from "@/contexts/AdminAuthContext";
import { featureForPath } from "@/lib/adminPermissions";
import { PORTAL_VARS } from "@/components/admin/adminUI";
import { ADMIN_ROUTES, type AdminRoute } from "@/components/admin/adminNav";

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Palette row glyph. Monochrome, matching the rail: this list is a ranked set
 * of search results, and a column of nine different hues fights the ranking by
 * making some rows louder than others for reasons unrelated to the query.
 */
function PIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid place-items-center size-7 rounded-md shrink-0 bg-app-surface-2 text-app-fg-muted">
      <Icon size={15} strokeWidth={1.9} />
    </span>
  );
}

/**
 * Global ⌘K command palette for the admin app. Fuzzy search across every admin
 * route plus quick actions (theme, notifications, sign out).
 *
 * Routes come from `adminNav.ts` — the same definition the sidebar renders — so
 * a new page appears in both at once. This file used to keep its own hand-typed
 * list and had already fallen out of sync with the rail.
 *
 * Mounted once by AdminLayout; the ⌘K listener below is the only one in the
 * shell.
 */
export default function AdminCommandPalette({ open, onOpenChange }: AdminCommandPaletteProps) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { logout, can } = useAuth();

  // Global ⌘K / Ctrl+K listener — toggles the palette.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  /**
   * Destinations the current role can actually open, kept in nav order and
   * bucketed by section. Offering a gated route here would only bounce the
   * user back where they came from.
   */
  const groups = useMemo(() => {
    const buckets = new Map<string, AdminRoute[]>();
    for (const route of ADMIN_ROUTES) {
      const feature = featureForPath(route.path);
      if (feature && !can(feature)) continue;
      const list = buckets.get(route.group);
      if (list) list.push(route);
      else buckets.set(route.group, [route]);
    }
    return Array.from(buckets, ([heading, routes]) => ({ heading, routes }));
  }, [can]);

  const handleLogout = () => {
    onOpenChange(false);
    logout();
    navigate("/admin/login");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} contentStyle={PORTAL_VARS}>
      <CommandInput placeholder="Search pages, actions and settings…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {groups.map(({ heading, routes }, i) => (
          <React.Fragment key={heading}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={heading}>
              {routes.map((route) => (
                <CommandItem
                  key={route.path}
                  value={`${heading} ${route.label}`}
                  onSelect={() => go(route.path)}
                >
                  <PIcon icon={route.icon} />
                  <span>{route.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={() => go("/admin/profile")}>
            <PIcon icon={User} /> <span>Profile</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/notifications")}>
            <PIcon icon={Bell} /> <span>Notifications</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/help")}>
            <PIcon icon={HelpCircle} /> <span>Help &amp; support</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard")}>
            <PIcon icon={Store} /> <span>Vendor console</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              window.open("/", "_blank", "noopener,noreferrer");
            }}
          >
            <PIcon icon={ExternalLink} /> <span>Open public site</span>
          </CommandItem>
          <CommandItem onSelect={handleLogout}>
            <PIcon icon={LogOut} /> <span>Sign out</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem
            onSelect={() => {
              setTheme("light");
              onOpenChange(false);
            }}
          >
            <PIcon icon={Sun} /> <span>Light mode</span>
            <CommandShortcut>L</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme("dark");
              onOpenChange(false);
            }}
          >
            <PIcon icon={Moon} /> <span>Dark mode</span>
            <CommandShortcut>D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme("system");
              onOpenChange(false);
            }}
          >
            <PIcon icon={Monitor} /> <span>System theme</span>
            <CommandShortcut>S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
