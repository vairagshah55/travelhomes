import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Public/vendor site logo. Renders the HD vector BrandLogo (TravelHomes) and
 * links home (vendors → /dashboard, everyone else → /). The previous
 * CMS-fetched/builder.io image logo was replaced with the in-app vector logo.
 */
const LogoWebsite = () => {
  const { user } = useAuth();
  const has =
    user?.vendorStatus === "approved" || user?.vendorStatus === "active" || user?.userType === "vendor";

  return (
    <Link to={has ? "/dashboard" : "/"} aria-label="TravelHomes home">
      <BrandLogo size={40} />
    </Link>
  );
};

/**
 * Header variant — `variant="light"` forces the white wordmark for transparent
 * hero headers sitting over photos.
 */
export function HomeLogoWebsite({ variant = "auto" }: { variant?: "auto" | "light" | "dark" }) {
  const { user } = useAuth();
  const has =
    user?.vendorStatus === "approved" || user?.vendorStatus === "active" || user?.userType === "vendor";
  const tone = variant === "light" ? "light" : variant === "dark" ? "dark" : "auto";

  return (
    <Link to={has ? "/dashboard" : "/"} aria-label="TravelHomes home">
      <BrandLogo size={40} tone={tone} />
    </Link>
  );
}

export default LogoWebsite;
