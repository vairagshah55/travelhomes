import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Public/vendor site logo — the horizontal brand lockup, linking to the landing
 * page. Tone resolves itself: black on light surfaces, white under `.dark`.
 *
 * It used to read `useAuth()` and send anyone with a vendor account to
 * `/dashboard` instead. That made the one control every site header shares
 * behave differently depending on who was signed in: a vendor reading the
 * public journal or part-way through onboarding clicked the logo expecting home
 * and landed in the vendor console. The logo is a "back to the site" affordance
 * — the console is reachable from the account menu.
 */
const LogoWebsite = () => (
  <Link to="/" aria-label="TravelHomes home">
    <BrandLogo size={40} />
  </Link>
);

/**
 * Header variant — `variant="light"` forces the white lockup for transparent hero
 * headers sitting over photos.
 */
export function HomeLogoWebsite({ variant = "auto" }: { variant?: "auto" | "light" | "dark" }) {
  const tone = variant === "light" ? "light" : variant === "dark" ? "dark" : "auto";

  return (
    <Link to="/" aria-label="TravelHomes home">
      <BrandLogo size={40} tone={tone} />
    </Link>
  );
}

export default LogoWebsite;
