/**
 * Admin auth context — backed by the real adminToken + /api/admin/auth/me.
 *
 * Replaces a previous demo stub that simulated login with hardcoded
 * `demo@travel.com / demo123` credentials. Real admin login lives in
 * `pages/AdminLogin.tsx` which posts to `/api/admin/auth/login` and stores
 * the JWT under the `adminToken` localStorage / sessionStorage key.
 *
 * Responsibilities:
 *   - On mount, read `adminToken` from storage; if present, fetch the
 *     authenticated admin via /me.
 *   - Expose `user`, `isAuthenticated`, `isLoading`, and a real `logout()`
 *     that clears both storages and the in-memory state.
 *
 * The `firstName` / `lastName` fields are derived from the server's `name`
 * field so existing consumers (`ProfileDropdown.tsx`) keep working without
 * changes.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { adminAuthService } from "@/services/api";

interface AdminUser {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role?: string;
  status?: string;
  joinDate?: string;
  lastLogin?: string;
}

/** Fine-grained permission row as stored on the role. */
export interface AccessPermission {
  feature: string;
  canView?: boolean;
  canEdit?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

/**
 * What /me reports the signed-in admin may do. `features: "*"` marks a
 * superadmin, who bypasses every check server-side too.
 */
export interface AdminAccess {
  superadmin: boolean;
  roleName: string | null;
  features: string[] | "*";
  permissions: AccessPermission[];
}

export type AccessAction = "view" | "edit" | "create" | "delete";

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  /** True while we're checking the stored token + fetching /me on first mount. */
  isLoading: boolean;
  /** Clear the adminToken from both storages and the in-memory user. */
  logout: () => void;
  /** Re-fetch the current admin from /me. Useful after profile updates. */
  refresh: () => Promise<void>;
  /** The role's resolved feature grants, or null until /me has answered. */
  access: AdminAccess | null;
  /**
   * Why /me failed, when it failed for a reason that isn't "not signed in" —
   * server down, database unreachable, network drop. Consumers must not treat a
   * null `access` as "still loading" without checking this, or a failed /me
   * shows an eternal spinner.
   */
  error: string | null;
  /**
   * Whether the admin may perform `action` on `feature`. Mirrors the server's
   * requireFeature check so the UI hides what the API would refuse — it is a
   * convenience, never the enforcement point.
   */
  can: (feature: string | string[], action?: AccessAction) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readAdminToken(): string | null {
  return localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
}

function clearAdminToken() {
  localStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminToken");
}

// Split "Alex Rivera" -> { firstName: "Alex", lastName: "Rivera" }.
// Single-word names map to firstName only.
function splitName(name: string | undefined): { firstName: string; lastName: string } {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

function toUser(adminPayload: Record<string, unknown> | null | undefined): AdminUser | null {
  if (!adminPayload || typeof adminPayload !== "object") return null;
  const a = adminPayload as Record<string, unknown>;
  const name = (a.name as string) ?? "";
  const { firstName, lastName } = splitName(name);
  return {
    email: (a.email as string) ?? "",
    name,
    firstName,
    lastName,
    role: a.role as string | undefined,
    status: a.status as string | undefined,
    joinDate: a.joinDate as string | undefined,
    lastLogin: a.lastLogin as string | undefined,
  };
}

const ACTION_FLAG: Record<AccessAction, keyof AccessPermission> = {
  view: "canView",
  edit: "canEdit",
  create: "canCreate",
  delete: "canDelete",
};

function toAccess(raw: unknown): AdminAccess | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  return {
    superadmin: !!a.superadmin,
    roleName: (a.roleName as string) ?? null,
    features: a.features === "*" ? "*" : Array.isArray(a.features) ? (a.features as string[]) : [],
    permissions: Array.isArray(a.permissions) ? (a.permissions as AccessPermission[]) : [],
  };
}

/**
 * Pull a human message out of whatever `services/api.ts` threw. Its interceptors
 * re-throw `error.response.data` (the server envelope) or a bare string for
 * transport failures, so neither is an Error and `err.message` alone is usually
 * undefined.
 */
function describeFailure(err: unknown): string {
  if (typeof err === "string" && err.trim()) {
    return /network|timeout/i.test(err)
      ? "Can't reach the server. Check that the API is running."
      : err;
  }
  const e = err as { error?: { code?: string; message?: string }; message?: string } | null;
  const code = e?.error?.code;
  if (code === "DATABASE_UNAVAILABLE") {
    return "The server can't reach its database. Check the API log for the reason, then retry.";
  }
  return (
    e?.error?.message || e?.message || "Couldn't load your account. The server may be unavailable."
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    if (!readAdminToken()) {
      setUser(null);
      setAccess(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const resp = await adminAuthService.getMe();
      const nextAccess = toAccess(resp?.access);
      setUser(toUser(resp?.admin));
      setAccess(nextAccess);
      // A 2xx that carries no permission set is NOT success. Treating it as one
      // set `error` to null while `access` stayed null, and AdminProtectedRoute's
      // self-heal effect re-fetches on exactly that combination — so the panel
      // hammered /me ~80x/second forever behind its loading spinner instead of
      // reporting anything. Seen in production when the deployed API predates
      // `access` being added to /me (d1632f2, 2026-07-27) while the frontend is
      // newer than the self-heal effect (7e79f1c, 2026-07-31).
      setError(
        nextAccess
          ? null
          : "Signed in, but the server did not return your permissions. The API may be running an older version than this panel.",
      );
    } catch (err) {
      // The api response interceptor already clears the token + redirects on
      // 401, so anything landing here is a transport or server failure. Record
      // WHY: a null `access` with no error is indistinguishable from "still
      // loading", which is what made a 500 from /me hang the whole panel on its
      // loading spinner.
      setUser(null);
      setAccess(null);
      setError(describeFailure(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    clearAdminToken();
    setUser(null);
    setAccess(null);
    setError(null);
  }, []);

  const can = useCallback(
    (feature: string | string[], action: AccessAction = "view") => {
      if (!access) return false;
      if (access.superadmin || access.features === "*") return true;

      const wanted = Array.isArray(feature) ? feature : [feature];
      const flag = ACTION_FLAG[action];

      return wanted.some((f) => {
        const row = access.permissions.find((p) => p.feature === f);
        // Same precedence as the server: a permissions row wins; a feature that
        // only appears in `features` counts as full access to that area.
        if (row) return row[flag] === true || (action === "view" && row.canView !== false);
        return Array.isArray(access.features) && access.features.includes(f);
      });
    },
    [access],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        refresh,
        access,
        error,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
