import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi, vendorAuthApi, userProfileApi } from "../lib/api";
import { fetchProfile, refetchProfile, invalidateProfile } from "../hooks/useProfile";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: "user" | "vendor";
  vendorStatus?:
    | "pending"
    | "approved"
    | "rejected"
    | "active"
    | "inactive"
    | "banned"
    | "kyc-unverified";
  photo?: string;
  phoneNumber?: string;
  state?: string;
  city?: string;
  idProof?: string;
  dateOfBirth?: string;
  mobileVerified?: boolean;
  emailVerified?: boolean;
  // Legacy field aliases — pages and product detail components still
  // read user.name (display name) / user.avatar (photo) / user.phone
  // (phoneNumber). They're optional and surfaced wherever the legacy
  // call sites need them.
  name?: string;
  avatar?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
    userType?: "user" | "vendor",
  ) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  handleGoogleCallback: (code: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  register: (
    data: RegisterData,
  ) => Promise<{ ok: boolean; registerId?: string; code?: number; message?: string }>;
  verifyOTP: (otp: string) => Promise<boolean>;
  completeOnboarding: () => void;
  updateUserType: (userType: "user" | "vendor") => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  /** @param force bypass the shared profile cache (used by the tab-focus listener). */
  refreshUser: (force?: boolean) => Promise<void>;
  lastRegisterId?: string | null;
  authenticateAfterRegister: (u: {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    userType?: "user" | "vendor";
  }) => void;
}

