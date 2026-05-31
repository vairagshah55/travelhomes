import { useMemo } from "react";
import { useFeatures } from "./useFeatures";

const toNames = (data: any[] | undefined): string[] =>
  (data ?? []).filter((f) => f && f.status === "enable").map((f) => String(f.name));

/**
 * Single source of truth for the category + feature dropdown options used by
 * the Add Offering and Edit Offering pages. Pulls from the same CMS endpoint
 * the onboarding flows use (`useFeatures`) so create-via-onboarding and
 * edit-via-dashboard never drift apart.
 *
 * Camper-van categories + features come from the onboarding step components
 * themselves (CaravanCategoryStep, CaravanFeaturesStep) — no CMS feed needed
 * since those are hardcoded vehicle taxonomy. Stays and Activities are
 * CMS-driven so admins can tune the available options without code changes.
 */
export function useOfferingCatalog() {
  const stayCatsQuery = useFeatures("Unique Stay", "category");
  const stayFeatsQuery = useFeatures("Unique Stay");
  const actCatsQuery = useFeatures("Activity", "category");
  const actFeatsQuery = useFeatures("Activity");

  const isLoading =
    stayCatsQuery.isLoading ||
    stayFeatsQuery.isLoading ||
    actCatsQuery.isLoading ||
    actFeatsQuery.isLoading;

  return useMemo(
    () => ({
      isLoading,
      categories: {
        "unique-stay": toNames(stayCatsQuery.data),
        activity: toNames(actCatsQuery.data),
      } as Record<string, string[]>,
      features: {
        "unique-stay": toNames(stayFeatsQuery.data),
        activity: toNames(actFeatsQuery.data),
      } as Record<string, string[]>,
    }),
    [
      isLoading,
      stayCatsQuery.data,
      stayFeatsQuery.data,
      actCatsQuery.data,
      actFeatsQuery.data,
    ],
  );
}
