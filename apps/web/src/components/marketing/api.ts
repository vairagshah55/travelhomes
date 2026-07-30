import { useQuery } from "@tanstack/react-query";
import {
  API_BASE_URL,
  marketingApi,
  offersApi,
  type MarketingContentDTO,
  type OfferDTO,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/* Query keys are declared here rather than inline in each page so the Marketing
   overview and the Offers page share one cache entry — moving between the two
   is instant and the offer counts on the overview can't disagree with the table
   that produced them. */
export const marketingPostsKey = ["marketing", "posts"] as const;
export const myOffersKey = ["offers", "mine"] as const;

/** `/api/offers` caps `limit` at 100 (offers.dto.js). */
export const MY_OFFERS_LIMIT = 100;

export function useMarketingPosts() {
  return useQuery<MarketingContentDTO[]>({
    queryKey: marketingPostsKey,
    queryFn: () => marketingApi.list(),
    staleTime: 30_000,
  });
}

export interface MyOffers {
  items: OfferDTO[];
  /** Server-side total — larger than `items.length` once past the 100 cap. */
  total: number;
}

/**
 * Every offer this vendor owns, in one request. `mine=true` with no `status`
 * returns all states (the tabbed page used to fire one request per tab, which
 * meant no tab could show a count for any other tab — and statuses outside the
 * three tabs, e.g. `deactivated`, were unreachable).
 */
export function useMyOffers() {
  const { token } = useAuth();
  return useQuery<MyOffers>({
    queryKey: myOffersKey,
    queryFn: async () => {
      const res = (await offersApi.list(undefined, token ?? undefined, {
        mine: true,
        limit: MY_OFFERS_LIMIT,
      })) as { data?: OfferDTO[]; count?: number; pagination?: { total?: number } };
      const items = Array.isArray(res?.data) ? res.data : [];
      return { items, total: res?.pagination?.total ?? res?.count ?? items.length };
    },
    staleTime: 30_000,
  });
}

/** Uploads come back as `/uploads/…`; anything already absolute is left alone. */
export function mediaUrl(src?: string): string {
  if (!src) return "";
  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return src;
  return `${API_BASE_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

export const formatPostDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/** "2h ago" / "Yesterday" / a date — the feed reads better than raw timestamps. */
export const relativeDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)}h ago`;
  if (mins < 48 * 60) return "Yesterday";
  return formatPostDate(iso);
};

export const inr = (n: number | string | undefined | null) => {
  const value = typeof n === "string" ? Number(n) : n;
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};