interface RegisterData {
  userType: "user" | "vendor";
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  state: string;
  city: string;
  email: string;
  mobile: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials for testing
// const DEMO_CREDENTIALS = {
//   email: 'demo@travel.com',
//   password: 'demo123',
//   otp: '22222'
// };

// const DEMO_USER: User = {
//   id: '1',
//   email: 'demo@travel.com',
//   firstName: 'Demo',
//   lastName: 'User',
//   userType: 'user'
// };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // AuthProvider is mounted inside QueryClientProvider (see App.tsx), so the
  // shared profile cache is reachable from here.
  const queryClient = useQueryClient();

  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored =
        localStorage.getItem("travel_auth_user") || sessionStorage.getItem("travel_auth_user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (parsed && !parsed.id && parsed._id) {
        parsed.id = parsed._id;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("travel_auth_token") || sessionStorage.getItem("travel_auth_token");
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const local =
      !!localStorage.getItem("travel_auth_user") && !!localStorage.getItem("travel_auth_token");
    const session =
      !!sessionStorage.getItem("travel_auth_user") && !!sessionStorage.getItem("travel_auth_token");
    return local || session;
  });

  const [needsOnboarding, setNeedsOnboarding] = useState(() => {
    const localUser = localStorage.getItem("travel_auth_user");
    const sessionUser = sessionStorage.getItem("travel_auth_user");

    if (!localUser && !sessionUser) return false;

    if (localUser) {
      return localStorage.getItem("travel_onboarding_complete") !== "true";
    } else {
      return sessionStorage.getItem("travel_onboarding_complete") !== "true";
    }
  });

  const [lastRegisterId, setLastRegisterId] = useState<string | null>(() =>
    sessionStorage.getItem("reg_register_id"),
  );
  const lastUserTypeUpdateAt = React.useRef<number>(0);

  // Clean up invalid/fake tokens on mount
  useEffect(() => {
    const storedToken =
      localStorage.getItem("travel_auth_token") || sessionStorage.getItem("travel_auth_token");
    if (storedToken && !storedToken.includes(".")) {
      // Valid JWTs always have 3 dot-separated parts (header.payload.signature)
      // Fake tokens like "dev_token_..." or "demo_token_..." have no dots
      console.warn("Invalid token detected, clearing auth state");
      localStorage.removeItem("travel_auth_user");
      localStorage.removeItem("travel_auth_token");
      localStorage.removeItem("travel_onboarding_complete");
      sessionStorage.removeItem("travel_auth_user");
      sessionStorage.removeItem("travel_auth_token");
      sessionStorage.removeItem("travel_onboarding_complete");
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Auto-refresh user profile when tab regains focus (picks up admin approval, etc.)
  const refreshUserRef = React.useRef<(force?: boolean) => Promise<void>>();

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isAuthenticated && user?.email) {
        // force: the point of this listener is to catch changes made while
        // the tab was in the background, so it must not read from cache.
        refreshUserRef.current?.(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isAuthenticated, user?.email]);

  /**
   * Refresh the profile once per signed-in session, to pick up changes an admin
   * made while the user was away (vendor approval being the one that matters).
   *
   * The dependency array was `[]`, which reads `isAuthenticated` from the FIRST
   * render only. That's fine when the page loads with credentials already in
   * storage, but not when the session begins *during* this mount — the Google
   * redirect lands on /oauth-redirect unauthenticated, then authenticates a
   * moment later. The condition was false at first render, the effect never
   * re-ran, and the refresh simply never happened for that whole session. So a
   * Google sign-in that dropped `vendorStatus` (see authenticateAfterRegister)
   * had nothing to repair it, and the profile menu stayed wrong until the user
   * happened to switch tabs and trigger the visibilitychange listener above.
   *
   * Depending on the auth state fixes that; the ref keeps it to once per
   * session rather than once per email change.
   */
  const didInitialRefresh = React.useRef(false);
  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      // Signed out — re-arm so the next sign-in refreshes again.
      didInitialRefresh.current = false;
      return;
    }
    if (didInitialRefresh.current) return;
    didInitialRefresh.current = true;
    // Small delay to let the app render first, then refresh in background.
    const t = setTimeout(() => refreshUserRef.current?.(), 500);
    return () => clearTimeout(t);
  }, [isAuthenticated, user?.email]);

  const login = useCallback(async (
    email: string,
    password: string,
    rememberMe: boolean = true,
    _userType?: "user" | "vendor",
  ): Promise<boolean> => {
    // if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
    //   const loggedInUser = { ...DEMO_USER, userType: userType || 'user' as 'user' | 'vendor' };
    //   setUser(loggedInUser);
    //   setIsAuthenticated(true);
    //   setNeedsOnboarding(false);
    //   const storage = rememberMe ? localStorage : sessionStorage;
    //   storage.setItem('travel_auth_user', JSON.stringify(loggedInUser));
    //   storage.setItem('travel_onboarding_complete', 'true');
    //   storage.setItem('travel_auth_token', 'demo_token_' + Date.now());
    //   try { storage.setItem('last_login_userType', JSON.stringify(loggedInUser.userType)); } catch {}
    //   return true;
    // }

    const tryOnce = async (t: "user" | "vendor") => {
      try {
        const resp = await vendorAuthApi.login({
          email,
          password,
          userType: t,
          remember: rememberMe,
        });
        return { ok: !!resp?.success, resp } as const;
      } catch (e: any) {
        const msg = String(e?.message || "");
        const m = msg.match(/^HTTP\s+(\d+)/);
        const code = m ? Number(m[1]) : undefined;
        return { ok: false, code } as const;
      }
    };

    const r = await tryOnce("user");
    if (r.ok && r.resp) {
      const u = r.resp.user;
      const loggedInUser: User = {
        id: u.id || (u as any)._id,
        email: u.email,
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        userType: (u.userType as any)?.toLowerCase() as "user" | "vendor",
        vendorStatus: (u as any).vendorStatus,
        photo: u.photo,
        phoneNumber: u.phoneNumber || u.mobile,
        state: u.state,
        city: u.city,
        idProof: u.idProof,
        dateOfBirth: u.dateOfBirth,
      };
      setUser(loggedInUser);
      setIsAuthenticated(true);
      setNeedsOnboarding(false);

      const storage = rememberMe ? localStorage : sessionStorage;
      // Clear other storage
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem("travel_auth_user");
      otherStorage.removeItem("travel_onboarding_complete");
      otherStorage.removeItem("travel_auth_token");
      otherStorage.removeItem("last_login_userType");

      storage.setItem("travel_auth_user", JSON.stringify(loggedInUser));
      storage.setItem("travel_onboarding_complete", "true");
      storage.setItem("travel_auth_token", r.resp.token);
      setToken(r.resp.token);
      try {
        storage.setItem("last_login_userType", JSON.stringify(u.userType));
      } catch {}
      return true;
    }

    return false;
  }, []);

  // const loginWithGoogle = async (): Promise<boolean> => {
  //   try {
  //     // Redirect to Google OAuth
  //     const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ;
  //     const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  //     const scope = 'openid email profile';
  //     const responseType = 'code';

  //     const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  //       `client_id=${encodeURIComponent(clientId)}&` +
  //       `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  //       `scope=${encodeURIComponent(scope)}&` +
  //       `response_type=${responseType}&` +
  //       `access_type=offline&` +
  //       `prompt=consent`;

  //     // Store current location for redirect after auth
  //     sessionStorage.setItem('auth_redirect', window.location.pathname);

  //     // Redirect to Google OAuth
  //     window.location.href = authUrl;
  //     return true; // This won't execute due to redirect
  //   } catch (error) {
  //     console.error('Google OAuth error:', error);
  //     return false;
  //   }
  // };

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      // Store current location for redirect after auth
      sessionStorage.setItem("auth_redirect", window.location.pathname);

      // Redirect to backend (relative path handles proxy in dev and same-origin in prod)
      window.location.href = `/api/auth/google`;
      return true;
    } catch (error) {
      console.error("Google OAuth error:", error);
      return false;
    }
  }, []);

  const handleGoogleCallback = useCallback(async (
    code: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      // Exchange authorization code for tokens
      const response = await authApi.googleAuth(code);

      if (response.success && response.user) {
        const user = response.user;
        const loggedInUser = {
          id: user.id || user._id,
          email: user.email,
          firstName:
            user.firstName || user.name?.split(" ")[0] || user.fullname?.split(" ")[0] || "",
          lastName:
            user.lastName ||
            user.name?.split(" ").slice(1).join(" ") ||
            user.fullname?.split(" ").slice(1).join(" ") ||
            "",
          userType: (user.userType as any)?.toLowerCase() as "user" | "vendor",
          vendorStatus: (user as any).vendorStatus,
        };

        setUser(loggedInUser);
        setIsAuthenticated(true);
        setNeedsOnboarding(false);
        localStorage.setItem("travel_auth_user", JSON.stringify(loggedInUser));
        localStorage.setItem("travel_onboarding_complete", "true");
        localStorage.setItem("travel_auth_token", response.token);
        setToken(response.token);

        return { success: true };
      }
      return { success: false, message: "Invalid response from server" };
    } catch (error: any) {
      console.error("Google callback error:", error);
      return { success: false, message: error.message || "Google login failed" };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setNeedsOnboarding(false);
    localStorage.removeItem("travel_auth_user");
    localStorage.removeItem("travel_onboarding_complete");
    localStorage.removeItem("travel_auth_token");

    sessionStorage.removeItem("travel_auth_user");
    sessionStorage.removeItem("travel_onboarding_complete");
    sessionStorage.removeItem("travel_auth_token");
    setToken(null);
  }, []);

  const register = useCallback(async (
    data: RegisterData,
  ): Promise<{ ok: boolean; registerId?: string; code?: number; message?: string }> => {
    try {
      const res = await authApi.register({
        userType: data.userType,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        country: data.country,
        state: data.state,
        city: data.city,
        email: data.email,
        mobile: data.mobile,
        password: data.password,
      } as any);
      const regId = (res as any).registerId as string;
      if (regId) sessionStorage.setItem("reg_register_id", regId);
      setLastRegisterId(regId || null);
      return { ok: true, registerId: regId };
    } catch (e: any) {
      const msg = String(e?.message || "");
      const m = msg.match(/^HTTP\s+(\d+)/);
      const code = m ? Number(m[1]) : undefined;
      console.log(`Code otp-- ${code}: ${msg}`);
      return { ok: false, code, message: msg };
    }
  }, []);

  const verifyOTP = useCallback(async (otp: string): Promise<boolean> => {
    try {
      if (!lastRegisterId) return false;
      const resp = await authApi.verifyRegisterOtp(lastRegisterId, otp);
      return !!resp.success;
    } catch {
      return false;
    }
  }, [lastRegisterId]);

  // const authenticateAfterRegister = (u: Partial<User> & { email: string }) => {
  //   const newUser: User = {
  //     id: u.id || 'reg',
  //     email: u.email,
  //     firstName: u.firstName || '',
  //     lastName: u.lastName || '',
  //     userType: ((u.userType as any)?.toLowerCase() as 'user' | 'vendor') || 'user',
  //     photo: u.photo,
  //     phoneNumber: u.phoneNumber,
  //     state: u.state,
  //     city: u.city,
  //     idProof: u.idProof,
  //     dateOfBirth: u.dateOfBirth,
  //   };
  //   setUser(newUser);
  //   setIsAuthenticated(true);
  //   setNeedsOnboarding(false);
  //   localStorage.setItem('travel_auth_user', JSON.stringify(newUser));
  //   localStorage.setItem('travel_onboarding_complete', 'true');
  // };
  const authenticateAfterRegister = useCallback((u: Partial<User> & { email: string }) => {
    /**
     * Spread `u` first, then normalise — do NOT rebuild from a field whitelist.
     *
     * This used to list the fields to keep, and `vendorStatus` wasn't on the
     * list. Both Google sign-in paths pass it in (see OAuthRedirect and
     * AuthCallback, which read `userData.vendorStatus` straight off the auth
     * response), so an approved vendor who signed in with Google landed with
     * `vendorStatus: undefined` — and every `vendorStatus === "approved"` gate
     * in the UI, including "Switch to Vendor" in the profile menu, stayed
     * hidden. `mobileVerified` / `emailVerified` were dropped the same way.
     */
    const newUser: User = {
      ...(u as User),
      id: u.id || "reg",
      email: u.email,
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      userType: ((u.userType as any)?.toLowerCase() as "user" | "vendor") || "user",
    };

    // Update state
    setUser(newUser);
    setIsAuthenticated(true);
    setNeedsOnboarding(false);

    const storedToken =
      localStorage.getItem("travel_auth_token") || sessionStorage.getItem("travel_auth_token");
    if (storedToken) {
      setToken(storedToken);
    }

    // Store in localStorage
    localStorage.setItem("travel_auth_user", JSON.stringify(newUser));
    localStorage.setItem("travel_onboarding_complete", "true");

    // Also store token if available (token should already be stored)
    console.log("User authenticated successfully:", newUser);
    console.log("isAuthenticated set to:", true);
  }, []);

  const completeOnboarding = useCallback(() => {
    setNeedsOnboarding(false);
    if (localStorage.getItem("travel_auth_user")) {
      localStorage.setItem("travel_onboarding_complete", "true");
    } else {
      sessionStorage.setItem("travel_onboarding_complete", "true");
    }
  }, []);

  const updateUserType = useCallback(async (userType: "user" | "vendor") => {
    if (user) {
      const updatedUser = { ...user, userType };
      setUser(updatedUser);
      setNeedsOnboarding(false);
      lastUserTypeUpdateAt.current = Date.now();

      const storage = localStorage.getItem("travel_auth_user") ? localStorage : sessionStorage;
      storage.setItem("travel_auth_user", JSON.stringify(updatedUser));
      storage.setItem("travel_onboarding_complete", "true");

      // Also try to update on server so it persists
      try {
        await userProfileApi.upsert({ email: user.email, userType });
        // The write changed the stored profile; drop the shared entry so the
        // next reader sees the new userType instead of the cached one.
        invalidateProfile(queryClient, user.email);
      } catch (error) {
        console.error("Failed to update userType on server:", error);
      }
    }
  }, [user, queryClient]);

  const updateUser = useCallback((data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      if (localStorage.getItem("travel_auth_user")) {
        localStorage.setItem("travel_auth_user", JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem("travel_auth_user", JSON.stringify(updatedUser));
      }
    }
  }, [user]);

  /**
   * Re-read the profile and fold any server-side changes into `user`.
   *
   * @param force  bypass the shared profile cache. The tab-focus listener
   *   passes `true` — its whole purpose is to notice a change that happened
   *   while the tab was in the background. The mount-time call leaves it false
   *   so it dedupes against whatever the mounted page already fetched, instead
   *   of issuing a second identical request 500ms later.
   *
   * This used to be a raw `fetch` with no cache at all, which is why one page
   * load produced three identical `/api/profile` requests.
   */
  const refreshUser = useCallback(
    async (force = false) => {
      if (!user?.email) return;
      try {
        const p = force
          ? await refetchProfile(queryClient, user.email)
          : await fetchProfile(queryClient, user.email);

        if (p) {
          // If we recently updated userType locally, don't let the server overwrite it
          // until enough time has passed for the server to have the updated value
          const isRecentlyUpdated = Date.now() - lastUserTypeUpdateAt.current < 10000; // 10 seconds
          let effectiveUserType = isRecentlyUpdated
            ? user.userType
            : (p as any).userType || user.userType;

          // Auto-promote to vendor if admin has approved
          const vs = (p as any).vendorStatus;
          if ((vs === "approved" || vs === "active") && effectiveUserType !== "vendor") {
            effectiveUserType = "vendor";
          }

          // Use `??` (not `||`) and fall back to the existing value for every
          // field. The API sometimes omits fields like `photo` from refetches —
          // without these fallbacks each background refresh would overwrite
          // them with `undefined`, then the next refresh might restore them,
          // causing the avatar / verification badges / phone number to flicker
          // (a visible "blink" across the whole user-profile sidebar).
          const updatedUser: User = {
            ...user,
            firstName: p.firstName ?? user.firstName,
            lastName: p.lastName ?? user.lastName,
            userType: effectiveUserType,
            vendorStatus: (p as any).vendorStatus ?? user.vendorStatus,
            photo: p.photo ?? user.photo,
            phoneNumber: p.phoneNumber ?? user.phoneNumber,
            mobileVerified: p.mobileVerified ?? user.mobileVerified,
            emailVerified: p.emailVerified ?? user.emailVerified,
            state: p.state ?? user.state,
            city: p.city ?? user.city,
            idProof: p.idProof ?? user.idProof,
            dateOfBirth: p.dateOfBirth ?? user.dateOfBirth,
          };

          // Skip the setUser when the refetch returned identical values. Without
          // this guard, the 500ms-after-mount and visibility-change refreshes
          // build a new object reference every time and force every context
          // consumer to repaint — causing a visible "jerk" on pages like
          // UserProfile that key visuals (avatar, name) off `user`.
          const hasChanged = (Object.keys(updatedUser) as (keyof User)[]).some(
            (k) => updatedUser[k] !== user[k],
          );
          if (!hasChanged) return;

          setUser(updatedUser);
          if (localStorage.getItem("travel_auth_user")) {
            localStorage.setItem("travel_auth_user", JSON.stringify(updatedUser));
          } else {
            sessionStorage.setItem("travel_auth_user", JSON.stringify(updatedUser));
          }
        }
      } catch (error) {
        console.error("Failed to refresh user profile:", error);
      }
    },
    [user, queryClient],
  );

  // Keep the ref in sync so the visibilitychange listener always calls the
  // latest version. In an effect, not the render body — assigning to a ref
  // during render is a side effect, which React 18's concurrent renderer is
  // allowed to run more than once or throw away.
  useEffect(() => {
    refreshUserRef.current = refreshUser;
  }, [refreshUser]);

  /**
   * Memoised provider value.
   *
   * AuthProvider wraps the entire router, so this object's identity is what
   * decides whether every `useAuth()` consumer in the app re-renders. As a bare
   * object literal it was a new identity on every render — and the provider
   * re-renders on the 500ms-after-mount refresh and on every tab focus, so a
   * simple tab switch pushed a fresh context value to the whole tree. (The
   * `hasChanged` guard inside refreshUser was fighting the same symptom from
   * the other end.)
   */
  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      needsOnboarding,
      login,
      loginWithGoogle,
      handleGoogleCallback,
      logout,
      register,
      verifyOTP,
      completeOnboarding,
      updateUserType,
      updateUser,
      refreshUser,
      lastRegisterId,
      authenticateAfterRegister,
    }),
    [
      user,
      token,
      isAuthenticated,
      needsOnboarding,
      lastRegisterId,
      login,
      loginWithGoogle,
      handleGoogleCallback,
      logout,
      register,
      verifyOTP,
      completeOnboarding,
      updateUserType,
      updateUser,
      refreshUser,
      authenticateAfterRegister,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// export { DEMO_CREDENTIALS };
