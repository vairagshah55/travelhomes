import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Building2,
  ChevronUp,
  KeyRound,
  LogOut,
  User as UserIcon,
  UserCog,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useIsApprovedVendor } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getImageUrl } from "@/lib/utils";

/**
 * Vendor account menu. Trigger + menu mirror the admin header's UserInfo
 * dropdown (44px avatar, name + chevron above lg, 264px menu with icon rows)
 * so the vendor and admin top bars stay visually identical. Menu ITEMS are
 * vendor-specific and unchanged.
 */

interface ProfileDropdownProps {
  userImage?: string;
  userInitials?: string;
  onProfileClick?: () => void;
  onViewAsUserClick?: () => void;
  onSwitchToUserClick?: () => void;
  onBusinessDetailsClick?: () => void;
  onPersonalDetailsClick?: () => void;
  onChangePasswordClick?: () => void;
  onLogoutClick?: () => void;
}

/* Shared row styling — matches AdminHeader's dropdown items. */
const ITEM =
  "gap-2.5 px-2.5 py-2 cursor-pointer text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700/60 focus:text-gray-900 dark:focus:text-white rounded-lg";
const ITEM_ICON = "text-gray-400 dark:text-gray-500";
const ITEM_LABEL = "text-[13.5px] font-medium";

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  userImage,
  userInitials = "",
  onProfileClick,
  onSwitchToUserClick,
  onBusinessDetailsClick,
  onPersonalDetailsClick,
  onChangePasswordClick,
  onLogoutClick,
}) => {
  const navigate = useNavigate();
  const { logout, user, updateUserType, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);
    // Vendor approval is an out-of-band admin action, so the status cached
    // at page load can be stale by the time the user opens this menu —
    // re-check every time instead of only once on mount.
    if (next && user) refreshUser();
  };

  const handleProfileClick = () => {
    navigate("/profile");
    if (onProfileClick) onProfileClick();
  };

  const handleSwitchToVendor = async () => {
    await updateUserType("vendor");
    navigate("/dashboard");
  };

  const handleSwitchToUserLocal = async () => {
    await updateUserType("user");
    navigate("/");
    if (onSwitchToUserClick) onSwitchToUserClick();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    if (onLogoutClick) onLogoutClick();
  };

  // Derive initials from the authenticated user (firstName/lastName, then the
  // legacy `name`, then email), falling back to any passed prop, then "U".
  const legacyName = (user as { name?: string } | null)?.name;

  const getUserInitials = () => {
    if (user?.firstName) {
      return `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}`.toUpperCase();
    }
    if (legacyName?.trim()) {
      const parts = legacyName.trim().split(/\s+/);
      return ((parts[0][0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
    }
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return userInitials || "U";
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    legacyName?.trim() ||
    user?.email ||
    "Vendor";

  // Only use a real photo (user's own, then an explicit prop). No stranger
  // stock-photo fallback — the initials AvatarFallback covers the empty case.
  const photoUrl = user?.photo || userImage || "";

  // Server-backed rather than the localStorage snapshot — see useIsApprovedVendor.
  const canSwitchToVendor = useIsApprovedVendor(user?.email, user?.vendorStatus);

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger className="cursor-pointer rounded outline-none focus-visible:ring-1 focus-visible:ring-app-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 shrink-0">
        <span className="sr-only">My Account</span>
        <figure className="flex items-center gap-3">
          <Avatar className="size-11">
            {photoUrl && <AvatarImage src={getImageUrl(photoUrl)} />}
            <AvatarFallback className="bg-[#117479] text-white text-[13px] font-bold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          {/* Name + chevron hidden below lg so the 84px bar never overflows
              on mid-size viewports — same breakpoint as the admin header. */}
          <figcaption className="hidden lg:flex items-center gap-1 font-medium text-[#101828] dark:text-white">
            <span className="max-w-24 truncate text-[14px]">{displayName}</span>
            <ChevronUp
              size={16}
              strokeWidth={1.5}
              className={`transition-transform ${isOpen ? "rotate-0" : "rotate-180"}`}
              aria-hidden
            />
          </figcaption>
        </figure>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="min-w-[264px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-0 overflow-hidden"
      >
        {/* Identity row — avatar, name, muted email */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Avatar className="size-11 shrink-0">
            {photoUrl && <AvatarImage src={getImageUrl(photoUrl)} />}
            <AvatarFallback className="bg-[#117479] text-white text-[14px] font-bold">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight truncate">
              {displayName}
            </div>
            {user?.email && (
              <div className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-tight truncate mt-0.5">
                {user.email}
              </div>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700 m-0" />

        <div className="p-1.5">
          <DropdownMenuItem className={ITEM} onSelect={handleProfileClick}>
            <UserIcon size={17} className={ITEM_ICON} />
            <span className={ITEM_LABEL}>Profile</span>
          </DropdownMenuItem>

          {user?.userType === "vendor" ? (
            <DropdownMenuItem className={ITEM} onSelect={handleSwitchToUserLocal}>
              <ArrowLeftRight size={17} className={ITEM_ICON} />
              <span className={ITEM_LABEL}>Switch to User</span>
            </DropdownMenuItem>
          ) : (
            canSwitchToVendor && (
              <DropdownMenuItem className={ITEM} onSelect={handleSwitchToVendor}>
                <ArrowLeftRight size={17} className={ITEM_ICON} />
                <span className={ITEM_LABEL}>Switch to Vendor</span>
              </DropdownMenuItem>
            )
          )}

          <DropdownMenuItem className={ITEM} onSelect={() => onBusinessDetailsClick?.()}>
            <Building2 size={17} className={ITEM_ICON} />
            <span className={ITEM_LABEL}>Business Details</span>
          </DropdownMenuItem>

          <DropdownMenuItem className={ITEM} onSelect={() => onPersonalDetailsClick?.()}>
            <UserCog size={17} className={ITEM_ICON} />
            <span className={ITEM_LABEL}>Personal Details</span>
          </DropdownMenuItem>

          <DropdownMenuItem className={ITEM} onSelect={() => onChangePasswordClick?.()}>
            <KeyRound size={17} className={ITEM_ICON} />
            <span className={ITEM_LABEL}>Change Password</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700 m-0" />

        <div className="p-1.5">
          <DropdownMenuItem
            className="gap-2.5 px-2.5 py-2 cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700 dark:focus:text-red-300 rounded-lg"
            onSelect={handleLogout}
          >
            <LogOut size={17} />
            <span className={ITEM_LABEL}>Logout</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
