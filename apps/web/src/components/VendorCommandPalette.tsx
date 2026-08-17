import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarPlus,
  ExternalLink,
  LogOut,
  Monitor,
  Moon,
  PackagePlus,
  Sun,
  Tag,
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
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { CONSOLE_PORTAL_VARS } from "@/components/shared";
import { VENDOR_NAV } from "@/components/vendorNav";

interface VendorCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Palette row glyph. Monochrome, matching the rail: this list is a ranked set
 * of search results, and a column of different hues fights the ranking by
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
 * Global ⌘K palette for the vendor console.
 *
 * The admin has had one since its redesign; the vendor side had no keyboard
 * route to anything, so every navigation was a pointer trip to the rail — and
 * on a collapsed rail, a hover-then-read trip. Destinations come from
 * `vendorNav.ts`, the same definition the rail renders, so the two cannot
 * drift.
 *
 * The "Create" group at the top is the part a nav list can't give you: the
 * three write actions a vendor performs most are reachable from any page in two
 * keystrokes, rather than from whichever screen happens to host the button.
 */
export default function VendorCommandPalette({ open, onOpenChange }: VendorCommandPaletteProps) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { logout } = useAuth();

  // Global ⌘K / Ctrl+K listener. Mounted once, by DashboardHeader.
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
    navigate("/login");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} contentStyle={CONSOLE_PORTAL_VARS} contentScope="vendor">
      <CommandInput placeholder="Search pages and actions…" />
      <CommandList>
        <CommandEmpty>No matches. Try “bookings”, “payout” or “offer”.</CommandEmpty>

        <CommandGroup heading="Create">
          <CommandItem value="create new booking reservation" onSelect={() => go("/bookings/new")}>
            <PIcon icon={CalendarPlus} />
            <span>New booking</span>
          </CommandItem>
          <CommandItem
            value="create new offering listing caravan stay activity"
            onSelect={() => go("/offering/add")}
          >
            <PIcon icon={PackagePlus} />
            <span>New offering</span>
          </CommandItem>
          <CommandItem
            value="create new offer promotion discount coupon"
            onSelect={() => go("/marketing/offers")}
          >
            <PIcon icon={Tag} />
            <span>New offer</span>
          </CommandItem>
        </CommandGroup>

        {VENDOR_NAV.map((section) => (
          <React.Fragment key={section.id}>
            <CommandSeparator />
            <CommandGroup heading={section.label}>
              {section.items.map((item) => (
                <CommandItem
                  key={item.id}
                  /* `value` is what cmdk fuzzy-matches, not the rendered label —
                     so the keywords ride along invisibly and "payout" finds
                     Revenue, "discount" finds Offers. */
                  value={`${section.label} ${item.label} ${item.keywords ?? ""}`}
                  onSelect={() => {
                    if (item.external) {
                      onOpenChange(false);
                      window.open(item.path, "_blank", "noopener,noreferrer");
                    } else {
                      go(item.path);
                    }
                  }}
                >
                  <PIcon icon={item.icon} />
                  <span>{item.label}</span>
                  {item.external && (
                    <ExternalLink size={13} className="ml-auto text-app-fg-subtle" aria-hidden />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}

        <CommandSeparator />

        <CommandGroup heading="Appearance">
          <CommandItem
            value="light theme mode appearance"
            onSelect={() => {
              setTheme("light");
              onOpenChange(false);
            }}
          >
            <PIcon icon={Sun} />
            <span>Light mode</span>
            <CommandShortcut>L</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="dark theme mode appearance night"
            onSelect={() => {
              setTheme("dark");
              onOpenChange(false);
            }}
          >
            <PIcon icon={Moon} />
            <span>Dark mode</span>
            <CommandShortcut>D</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="system theme mode appearance auto"
            onSelect={() => {
              setTheme("system");
              onOpenChange(false);
            }}
          >
            <PIcon icon={Monitor} />
            <span>System theme</span>
            <CommandShortcut>S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Session">
          <CommandItem value="sign out log out logout" onSelect={handleLogout}>
            <PIcon icon={LogOut} />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
