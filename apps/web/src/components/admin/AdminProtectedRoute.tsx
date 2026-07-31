import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AdminAuthContext";
import { featureForPath, LANDING_CANDIDATES } from "@/lib/adminPermissions";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Override the feature this route needs. Normally left unset — the required
   * feature is derived from the path via `featureForPath`.
   */
  feature?: string | string[];
}

/**
 * Gates an admin route on both authentication and the role's features.
 *
 * Previously this only checked that an `adminToken` existed, so any staff
 * account could open every admin page regardless of its role. The server now
 * enforces the same features (see Server/middleware/permissions.js); this keeps
 * the SPA from rendering a page whose data calls would all come back 403.
 */
const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children, feature }) => {
  const { pathname } = useLocation();
  const { isLoading, access, can, refresh } = useAuth();

  const adminToken = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");

  /**
   * Self-heal: a token exists but we hold no permission set and nothing is in
   * flight. AuthProvider only fetches /me on mount, so any path that plants a
   * token afterwards (login, a second tab, a manual token) would otherwise
   * leave the guard spinning on `!access` with no fetch to resolve it.
   */
  useEffect(() => {
    if (adminToken && !isLoading && !access) void refresh();
  }, [adminToken, isLoading, access, refresh]);

  if (!adminToken) {
    // Redirect to admin login if not authenticated.
    // Absolute "/login" would land on the vendor login page; AdminApp is
    // mounted at /admin/*, so the admin login lives at /admin/login.
    return <Navigate to="/admin/login" replace />;
  }

  // Hold the route until /me answers, otherwise the first paint would redirect
  // based on a permission set we haven't loaded yet.
  if (isLoading || !access) {
    return (
      <div className="flex h-screen items-center justify-center bg-tpl-body-bg">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-tpl-stroke border-t-tpl-primary" />
      </div>
    );
  }

  const required = feature ?? featureForPath(pathname);
  if (required && !can(required)) {
    // Send them to the first area they do hold rather than looping on a page
    // they can't see. `/admin/profile` needs no feature, so this always resolves.
    const landing = LANDING_CANDIDATES.find((c) => !c.feature || can(c.feature));
    const target = landing?.path ?? "/admin/profile";
    if (target === pathname) return <>{children}</>;
    return <Navigate to={target} replace state={{ deniedFrom: pathname }} />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
