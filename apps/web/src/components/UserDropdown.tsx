import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils";
import { getInitials } from "@/utils/getInitials";

interface UserDropdownProps {
  onSwitchToVendor: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ onSwitchToVendor }) => {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Profile",
      path: "/user-profile",
      active:
        location.pathname === "/user-profile" ||
        location.pathname === "/user-profile-edit",
    },
    {
      label: "Trips",
      path: "/user-trips",
      active: location.pathname === "/user-trips",
    },
    {
      label: "Wishlist",
      path: "/wishlist",
      active: location.pathname === "/wishlist",
    },
    {
      label: "Account Setting",
      path: "/account-settings",
      active: location.pathname === "/account-settings",
    },
    { label: "Chat", path: "/chat", active: location.pathname === "/chat" },
    { label: "Help", path: "/help", active: location.pathname === "/help" },
  ];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
    return () =>
      window.removeEventListener("profileUpdated" as any, handler as any);
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
    <div className="relative z-50 w-max" ref={dropdownRef}>
      {/* Trigger — pill on md+ (Hi, Name · avatar · chevron); just the avatar on mobile. */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Account menu for ${displayName}`}
        className={`group inline-flex items-center gap-2.5 h-11 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5C8A] focus-visible:ring-offset-2
          md:pl-3.5 md:pr-1.5 md:bg-white md:border md:border-gray-200 md:shadow-sm md:hover:shadow-md md:hover:border-gray-300 md:hover:-translate-y-px
          ${isOpen ? "md:border-[#0F5C8A]/40 md:shadow-md" : ""}`}
      >
        <span className="hidden md:inline-flex items-baseline gap-1 text-[13px] leading-none">
          <span className="text-gray-500">Hi,</span>
          <span className="text-gray-900 font-semibold tracking-tight max-w-[140px] truncate inline-block align-middle">
            {displayName}
          </span>
        </span>
        <Avatar className="h-9 w-9 md:ring-2 md:ring-white shrink-0">
          {photoSrc && <AvatarImage src={photoSrc} alt={`${displayName}'s avatar`} />}
          <AvatarFallback className="bg-[#E8F2F8] text-[#0F5C8A] text-[12px] font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden
          className={`hidden md:block text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            bg-white z-50 
            sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-52 sm:rounded-lg sm:shadow-lg sm:border sm:border-gray-200 sm:translate-x-[-40px]
            fixed top-0 left-0 w-full h-full sm:h-auto sm:block
            flex flex-col
          `}
        >
          {/* Mobile Header */}
          {/* <div className="lg:hidden">
            <Header variant="transparent" className="fixed w-full z-50" />
          </div> */}

          {/* Mobile Close + Title */}
          <div className="flex   items-center justify-between px-4 py-3 border-b md:hidden">
            <button
              onClick={() => {
                setIsOpen(false);
                if (user) {
                  navigate("/onboarding/service-selection");
                } else {
                  navigate("/register");
                }
              }}
              className="flex items-center gap-2 text-sm font-medium bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200"
            >
              <svg className="w-6 h-6" viewBox="0 0 15 16" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 1H5C2.79086 1 1 2.79086 1 5V11C1 13.2091 2.79086 15 5 15H10C12.2091 15 14 13.2091 14 11V5C14 2.79086 12.2091 1 10 1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.5 1.75C7.91421 1.75 8.25 1.41421 8.25 1C8.25 0.585786 7.91421 0.25 7.5 0.25V1.75ZM1.5 0.25C1.08579 0.25 0.75 0.585786 0.75 1C0.75 1.41421 1.08579 1.75 1.5 1.75V0.25ZM7.5 4.75C7.91421 4.75 8.25 4.41421 8.25 4C8.25 3.58579 7.91421 3.25 7.5 3.25V4.75ZM1.5 3.25C1.08579 3.25 0.75 3.58579 0.75 4C0.75 4.41421 1.08579 4.75 1.5 4.75V3.25ZM4.5 7.75C4.91421 7.75 5.25 7.41421 5.25 7C5.25 6.58579 4.91421 6.25 4.5 6.25V7.75ZM1.5 6.25C1.08579 6.25 0.75 6.58579 0.75 7C0.75 7.41421 1.08579 7.75 1.5 7.75V6.25ZM7.5 1V0.25H1.5V1V1.75H7.5V1ZM7.5 4V3.25H1.5V4V4.75H7.5V4ZM4.5 7V6.25H1.5V7V7.75H4.5V7Z"
                  fill="currentColor"
                />
              </svg>
              List your offering
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-2xl text-gray-600 sm:hidden"
            >
              &times;
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex flex-col ">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleItemClick(item.path)}
                className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                  item.active
                    ? "bg-gray-100 hover:bg-gray-400 font-medium text-gray-900 "
                    : "text-black hover:bg-gray-50"
                }`}
              >
                <span className="max-md:text-sm">{item.label}</span>
              </button>
            ))}

            <div className="h-px bg-gray-200 my-1" />

            {(user?.vendorStatus === "approved" || user?.vendorStatus === "active") && (
          <button
                onClick={handleSwitchToVendor}
                className="w-full px-4 py-3 text-left max-md:text-sm text-sm text-black hover:bg-gray-50 transition-colors"
              >
                Switch to Vendor
              </button>
            )}

            

            {/* <button
              onClick={() => handleItemClick("/help")}
              className="w-full px-4 py-3 text-left max-md:text-lg text-sm text-black hover:bg-gray-50 transition-colors"
            >
              Help
            </button> */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left max-md:text-sm text-sm text-black hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
