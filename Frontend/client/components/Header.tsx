import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import UserDropdown from "./UserDropdown";
import { CgLoadbarDoc } from "react-icons/cg";
import LogoWebsite from "./ui/LogoWebsite";

// Re-export named exports so all existing import sites continue to work
// without any changes to their import paths.
export { DashboardHeader } from "./DashboardHeader";
export { HomeHeader } from "./HomeHeader";

// callbackFun + onNavigate are optional — most static marketing pages
// (About, Contact, Help, Terms, Privacy, etc.) render Header without
// passing them. The Header function destructures with `() => {}` defaults
// so unused callbacks no-op safely at runtime.
interface HeaderProps {
  variant?: "transparent" | "white";
  className?: string;
  callbackFun?: (filter: string) => void;
  onNavigate?: (target: string) => void;
}

type FilterType = "camper-van" | "unique-stays" | "activity";

function FilterButton({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 max-md:gap-1 px-4 py-2 rounded-full transition-colors ${
        active
          ? "bg-black dark:bg-white dark:text-black text-white border border-black"
          : "bg-white/10 text-gray-900 dark:bg-black dark:text-white hover:bg-gray-200 border border-gray-200"
      }`}
    >
      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
        <Icon className="w-4 h-4 text-black" />
      </div>
      <span className="text-sm font-medium capitalize">{label}</span>
    </button>
  );
}

function CamperVanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path
        d="M5.27776 13.333C4.2222 13.333 3.33331 14.2219 3.33331 15.2775C3.33331 16.333 4.2222 17.2219 5.27776 17.2219C6.33331 17.2219 7.2222 16.333 7.2222 15.2775C7.2222 14.2219 6.33331 13.333 5.27776 13.333ZM5.27776 16.1108C4.83331 16.1108 4.44442 15.7219 4.44442 15.2775C4.44442 14.833 4.83331 14.4441 5.27776 14.4441C5.7222 14.4441 6.11109 14.833 6.11109 15.2775C6.11109 15.7219 5.7222 16.1108 5.27776 16.1108Z"
        fill="currentColor"
      />
      <path
        d="M13.0555 13.333C12 13.333 11.1111 14.2219 11.1111 15.2775C11.1111 16.333 11.9444 17.2219 13.0555 17.2219C14.1111 17.2219 15 16.333 15 15.2775C15 14.2219 14.1111 13.333 13.0555 13.333ZM13.0555 16.1108C12.6111 16.1108 12.2222 15.7219 12.2222 15.2775C12.2222 14.833 12.6111 14.4441 13.0555 14.4441C13.5 14.4441 13.8889 14.833 13.8889 15.2775C13.8889 15.7219 13.5 16.1108 13.0555 16.1108Z"
        fill="currentColor"
      />
      <path
        d="M18.3333 11.1662V11.1107H18.2778L16.3333 8.05512C17.2222 7.55512 17.7778 6.66623 17.7778 5.72179V5.38845C17.7778 3.94401 16.6111 2.77734 15.1666 2.77734H10.4444C9.38886 2.77734 8.38886 3.44401 7.99997 4.44401H2.77775C1.83331 4.44401 1.11108 5.16623 1.11108 6.11068V15.5551H2.2222V6.11068C2.2222 5.77734 2.44442 5.55512 2.77775 5.55512H8.83331L8.88886 5.11068C9.05553 4.38845 9.66664 3.88845 10.3889 3.88845H15.1111C16 3.88845 16.6666 4.55512 16.6666 5.38845V5.66623C16.6666 6.49957 16 7.16623 15.1666 7.16623H13.3333V12.1662H17.6666L17.7778 12.3329V13.8885C17.7778 14.2218 17.5555 14.444 17.2222 14.444H16.1111V15.5551H17.2222C18.1666 15.5551 18.8889 14.8329 18.8889 13.8885V12.0551L18.3333 11.1662ZM14.4444 11.1107V8.3329H15.2778L17 11.1107H14.4444Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path
        d="M20 8.25L10 1.75L7.5 3.375V1.25H5V5L0 8.25L2.375 11.625L2.5 11.5V18.75H8.75V13.75H11.25V18.75H17.5V11.5L17.625 11.625L20 8.25ZM1.75 8.625L10 3.25L18.25 8.625L17.375 9.875L10 5L2.625 9.875L1.75 8.625ZM16.25 17.5H12.5V12.5H7.5V17.5H3.75V10.75L10 6.625L16.25 10.75V17.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none">
      <path
        d="M18 2.25009C18 2.08342 17.8333 2.00009 17.6667 1.91676C14.5 1.08342 11.0833 2.16676 8.99999 4.66676L7.91666 5.91676L5.66666 5.33342C4.74999 5.00009 3.83332 5.41676 3.41666 6.25009L1.66666 9.33342C1.66666 9.33342 1.66666 9.41676 1.58332 9.41676C1.49999 9.66676 1.66666 9.83342 1.91666 9.91676L4.74999 10.5001C4.49999 11.2501 4.24999 12.0001 4.16666 12.7501C4.16666 12.9168 4.16666 13.0001 4.24999 13.0834L6.74999 15.5001C6.83332 15.5834 6.91666 15.5834 7.08332 15.5834C7.83332 15.5001 8.66666 15.3334 9.41666 15.0834L9.99999 17.8334C9.99999 18.0001 10.25 18.1668 10.4167 18.1668C10.5 18.1668 10.5833 18.1668 10.5833 18.0834L13.6667 16.3334C14.4167 15.9168 14.75 15.0001 14.5833 14.1668L14 11.7501L15.1667 10.6668C17.75 8.75009 18.8333 5.41676 18 2.25009Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Header({
  variant = "white",
  className = "",
  callbackFun = () => {},
  onNavigate = () => {},
}: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilterHeader, setActiveFilterHeader] = useState<FilterType>(
    (searchParams.get("filter") as FilterType) || "unique-stays",
  );
  const isTransparent = variant === "transparent";

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) setShowFilters(true);
      else setShowFilters(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSwitchToVendor = () => navigate("/dashboard");

  // useEffect(() => {
  //   callbackFun(activeFilterHeader);
  // }, [callbackFun]);

  useEffect(() => {
    if (typeof callbackFun === "function") {
      callbackFun(activeFilterHeader);
    }
  }, [callbackFun, activeFilterHeader]);

  return (
    <>
      {/* Main Header */}
      <nav
        className={`sticky top-0 flex items-center justify-between px-4 md:px-10 py-2 z-50 border-b border-gray-100 dark:border-gray-800 backdrop-blur-sm shadow-sm
          ${
            !user && isTransparent
              ? "bg-white/95 dark:bg-gray-900/95"
              : "bg-white/95 dark:bg-black/95"
          } ${className}`}
      >
        {/* Logo */}
        <div className="w-40 flex-shrink-0">
          <LogoWebsite />
        </div>

        {/* Nav Items */}
        <div className="hidden lg:flex items-center gap-10 flex-1 justify-center" />

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className={`hidden md:flex ${
              isTransparent
                ? "bg-white/90 dark:hover:bg-gray-500 backdrop-blur-sm border-gray-300 text-black hover:bg-white/100"
                : "bg-white/90 backdrop-blur-sm dark:hover:bg-gray-500 border-gray-300 text-black hover:bg-gray-50"
            } rounded-full px-4 md:px-4 h-10`}
            onClick={() => navigate("/onboarding/service-selection")}
          >
            <div className="flex items-center gap-2">
              <CgLoadbarDoc size={20} />
              <span className="text-sm font-medium">List your offering</span>
            </div>
          </Button>

          {user ? (
            <UserDropdown onSwitchToVendor={handleSwitchToVendor} />
          ) : (
            <Link to="/register">
              <Button
                className={`${
                  isTransparent
                    ? "bg-white/90 backdrop-blur-sm text-black hover:bg-white/100"
                    : "bg-black text-white hover:bg-gray-800"
                } rounded-full px-4 md:px-6 h-10`}
              >
                Register
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

export default Header;
