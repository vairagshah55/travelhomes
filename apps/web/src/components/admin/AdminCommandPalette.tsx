import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Box,
  CreditCard,
  ExternalLink,
  FileText,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Monitor,
  Moon,
  Settings,
  Sun,
  User,
  Users2,
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

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Color-coded icon chip — a soft, category-tinted tile with the icon in that
 * same hue. Because the palette renders in a portal where the `--tpl-*` icon
 * tokens don't resolve, the svg's color computes to `inherit`, so it picks up
 * this tile's inline color.
 */
function PIcon({ icon: Icon, color }: { icon: LucideIcon; color: string }) {
  return (
    <span
      className="grid place-items-center size-8 rounded-lg shrink-0"
      style={{ color, backgroundColor: `${color}1a` }}
    >
      <Icon />
    </span>
  );
}

/**
 * Global ⌘K command palette for the admin app. Fuzzy search across every
 * admin route plus quick actions (theme, notifications, sign out).
 *
 * Bound to ⌘K / Ctrl+K via a keydown listener mounted while `open` is
 * controlled by the parent so we don't trap focus when the user is typing
 * elsewhere.
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
   * A navigate entry that vanishes when the role can't open the destination —
   * the routes are gated, so offering them here would just bounce the user.
   */
  const navItem = (path: string, icon: typeof LayoutDashboard, color: string, label: string) => {
    const feature = featureForPath(path);
    if (feature && !can(feature)) return null;
    return (
      <CommandItem key={path} onSelect={() => go(path)}>
        <PIcon icon={icon} color={color} /> <span>{label}</span>
      </CommandItem>
    );
  };

  const handleLogout = () => {
    onOpenChange(false);
    logout();
    navigate("/admin/login");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search routes, actions, settings…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {(() => {
          const items = [
            navItem("/admin/dashboard", LayoutDashboard, "#0891B2", "Dashboard"),
            navItem("/admin/management/listing", Layers, "#7C3AED", "Management · Listings"),
            navItem("/admin/management/user", Users2, "#7C3AED", "Management · Users"),
            navItem("/admin/management/vendor", Users2, "#7C3AED", "Management · Vendors"),
            navItem("/admin/management/booking", Layers, "#7C3AED", "Management · Bookings"),
            navItem("/admin/payments", CreditCard, "#2563EB", "Payments"),
            navItem("/admin/help-desk", LifeBuoy, "#16A34A", "Help Desk"),
          ].filter(Boolean);
          return items.length ? <CommandGroup heading="Navigate">{items}</CommandGroup> : null;
        })()}

        <CommandSeparator />

        {(() => {
          const items = [
            navItem("/admin/analytics", BarChart3, "#DB2777", "Analytics · Overview"),
            navItem("/admin/analytics/report", BarChart3, "#DB2777", "Analytics · Reports"),
            navItem("/admin/marketing", Megaphone, "#D97706", "Marketing"),
          ].filter(Boolean);
          return items.length ? <CommandGroup heading="Insights">{items}</CommandGroup> : null;
        })()}

        <CommandSeparator />

        {(() => {
          const items = [
            navItem("/admin/cms", FileText, "#117479", "CMS"),
            navItem("/admin/crm", Bell, "#0284C7", "CRM"),
            navItem("/admin/plugins", Box, "#7C3AED", "Plugins"),
            navItem("/admin/staff", Users2, "#059669", "Staff · All"),
            navItem("/admin/staff/roles", Users2, "#059669", "Staff · Roles"),
            navItem("/admin/global-settings", Settings, "#475569", "Settings"),
          ].filter(Boolean);
          return items.length ? <CommandGroup heading="Workspace">{items}</CommandGroup> : null;
        })()}

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={() => go("/admin/profile")}>
            <PIcon icon={User} color="#475569" /> <span>Profile</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/notifications")}>
            <PIcon icon={Bell} color="#D97706" /> <span>Notifications</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/help")}>
            <PIcon icon={HelpCircle} color="#0284C7" /> <span>Help &amp; support</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              window.open("/", "_blank", "noopener,noreferrer");
            }}
          >
            <PIcon icon={ExternalLink} color="#64748B" /> <span>Open public site</span>
          </CommandItem>
          <CommandItem onSelect={handleLogout}>
            <PIcon icon={LogOut} color="#DC2626" /> <span>Sign out</span>
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
            <PIcon icon={Sun} color="#D97706" /> <span>Light mode</span>
            <CommandShortcut>L</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme("dark");
              onOpenChange(false);
            }}
          >
            <PIcon icon={Moon} color="#4F46E5" /> <span>Dark mode</span>
            <CommandShortcut>D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme("system");
              onOpenChange(false);
            }}
          >
            <PIcon icon={Monitor} color="#64748B" /> <span>System theme</span>
            <CommandShortcut>S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
