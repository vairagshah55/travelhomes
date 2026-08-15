import React, { useEffect, useRef } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, LogOut, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AdminAuthContext";
import { featureForPath, LANDING_CANDIDATES } from "@/lib/adminPermissions";
import { AdminBrandMark } from "@/components/admin/AdminBrand";

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
/**
 * Shown when /me can't be reached. The panel needs the role's grants to decide
 * what to render, so there's nothing useful to fall back to — but a dead end
 * with a stated cause and a retry beats a spinner that never stops.
 */
const AccessUnavailable = ({ message, onRetry }: { message: string; onRetry: () => void }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-tpl-body-bg px-4">
      <div className="w-full max-w-[420px] rounded-[18px] border border-tpl-stroke bg-white p-6 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)]">
        <div className="mb-4 flex justify-center">
          <AdminBrandMark size={38} />
        </div>

        <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle size={19} strokeWidth={2.2} />
        </span>

        <h1 className="text-[17px] font-bold tracking-tight text-[#101828]">
          Can't load the admin panel
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#667085]">{message}</p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={onRetry}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#117479] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#0d5c60]"
          >
            <RotateCcw size={15} /> Try again
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/admin/login", { replace: true });
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#f2f4f7] px-4 text-[13px] font-semibold text-[#475467] transition-colors hover:bg-[#e6ebf1]"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children, feature }) => {
  const { pathname } = useLocation();
  const { isLoading, access, error, can, refresh } = useAuth();

  const adminToken = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");

  /**
   * Self-heal: a token exists but we hold no permission set, nothing is in
   * flight, and the last attempt didn't fail outright. AuthProvider only fetches
   * /me on mount, so any path that plants a token afterwards (login, a second
   * tab, a manual token) would otherwise leave the guard with no fetch to
   * resolve it.
   *
   * The `!error` gate alone was NOT enough to make this "retry once, not
   * forever": it only holds when a bad /me sets `error`. A 2xx whose body has no
   * `access` left error null and access null, which is precisely this effect's
   * trigger — so it re-fetched as fast as the network allowed (~80 req/s,
   * measured) and the panel sat on its spinner. refresh() now reports that case
   * as an error, and this ref bounds the retry to one attempt per token so no
   * future response shape can turn the guard into a request loop again.
   */
  const attemptedForToken = useRef<string | null>(null);
  useEffect(() => {
    if (!adminToken) {
      attemptedForToken.current = null;
      return;
    }
    if (isLoading || access || error) return;
    if (attemptedForToken.current === adminToken) return;
    attemptedForToken.current = adminToken;
    void refresh();
  }, [adminToken, isLoading, access, error, refresh]);

  if (!adminToken) {
    // Redirect to admin login if not authenticated.
    // Absolute "/login" would land on the vendor login page; AdminApp is
    // mounted at /admin/*, so the admin login lives at /admin/login.
    return <Navigate to="/admin/login" replace />;
  }

  // /me failed for a reason that isn't "signed out" — the API or its database is
  // down. Say so instead of spinning: `access` will never arrive on its own.
  if (error && !access) {
    return <AccessUnavailable message={error} onRetry={() => void refresh()} />;
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
