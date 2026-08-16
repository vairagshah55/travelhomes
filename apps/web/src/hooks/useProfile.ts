import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { userProfileApi, type UserProfileDTO } from "@/lib/api";

/**
 * The single source of truth for `GET /api/profile?email=…`.
 *
 * Four independent call sites used to fetch this endpoint, and only one of them
 * went through React Query — so a single page load issued the same request
 * three times:
 *
 *   - useUserDetails            (React Query, its own key: "userDetails")
 *   - AuthContext.refreshUser   (raw fetch, no cache, re-fired on every tab focus)
 *   - pages/Profile             (raw fetch in useEffect)
 *   - pages/UserProfileEdit     (raw fetch in useEffect)
 *
 * They now share one cache entry. Anything that needs the profile should use
 * `useProfile` in components, or `fetchProfile` / `refetchProfile` outside them.
 */

export const profileKey = (email?: string | null) => ["profile", email ?? ""] as const;

/**
 * 60s. Long enough that the mount-time burst (page fetch + AuthContext's
 * 500ms-after-mount refresh) collapses into one request; short enough that
 * `refreshUser`'s job — noticing that an admin approved this vendor — still
 * happens promptly. Tab-focus refreshes bypass it entirely; see refetchProfile.
 */
export const PROFILE_STALE_MS = 60_000;

export function profileQueryOptions(email?: string | null) {
  return {
    queryKey: profileKey(email),
    queryFn: async (): Promise<UserProfileDTO | null> => {
      if (!email) return null;
      const res = await userProfileApi.get(email);
      return res?.success && res.data ? res.data : null;
    },
    enabled: !!email,
    staleTime: PROFILE_STALE_MS,
  };
}

/** Subscribe to the shared profile entry from a component. */
export function useProfile(email?: string | null) {
  return useQuery(profileQueryOptions(email));
}

/** The statuses that mean "this account may act as a vendor". */
const APPROVED_VENDOR_STATUSES = new Set(["approved", "active"]);

/**
 * Whether the signed-in account is an approved vendor — the gate behind
 * "Switch to Vendor".
 *
 * Reads the server's answer through the shared profile cache rather than the
 * `user.vendorStatus` snapshot in localStorage. That snapshot is written at
 * login and only corrected if `refreshUser` happens to run, so it goes stale
 * the moment an admin approves someone mid-session — and any sign-in path that
 * fails to map the field leaves it permanently undefined. Both produced the
 * same bug: an approved vendor with no way to reach their dashboard.
 *
 * The persisted value is still used as the fallback so the item doesn't
 * disappear on a slow network or a failed request; the query only ever upgrades
 * the answer.
 */
export function useIsApprovedVendor(
  email?: string | null,
  fallbackVendorStatus?: string | null,
): boolean {
  const { data } = useProfile(email);
  const status = data?.vendorStatus ?? fallbackVendorStatus;
  return !!status && APPROVED_VENDOR_STATUSES.has(status);
}

/**
 * Read the profile outside a component, honouring the cache.
 * Returns the cached value when fresh, otherwise fetches once — concurrent
 * callers join the in-flight request rather than issuing their own.
 */
export function fetchProfile(qc: QueryClient, email: string) {
  return qc.fetchQuery(profileQueryOptions(email));
}

/**
 * Force a network read and update the shared cache.
 * For the explicit "something may have changed while you were away" refresh —
 * `staleTime: 0` makes this ignore the cache without invalidating it for
 * everyone else mid-flight.
 */
export function refetchProfile(qc: QueryClient, email: string) {
  return qc.fetchQuery({ ...profileQueryOptions(email), staleTime: 0 });
}

/** Seed the cache after a successful write, so no one refetches to see it. */
export function setProfileCache(qc: QueryClient, email: string, data: UserProfileDTO | null) {
  qc.setQueryData(profileKey(email), data);
}

/**
 * Drop the cached profile after a write whose response isn't the full profile
 * (photo upload, partial upsert).
 *
 * Every profile mutation MUST call this or `setProfileCache`. Before these
 * reads were cached, a save was immediately visible because the next mount
 * refetched; now a stale entry would keep showing the old values for up to
 * PROFILE_STALE_MS and the save would look like it did nothing.
 */
export function invalidateProfile(qc: QueryClient, email?: string | null) {
  return qc.invalidateQueries({ queryKey: profileKey(email) });
}
