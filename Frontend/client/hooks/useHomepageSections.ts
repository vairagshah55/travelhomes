import { useQuery } from "@tanstack/react-query";
import { cmsPublicApi } from "@/lib/api";

/**
 * Shared cache for the public homepage-sections list.
 *
 * 8 different pages/components call cmsPublicApi.listHomepageSections —
 * Index, AddOfferings, AirbnbHeader, SearchResults, ServiceSelection,
 * and the 3 onboarding flows. Each was a separate fetch on mount.
 *
 * One useQuery, one cache key shared across the SPA.
 */
export function useHomepageSections() {
  const query = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: () => cmsPublicApi.listHomepageSections(),
    staleTime: 5 * 60_000,
  });
  return query;
}
