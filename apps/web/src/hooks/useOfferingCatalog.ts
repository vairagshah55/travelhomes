import { useMemo } from "react";
import { sortFeatureRows } from "@/lib/cmsFeatures";
import { useFeatures } from "./useFeatures";

const toNames = (data: any[] | undefined): string[] =>
  (data ?? []).filter((f) => f && f.status === "enable").map((f) => String(f.name));

/**
 * Single source of truth for the category + feature dropdown options used by
 * the Add Offering and Edit Offering pages. Pulls from the same CMS endpoint
 * the onboarding flows use (`useFeatures`) so create-via-onboarding and
 * edit-via-dashboard never drift apart.
 *
 * Camper-van vehicle types and amenities are CMS-driven too. Both are also
 * exposed as raw rows (`camperVanCategories` / `camperVanFeatures`), because
 * CaravanCategoryStep and CaravanFeaturesStep render each row's description and
 * uploaded icon rather than just its name. Everything CMS-backed means admins
 * can tune the available options without code changes.
 */
export function useOfferingCatalog() {
  const stayCatsQuery = useFeatures("Unique Stay", "category");
  const stayFeatsQuery = useFeatures("Unique Stay");
  const actCatsQuery = useFeatures("Activity", "category");
  const actFeatsQuery = useFeatures("Activity");
  const vanCatsQuery = useFeatures("Camper Van", "category");
  // No `type` filter — the endpoint would exclude legacy rows saved without one.
  const vanFeatsQuery = useFeatures("Camper Van");
  // Vehicle Rental joined the edit wizard once vehicle listings became
  // editable; the onboarding flow reads the same CMS service ("Vehicle Rental")
  // and splits the rows itself, so the two surfaces stay in step.
  const vehicleCatsQuery = useFeatures("Vehicle Rental", "category");
  const vehicleFeatsQuery = useFeatures("Vehicle Rental");

  const isLoading =
    stayCatsQuery.isLoading ||
    stayFeatsQuery.isLoading ||
    actCatsQuery.isLoading ||
    actFeatsQuery.isLoading ||
    vanCatsQuery.isLoading ||
    vanFeatsQuery.isLoading ||
    vehicleCatsQuery.isLoading ||
    vehicleFeatsQuery.isLoading;

  // `type` is absent on legacy feature rows, so treat "not a category" as a
  // feature rather than requiring type === "feature". Memoised: a fresh array
  // identity every render would defeat the memo below.
  const vanFeatureRows = useMemo(
    () =>
      sortFeatureRows(
        (vanFeatsQuery.data ?? []).filter(
          (f: any) => f?.status === "enable" && f?.type !== "category" && f?.type !== "subcategory",
        ),
      ),
    [vanFeatsQuery.data],
  );

  const vehicleFeatureRows = useMemo(
    () =>
      sortFeatureRows(
        (vehicleFeatsQuery.data ?? []).filter(
          (f: any) => f?.status === "enable" && f?.type !== "category" && f?.type !== "subcategory",
        ),
      ),
    [vehicleFeatsQuery.data],
  );

  return useMemo(
    () => ({
      isLoading,
      categories: {
        "unique-stay": toNames(stayCatsQuery.data),
        activity: toNames(actCatsQuery.data),
        "camper-van": toNames(sortFeatureRows(vanCatsQuery.data ?? [])),
        "vehicle-rental": toNames(sortFeatureRows(vehicleCatsQuery.data ?? [])),
      } as Record<string, string[]>,
      features: {
        "unique-stay": toNames(stayFeatsQuery.data),
        activity: toNames(actFeatsQuery.data),
        "camper-van": vanFeatureRows.map((f: any) => String(f.name)),
        "vehicle-rental": vehicleFeatureRows.map((f: any) => String(f.name)),
      } as Record<string, string[]>,
      /** Enabled Camper Van categories, unflattened — for CaravanCategoryStep. */
      camperVanCategories: sortFeatureRows(
        (vanCatsQuery.data ?? []).filter((f: any) => f?.status === "enable"),
      ),
      camperVanCategoriesLoading: vanCatsQuery.isLoading,
      /** Enabled Camper Van amenities, unflattened — for CaravanFeaturesStep. */
      camperVanFeatures: vanFeatureRows,
      camperVanFeaturesLoading: vanFeatsQuery.isLoading,
      /** Enabled Vehicle Rental categories, unflattened — for VehicleClassStep. */
      vehicleCategories: sortFeatureRows(
        (vehicleCatsQuery.data ?? []).filter((f: any) => f?.status === "enable"),
      ),
      vehicleCategoriesLoading: vehicleCatsQuery.isLoading,
      /** Enabled Vehicle Rental amenities, unflattened — for SpecsFeaturesStep. */
      vehicleFeatures: vehicleFeatureRows,
      vehicleFeaturesLoading: vehicleFeatsQuery.isLoading,
    }),
    [
      isLoading,
      stayCatsQuery.data,
      stayFeatsQuery.data,
      actCatsQuery.data,
      actFeatsQuery.data,
      vanCatsQuery.data,
      vanCatsQuery.isLoading,
      vanFeatureRows,
      vanFeatsQuery.isLoading,
      vehicleCatsQuery.data,
      vehicleCatsQuery.isLoading,
      vehicleFeatureRows,
      vehicleFeatsQuery.isLoading,
    ],
  );
}
