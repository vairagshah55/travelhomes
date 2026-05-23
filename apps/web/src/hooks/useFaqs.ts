import { useQuery } from "@tanstack/react-query";
import { cmsPublicApi, type PublicFaq } from "@/lib/api";

/**
 * Shared cache for the public FAQ list. Used by Index, Help, and
 * Hostwithus — they each had their own useQuery with subtly different
 * keys ("faqs" vs "cms.faqs.public"), which fragmented the cache.
 *
 * Single key, 10-minute stale time matching Index's previous setting
 * (FAQs change rarely).
 */
export function useFaqs() {
  return useQuery<PublicFaq[]>({
    queryKey: ["faqs"],
    queryFn: async () => {
      try {
        return (await cmsPublicApi.listFaqs()) || [];
      } catch (err) {
        console.error("Failed to fetch FAQs", err);
        return [];
      }
    },
    staleTime: 10 * 60_000,
  });
}
