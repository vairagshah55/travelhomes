import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Public/vendor site logo — the horizontal brand lockup, linking home (vendors →
 * /dashboard, everyone else → /). Tone resolves itself: black on light surfaces,
 * white under `.dark`.
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
 * Header variant — `variant="light"` forces the white lockup for transparent hero
 * headers sitting over photos.
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
