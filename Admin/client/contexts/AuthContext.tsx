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

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  /** True while we're checking the stored token + fetching /me on first mount. */
  isLoading: boolean;
  /** Clear the adminToken from both storages and the in-memory user. */
  logout: () => void;
  /** Re-fetch the current admin from /me. Useful after profile updates. */
  refresh: () => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    if (!readAdminToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const resp = await adminAuthService.getMe();
      setUser(toUser(resp?.admin));
    } catch {
      // The api response interceptor already clears the token + redirects on
      // 401. For other failures (network / 5xx), we keep the existing user
      // (likely null) and stop loading; the next page-level fetch will
      // surface a clearer error.
      setUser(null);
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
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        refresh,
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
