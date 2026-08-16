import { useQuery, type QueryClient } from "@tanstack/react-query";

import { getOnboardingData } from "@/lib/api";

/**
 * The vendor's current onboarding submission — `GET /api/onboarding/mine`.
 *
 * Shared cache entry, because five places want this answer: ServiceSelection
 * (twice, in two separate effects) and the three wizard draft loaders. Each was
 * its own uncached `fetch`, so landing on the flow could hit the endpoint
 * several times over.
 *
 * `getOnboardingData` swallows its own errors and resolves to null, so a failed
 * request is indistinguishable from "no submission" — the query only rejects if
 * something truly unexpected happens.
 */

export interface OnboardingSubmission {
  /** "activity" | "caravan" | "stay" */
  type: string;
  doc: {
    _id?: string;
    status?: string;
    createdAt?: string;
    [key: string]: any;
  };
}

export const onboardingStatusKey = ["onboarding", "mine"] as const;

export function onboardingStatusQueryOptions(enabled = true) {
  return {
    queryKey: onboardingStatusKey,
    queryFn: async (): Promise<OnboardingSubmission | null> =>
      (await getOnboardingData()) ?? null,
    enabled,
    /**
     * Always revalidate on mount.
     *
     * This backs an authorisation gate — "you already have something in
     * review, so the other services are locked". Serving it from cache would
     * mean a vendor who just submitted, or who was just approved, sees the
     * previous answer and can act on it. The duplicate-request problem this
     * hook solves was two uncached fetches *within one page*; that's fixed by
     * having a single subscriber, not by holding the answer across visits.
     */
    staleTime: 0,
  };
}

export function useOnboardingStatus(enabled = true) {
  return useQuery(onboardingStatusQueryOptions(enabled));
}

/** Re-read after a submit, so the flow immediately reflects the new state. */
export function invalidateOnboardingStatus(qc: QueryClient) {
  return qc.invalidateQueries({ queryKey: onboardingStatusKey });
}
