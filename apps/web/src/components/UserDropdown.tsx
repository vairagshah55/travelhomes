import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  User as UserIcon,
  MapPin,
  Heart,
  Settings,
  MessageCircle,
  HelpCircle,
  ArrowUpRight,
  LogOut,
  X as CloseIcon,
  FileText,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils";
import { getInitials } from "@/utils/getInitials";
import { useIsApprovedVendor } from "@/hooks/useProfile";

interface UserDropdownProps {
  onSwitchToVendor: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ onSwitchToVendor }) => {
  const { user, logout, updateUser, refreshUser } = useAuth();
  // Server-backed, not the localStorage snapshot — see useIsApprovedVendor.
  const canSwitchToVendor = useIsApprovedVendor(user?.email, user?.vendorStatus);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Profile",
      path: "/user-profile",
      icon: UserIcon,
      active: location.pathname === "/user-profile" || location.pathname === "/user-profile-edit",
    },
    {
      label: "Trips",
      path: "/user-trips",
      icon: MapPin,
      active: location.pathname === "/user-trips",
    },
    {
      label: "Wishlist",
      path: "/wishlist",
      icon: Heart,
      active: location.pathname === "/wishlist",
    },
    {
      label: "Account Settings",
      path: "/account-settings",
      icon: Settings,
      active: location.pathname === "/account-settings",
    },
    {
      label: "Chat",
      path: "/chat",
      icon: MessageCircle,
      active: location.pathname === "/chat",
    },
    {
      label: "Help",
      path: "/help",
      icon: HelpCircle,
      active: location.pathname === "/help",
    },
  ];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Disable scroll on mobile when dropdown is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Listen for profile updates to refresh avatar/name without reload
  useEffect(() => {
    const handler = (e: any) => {
      const d = e?.detail || {};
      updateUser(d);
    };
    window.addEventListener("profileUpdated" as any, handler as any);
    return () => window.removeEventListener("profileUpdated" as any, handler as any);
  }, [updateUser]);

  // Refresh user data on mount to ensure we have the latest status
  useEffect(() => {
    // Force refresh on mount to check for vendor status updates (e.g. after approval)
    if (user) {
      refreshUser();
    }
  }, []); // Run once on mount

  const handleItemClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleSwitchToVendor = () => {
    setIsOpen(false);
    onSwitchToVendor();
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate("/");
  };

  const displayName = user?.firstName || "User";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || displayName;
  const initials = getInitials(fullName);
  const photoSrc = user?.photo ? getImageUrl(user.photo) : "";

  return (
    <div className={`relative w-max ${isOpen ? "z-[130]" : "z-50"}`} ref={dropdownRef}>
      {/* Trigger — pill on md+ (Hi, Name · avatar · chevron); just the avatar on mobile. */}
      <button
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          // Vendor approval happens out-of-band (admin action) while this tab
          // may already be open, so the mount-time refresh above can be stale
          // by the time the user actually looks at the menu. Re-check on every
          // open so an approval always shows up without a full page reload.
          if (next) refreshUser();
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Account menu for ${displayName}`}
        /* Cyan pill carries WHITE, matching every other brand-filled control.
           The focus ring stays dark ink on purpose — it's an indicator, not a
           label, and a white ring on cyan would be almost invisible. */
        className={`group inline-flex items-center gap-2.5 h-11 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a1c1c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#3BD9DA] md:pl-3.5 md:pr-1.5 md:bg-[#3BD9DA] md:hover:bg-[#2BC7C8] md:shadow-md md:hover:shadow-lg md:hover:-translate-y-0.5 ${
          isOpen ? "md:bg-[#2BC7C8] md:shadow-lg" : ""
        }`}
      >
        <span className="hidden md:inline-flex items-baseline gap-1 text-[13px] leading-none">
          <span className="text-white/80">Hi,</span>
          <span className="text-white font-semibold tracking-tight max-w-[140px] truncate inline-block align-middle">
            {displayName}
          </span>
        </span>
        {/* Bare white-on-white was invisible on mobile (no pill behind it to
            frame it) — teal fill + shadow there; back to white-on-cyan-pill
            at md+, unchanged. */}
        <Avatar className="h-9 w-9 shadow-sm md:shadow-none md:ring-2 md:ring-white/50 shrink-0">
          {photoSrc && <AvatarImage src={photoSrc} alt={`${displayName}'s avatar`} />}
          <AvatarFallback className="bg-[#117479] text-white md:bg-white md:text-[#117479] text-[12px] font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden
          className={`hidden md:block text-white/80 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown menu — desktop popover (sm+), full-screen sheet on mobile.
          A backdrop sits behind so any floating widget on the page (chat/search
          FABs etc.) is dimmed and never bleeds into the menu. */}
      {isOpen && (
        <>
          <div
            aria-hidden
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-[2px] sm:bg-black/25 sm:backdrop-blur-[1px]"
          />
          {/**
           * Height budget: the menu scrolls its NAV LIST, never the whole panel.
           *
           * The panel itself was the scroll container, capped at
           * `min(360px, calc(100vh - 200px))`. On a short window that second
           * term wins — at 430px tall it resolves to ~230px — so the panel
           * clipped and everything after "Help" (Switch to Vendor, Logout) sat
           * below the fold, reachable only by scrolling inside a popover that
           * gives no hint it scrolls. It read as "those items don't exist".
           *
           * Identity header and the action footer are pinned; only the nav list
           * between them scrolls, so the primary actions are always on screen
           * no matter the viewport.
           */}
          <div
            role="menu"
            className="bg-white z-[120] flex flex-col overflow-hidden
              sm:absolute sm:left-[14px] sm:right-auto sm:top-full sm:mt-3 sm:w-64 sm:rounded-2xl sm:shadow-2xl sm:border sm:border-gray-100 sm:max-h-[calc(100vh-96px)]
              fixed top-0 left-0 w-full h-full sm:h-auto"
          >
            {/* ── Mobile-only: "List your offering" CTA + close ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 md:hidden">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate(user ? "/onboarding/service-selection" : "/register");
                }}
                className="inline-flex items-center gap-2 text-sm font-medium bg-[#3BD9DA] text-white px-4 py-2 rounded-full hover:bg-[#2BC7C8] transition-colors"
              >
                <FileText size={16} strokeWidth={2} />
                List your offering
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 grid place-items-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* ── Identity header — name + email only. Pinned (shrink-0).
              The avatar is intentionally NOT repeated here: it's already shown
              in the trigger pill above (same visual moment). Showing it twice
              adds no information and steals ~36px of menu height. ── */}
            <div className="shrink-0 px-3.5 py-2.5 border-b border-gray-100">
              <p className="text-[13px] font-semibold text-gray-900 leading-tight truncate">
                {fullName}
              </p>
              {user?.email && (
                <p className="text-[11.5px] text-gray-500 leading-tight truncate mt-1">
                  {user.email}
                </p>
              )}
            </div>

            {/* ── Primary nav — the only scrollable region ── */}
            <div className="p-1 flex-1 min-h-0 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    role="menuitem"
                    onClick={() => handleItemClick(item.path)}
                    className={`group w-full flex items-center gap-2.5 px-2.5 py-1 rounded-lg text-[13px] font-medium transition-colors ${
                      item.active
                        ? "bg-[#e6fafa] text-[#117479]"
                        : "text-gray-700 hover:bg-[#F4F9FC] hover:text-[#117479]"
                    }`}
                  >
                    <Icon
                      size={14}
                      strokeWidth={1.75}
                      className={`shrink-0 transition-colors ${
                        item.active ? "text-[#117479]" : "text-gray-400 group-hover:text-[#117479]"
                      }`}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* ── Action footer — pinned, so these are reachable at any
                viewport height without scrolling the menu. ── */}
            <div className="shrink-0 bg-white">
              {canSwitchToVendor && (
                <>
                  <div className="h-px bg-gray-100 mx-1.5" />
                  <div className="p-1">
                    <button
                      role="menuitem"
                      onClick={handleSwitchToVendor}
                      className="group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-[#117479] hover:bg-[#e6fafa] transition-colors"
                    >
                      <ArrowUpRight size={14} strokeWidth={2} className="shrink-0" />
                      Switch to Vendor
                    </button>
                  </div>
                </>
              )}

              <div className="h-px bg-gray-100 mx-1.5" />
              <div className="p-1">
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} strokeWidth={1.75} className="shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserDropdown;
