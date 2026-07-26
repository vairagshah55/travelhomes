import React from "react";
import { Link } from "react-router-dom";
import { AdminBrandLockup } from "@/components/admin/AdminBrand";

/**
 * Admin sidebar logo (mobile drawer). Renders the TravelHomes brand lockup and
 * links to the admin dashboard.
 */
const LogoWebsite = () => (
  <Link
    to="/admin/dashboard"
    className="inline-flex items-center"
    aria-label="TravelHomes admin home"
  >
    <AdminBrandLockup markSize={34} />
  </Link>
);

export default LogoWebsite;
