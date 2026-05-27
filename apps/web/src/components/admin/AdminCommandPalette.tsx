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
            <LayoutDashboard /> <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/management/listing")}>
            <Layers /> <span>Management · Listings</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/management/user")}>
            <Users2 /> <span>Management · Users</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/management/vendor")}>
            <Users2 /> <span>Management · Vendors</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/management/booking")}>
            <Layers /> <span>Management · Bookings</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/payments")}>
            <CreditCard /> <span>Payments</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/help-desk")}>
            <LifeBuoy /> <span>Help Desk</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Insights">
          <CommandItem onSelect={() => go("/admin/analytics")}>
            <BarChart3 /> <span>Analytics · Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/analytics/report")}>
            <BarChart3 /> <span>Analytics · Reports</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/marketing")}>
            <Megaphone /> <span>Marketing</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Workspace">
          <CommandItem onSelect={() => go("/admin/cms")}>
            <FileText /> <span>CMS</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/crm")}>
            <Bell /> <span>CRM</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/plugins")}>
            <Box /> <span>Plugins</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/staff")}>
            <Users2 /> <span>Staff · All</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/staff/roles")}>
            <Users2 /> <span>Staff · Roles</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/global-settings")}>
            <Settings /> <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={() => go("/admin/profile")}>
            <User /> <span>Profile</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/notifications")}>
            <Bell /> <span>Notifications</span>
          </CommandItem>
          <CommandItem onSelect={() => go("/admin/help")}>
            <HelpCircle /> <span>Help &amp; support</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onOpenChange(false);
              window.open("/", "_blank", "noopener,noreferrer");
            }}
          >
            <ExternalLink /> <span>Open public site</span>
          </CommandItem>
          <CommandItem onSelect={handleLogout}>
            <LogOut /> <span>Sign out</span>
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
            <Sun /> <span>Light mode</span>
            <CommandShortcut>L</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme("dark");
              onOpenChange(false);
            }}
          >
            <Moon /> <span>Dark mode</span>
            <CommandShortcut>D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme("system");
              onOpenChange(false);
            }}
          >
            <Monitor /> <span>System theme</span>
            <CommandShortcut>S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
