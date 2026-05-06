import { useQuery } from "@tanstack/react-query";

/**
 * Shared cache for /countries_states_cities.json — a static JSON asset
 * served from /public. It was previously fetched independently by 5+
 * pages (Register + 3 onboarding flows + Payment), each parsing a copy
 * of the same multi-MB file on every mount.
 *
 * With React Query the file is fetched at most once per page load and
 * shared across every consumer via the cache key.
 */
export function useCountriesData() {
  const { data = [] } = useQuery<any[]>({
    queryKey: ["static", "countries_states_cities"],
    queryFn: async () => {
      try {
        const r = await fetch("/countries_states_cities.json");
        if (!r.ok) return [];
        return await r.json();
      } catch {
        return [];
      }
    },
    staleTime: Infinity, // static asset
  });
  return data;
}
