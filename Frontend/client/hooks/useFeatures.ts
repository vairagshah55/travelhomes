import { useQuery } from "@tanstack/react-query";
import { cmsPublicApi } from "@/lib/api";

/**
 * Shared cache for cmsPublicApi.getFeatures(category, type).
 *
 * 4+ pages call getFeatures on mount — Index (3 parallel calls for the
 * three service-type categories), the 3 onboarding flows (one or two
 * calls each), with various combinations of category and type. Each
 * (category, type) pair gets its own cache entry, so Index calling
 * `getFeatures("Activity", "category")` warms the cache for
 * ActivityOnboarding's identical call.
 *
 * Features change rarely — 10min stale time matches the rest of the
 * CMS-public hooks.
 */
export function useFeatures(category: string, type?: string, opts?: { enabled?: boolean }) {
  return useQuery<any[]>({
    queryKey: ["features", category, type ?? null],
    enabled: opts?.enabled ?? true,
    queryFn: async () => {
      try {
        return (await cmsPublicApi.getFeatures(category, type)) || [];
      } catch (err) {
        console.error(`Failed to load features for ${category}/${type ?? ""}`, err);
        return [];
      }
    },
    staleTime: 10 * 60_000,
  });
}
