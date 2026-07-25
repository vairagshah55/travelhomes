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
  const { logout } = useAuth();

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

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/admin/dashboard")}>
            <PIcon icon={LayoutDashboard} color="#0891B2" /> <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/management/listing")}>
            <PIcon icon={Layers} color="#7C3AED" /> <span>Management · Listings</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/management/user")}>
            <PIcon icon={Users2} color="#7C3AED" /> <span>Management · Users</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/management/vendor")}>
            <PIcon icon={Users2} color="#7C3AED" /> <span>Management · Vendors</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/management/booking")}>
            <PIcon icon={Layers} color="#7C3AED" /> <span>Management · Bookings</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/payments")}>
            <PIcon icon={CreditCard} color="#2563EB" /> <span>Payments</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/help-desk")}>
            <PIcon icon={LifeBuoy} color="#16A34A" /> <span>Help Desk</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Insights">
          <CommandItem onSelect={() => go("/admin/analytics")}>
            <PIcon icon={BarChart3} color="#DB2777" /> <span>Analytics · Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/analytics/report")}>
            <PIcon icon={BarChart3} color="#DB2777" /> <span>Analytics · Reports</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/marketing")}>
            <PIcon icon={Megaphone} color="#D97706" /> <span>Marketing</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Workspace">
          <CommandItem onSelect={() => go("/admin/cms")}>
            <PIcon icon={FileText} color="#0D9488" /> <span>CMS</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/crm")}>
            <PIcon icon={Bell} color="#0284C7" /> <span>CRM</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/plugins")}>
            <PIcon icon={Box} color="#7C3AED" /> <span>Plugins</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/staff")}>
            <PIcon icon={Users2} color="#059669" /> <span>Staff · All</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/staff/roles")}>
            <PIcon icon={Users2} color="#059669" /> <span>Staff · Roles</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/global-settings")}>
            <PIcon icon={Settings} color="#475569" /> <span>Settings</span>
          </CommandItem>
        </CommandGroup>

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
