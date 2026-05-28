import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Admin sidebar logo. Renders the HD vector BrandLogo (TravelHomes) and links
 * to the admin dashboard. Replaced the previous CMS-fetched/builder.io image.
 */
const LogoWebsite = () => (
  <Link to="/admin/dashboard" className="inline-flex items-center" aria-label="TravelHomes admin home">
    <BrandLogo size={36} />
  </Link>
);

export default LogoWebsite;
