import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Footer from "../components/Footer";
import MobileUserNav from "@/components/MobileUserNav";
import { offersApi, OfferDTO, API_BASE_URL, cmsPublicApi, PublicFaq } from "@/lib/api";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useFaqs } from "@/hooks/useFaqs";
import { testimonialsApi, PublicTestimonial } from "@/lib/testimonials";
import { useAuth } from "../contexts/AuthContext";
import Section from "@/components/Section";
import ResultCard from "@/components/ResultCard";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/home/skeletons";

import { HeroSection } from "@/components/home/HeroSection";
import { OfferSections } from "@/components/home/OfferSections";
import { TrendingDestinations } from "@/components/home/TrendingDestinations";
import { ServiceListingBanner } from "@/components/home/ServiceListingBanner";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { LatestArticles } from "@/components/home/LatestArticles";
import { FAQSection } from "@/components/home/FAQSection";

type FilterType = "camper-van" | "unique-stays" | "activity" | "vehicle-rental";

type BlogDTO = {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string;
  createdAt?: string;
};
type CardItem = {
  id: string;
  title: string;
  details: string;
  price: string;
  Maxprice?: string | number;
  unit: string;
  image: string;
  images?: string[];
};

const DEFAULT_TESTIMONIALS: PublicTestimonial[] = [
  {
    id: "t1",
    userName: "Aarav Mehta",
    rating: 5,
    content:
      "An amazing experience! The booking process was seamless, and the support team was super helpful throughout.",
    email: "aarav.mehta@example.com",
    createdAt: "2025-10-12T09:24:00Z",
  },
  {
    id: "t2",
    userName: "Priya Sharma",
    rating: 4,
    content:
      "Really impressed with how easy it was to find what I needed. The platform feels modern and intuitive.",
    email: "priya.sharma@example.com",
    createdAt: "2025-09-28T14:45:00Z",
  },
  {
    id: "t3",
    userName: "Rahul Verma",
    rating: 5,
    content:
      "Exceptional service and great user experience. I found exactly what I was looking for within minutes!",
    email: "rahul.verma@example.com",
    createdAt: "2025-08-20T11:10:00Z",
  },
  {
    id: "t4",
    userName: "Neha Kapoor",
    rating: 5,
    content:
      "Loved the design and smooth navigation. It's rare to see a platform this well thought out!",
    email: "neha.kapoor@example.com",
    createdAt: "2025-07-05T18:20:00Z",
  },
  {
    id: "t5",
    userName: "Rohan Singh",
    rating: 4,
    content:
      "Great experience overall! Would definitely recommend this to anyone looking for reliable service.",
    email: "rohan.singh@example.com",
    createdAt: "2025-06-15T07:40:00Z",
  },
];

const SECTION_DEFAULTS: Record<string, boolean> = {
  "camper-van": true,
  "unique-stays": true,
  "best-activity": true,
  "vehicle-rental": true,
  "trending-destinations": true,
  testimonials: true,
  "top-rated-stays": true,
  faq: true,
};

const PAGE_SIZE = 12;

// Stable identities for the "still loading" case — see the note at their use.
const EMPTY_CATEGORY_MAP: Record<string, any> = Object.freeze({});
const EMPTY_OFFERS: OfferDTO[] = [];

export default function Index() {
  const { user } = useAuth();

  /* ── UI state ─────────────────────────────────────────────────────────────── */
  const [activeFilter, setActiveFilter] = useState<FilterType>("unique-stays");
  const [activeTab, setActiveTab] = useState("unique-stays");
  const [scrollHighlightFilter, setScrollHighlightFilter] = useState<FilterType | null>(null);
  const [heroHeight, setHeroHeight] = useState(500);
  const [pages, setPages] = useState({
    caravan: 1,
    "unique-stays": 1,
    activity: 1,
    "vehicle-rental": 1,
  });

  const heroSectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /* ── React Query — all data ───────────────────────────────────────────────── */
  // Shared hook so AddOfferings, ServiceSelection, SiteHeader,
  // SearchResults, and the 3 onboarding flows hit the same cache.
  const { data: sectionsData } = useHomepageSections();

  const { data: categoryMapData } = useQuery({
    queryKey: ["offer-categories"],
    queryFn: async () => {
      const [van, stay, act, vehicle] = await Promise.all([
        cmsPublicApi.getFeatures("Camper Van", "category"),
        cmsPublicApi.getFeatures("Unique Stays", "category"),
        cmsPublicApi.getFeatures("Activity", "category"),
        cmsPublicApi.getFeatures("Vehicle Rental", "category"),
      ]);
      const map: Record<string, any> = {};
      const add = (list: any[], type: string) => {
        if (Array.isArray(list))
          list.forEach((item) => {
            if (item.name) map[item.name.toLowerCase()] = type;
          });
      };
      add(van, "caravan");
      add(stay, "unique-stays");
      add(act, "activity");
      add(vehicle, "vehicle-rental");
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: offersResponse,
    isLoading: loadingOffers,
    isError: isOfferError,
  } = useQuery({
    queryKey: ["offers-approved"],
    queryFn: () => offersApi.list("approved"),
    staleTime: 2 * 60 * 1000,
  });

  const { data: faqsData, isPending: faqsLoading } = useFaqs();

  const { data: blogsData } = useQuery({
    queryKey: ["homepage-blogs"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE_URL}/api/blogs?status=published&limit=4`);
      if (!r.ok) return [];
      const j = (await r.json()) as { success: boolean; data: BlogDTO[] };
      return j.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: testimonialsData, refetch: refetchTestimonials } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const list = await testimonialsApi.list();
      return list?.length > 0 ? list : DEFAULT_TESTIMONIALS;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_TESTIMONIALS,
  });

  /* ── Derived data ─────────────────────────────────────────────────────────── */
  const homepageSections = useMemo<Record<string, boolean>>(() => {
    if (!Array.isArray(sectionsData) || !sectionsData.length) return SECTION_DEFAULTS;
    // Mutate the accumulator rather than spreading it — `{ ...acc }` per element
    // allocates a new object each step, which is O(n²) for no benefit here.
    const acc: Record<string, boolean> = { ...SECTION_DEFAULTS };
    for (const s of sectionsData as any[]) acc[s.sectionKey] = s.isVisible;
    return acc;
  }, [sectionsData]);

  // Frozen module-level fallbacks, not fresh `?? {}` / `?? []` literals.
  // A new object identity on every render silently invalidated every useMemo
  // below that lists them as a dependency — the memoisation looked correct but
  // never once hit while these queries were still loading.
  const categoryMap = categoryMapData ?? EMPTY_CATEGORY_MAP;
  const offers = offersResponse?.data ?? EMPTY_OFFERS;
  const faqs = (faqsData as PublicFaq[]) ?? [];
  const latestBlogs = (blogsData as BlogDTO[]) ?? [];
  const testimonials = testimonialsData ?? DEFAULT_TESTIMONIALS;
  const offerError = isOfferError ? "Failed to load offers" : null;

  /* ── Sync active filter/tab with visible sections ─────────────────────────── */
  useEffect(() => {
    const filterMap: Record<string, string> = {
      "camper-van": "camper-van",
      "unique-stays": "unique-stays",
      activity: "best-activity",
      "vehicle-rental": "vehicle-rental",
    };
    const tabMap: Record<string, string> = {
      "unique-stays": "unique-stays",
      activities: "best-activity",
      caravan: "camper-van",
    };
    if (homepageSections[filterMap[activeFilter]] === false) {
      const enabled = Object.keys(filterMap).find((f) => homepageSections[filterMap[f]]);
      if (enabled) setActiveFilter(enabled as FilterType);
    }
    if (homepageSections[tabMap[activeTab]] === false) {
      const enabled = Object.keys(tabMap).find((t) => homepageSections[tabMap[t]]);
      if (enabled) setActiveTab(enabled);
    }
  }, [homepageSections, activeFilter, activeTab]);

  /* ── Hero height measurement ──────────────────────────────────────────────── */
  useEffect(() => {
    const el = heroSectionRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeroHeight(heroSectionRef.current?.offsetHeight ?? 500));
    ro.observe(el);
    setHeroHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  /* ── Scroll-based filter highlight ───────────────────────────────────────── */
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const sectionMap: Record<string, FilterType> = {
      "camper-van": "camper-van",
      "unique-stays": "unique-stays",
      activity: "activity",
    };
    const observer = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio))
            best = entry;
        }
        if (best) {
          const id = (best.target as HTMLElement).dataset.sectionId;
          if (id && sectionMap[id]) setScrollHighlightFilter(sectionMap[id]);
        }
      },
      { rootMargin: "-96px 0px -50% 0px", threshold: [0, 0.25, 0.5] },
    );
    container.querySelectorAll("[data-section-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeFilter, loadingOffers]);

  /* ── Category normaliser ──────────────────────────────────────────────────── */
  // useCallback so the card memos below have a stable dependency; without it
  // every render produced a new function and re-ran the whole mapping.
  const getNormCategory = useCallback((cat?: string, serviceType?: string) => {
    const s = String(serviceType || "").toLowerCase();
    if (s === "camper-van") return "caravan" as const;
    if (s === "unique-stay" || s === "unique-stays") return "unique-stays" as const;
    if (s === "activity") return "activity" as const;
    if (s === "vehicle-rental") return "vehicle-rental" as const;
    const c = String(cat || "").toLowerCase();
    const cc = c.replace(/[\s_-]+/g, "");
    if (categoryMap[c]) return categoryMap[c];
    if (
      ["caravan", "campervan", "campertrailer", "motorhome", "rv", "van"].some((k) =>
        cc.includes(k),
      )
    )
      return "caravan" as const;
    if (
      cc.includes("stay") ||
      ["uniquestays", "unique", "stays", "glamping", "resort", "villa"].includes(cc)
    )
      return "unique-stays" as const;
    if (["activity", "activities", "trekking", "tour"].includes(cc)) return "activity" as const;
    return "unique-stays" as const;
  }, [categoryMap]);

  const mapOfferToCard = useCallback((o: OfferDTO): CardItem => {
    const ncat = getNormCategory(o.category, o.serviceType);
    const route =
      ncat === "caravan"
        ? `/campervan/${o._id}`
        : ncat === "unique-stays"
          ? `/unique-stay/${o._id}`
          : ncat === "vehicle-rental"
            ? `/vehicle/${o._id}`
            : `/activity/${o._id}`;
    const unit =
      ncat === "activity"
        ? "/ person"
        : ncat === "caravan" || ncat === "vehicle-rental"
          ? "/ day"
          : "/ night";
    const img = o.photos?.coverUrl?.length
      ? o.photos.coverUrl
      : o.photos?.galleryUrls?.[0] || "/placeholder.svg";
    return {
      id: route,
      title: o.name,
      details: o.city && o.state ? `${o.city}, ${o.state}` : o.city || o.state || "",
      price: `₹${o.regularPrice}`,
      Maxprice: Math.round(Number(o.regularPrice || 0) * 1.2) || undefined,
      unit,
      image: img,
      images: [
        ...(o.photos?.coverUrl ? [o.photos.coverUrl] : []),
        ...(Array.isArray(o.photos?.galleryUrls) ? o.photos.galleryUrls : []),
      ]
        .filter(Boolean)
        .slice(0, 5),
    };
  }, [getNormCategory]);

  /**
   * Bucket the approved offers by category.
   *
   * `approved` used to be a bare `offers.filter(...)` in the render body, so it
   * was a new array identity on every render and the three `useMemo`s that
   * depended on it never hit. This page re-renders on every IntersectionObserver
   * scroll-highlight change and every hero ResizeObserver tick, so three full
   * filter+map passes over the whole catalog were running during scroll.
   *
   * Now memoised, and a single pass buckets all three categories at once instead
   * of walking the catalog three times.
   */
  const approved = useMemo(() => offers.filter((o) => o.status === "approved"), [offers]);

  const { caravanCards, stayCards, activityCards, vehicleCards } = useMemo(() => {
    const buckets: Record<string, CardItem[]> = {
      caravan: [],
      "unique-stays": [],
      activity: [],
      "vehicle-rental": [],
    };
    for (const o of approved) {
      const bucket = buckets[getNormCategory(o.category, o.serviceType)];
      if (bucket) bucket.push(mapOfferToCard(o));
    }
    return {
      caravanCards: buckets.caravan,
      stayCards: buckets["unique-stays"],
      activityCards: buckets.activity,
      vehicleCards: buckets["vehicle-rental"],
    };
  }, [approved, getNormCategory, mapOfferToCard]);

  const caravanTotal = Math.max(1, Math.ceil(caravanCards.length / PAGE_SIZE));
  const stayTotal = Math.max(1, Math.ceil(stayCards.length / PAGE_SIZE));
  const activityTotal = Math.max(1, Math.ceil(activityCards.length / PAGE_SIZE));
  const vehicleTotal = Math.max(1, Math.ceil(vehicleCards.length / PAGE_SIZE));

  // Memoised because these are passed straight into <OfferSections> — a fresh
  // slice on every scroll-highlight render would re-render the whole card grid.
  const caravanShown = useMemo(
    () => caravanCards.slice(0, pages.caravan * PAGE_SIZE),
    [caravanCards, pages.caravan],
  );
  const stayShown = useMemo(
    () => stayCards.slice(0, pages["unique-stays"] * PAGE_SIZE),
    [stayCards, pages],
  );
  const activityShown = useMemo(
    () => activityCards.slice(0, pages.activity * PAGE_SIZE),
    [activityCards, pages.activity],
  );
  const vehicleShown = useMemo(
    () => vehicleCards.slice(0, pages["vehicle-rental"] * PAGE_SIZE),
    [vehicleCards, pages],
  );

  const incPage = (k: "caravan" | "unique-stays" | "activity" | "vehicle-rental") =>
    setPages((p) => ({
      ...p,
      [k]: Math.min(
        k === "caravan"
          ? caravanTotal
          : k === "unique-stays"
            ? stayTotal
            : k === "vehicle-rental"
              ? vehicleTotal
              : activityTotal,
        p[k] + 1,
      ),
    }));

  const visibleFAQTabs = useMemo(
    () =>
      [
        { id: "unique-stays", label: "Unique Stays", isVisible: homepageSections["unique-stays"] },
        { id: "activities", label: "Activities", isVisible: homepageSections["best-activity"] },
        { id: "caravan", label: "Caravan", isVisible: homepageSections["camper-van"] },
      ].filter((t) => t.isVisible),
    [homepageSections],
  );

  /* ── Render ───────────────────────────────────────────────────────────────── */
  return (
    <>
      <HeroSection
        sectionRef={heroSectionRef}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        homepageSections={homepageSections}
        heroHeight={heroHeight}
        scrollHighlightFilter={scrollHighlightFilter}
      />

      <div
        ref={contentRef}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-4 md:pt-6 overflow-x-clip"
      >
        <OfferSections
          activeFilter={activeFilter}
          homepageSections={homepageSections}
          loadingOffers={loadingOffers}
          offerError={offerError}
          caravanShown={caravanShown}
          stayShown={stayShown}
          activityShown={activityShown}
          vehicleShown={vehicleShown}
        />

        <TrendingDestinations
          homepageSections={homepageSections}
          loadingOffers={loadingOffers}
          offerError={offerError}
        />

        <ServiceListingBanner />

        <HowItWorks />

        <TestimonialsSection
          homepageSections={homepageSections}
          testimonials={testimonials}
          refetchTestimonials={refetchTestimonials}
          user={user}
        />

        {/* Top Rated Stays — hidden once the fetch settles with no approved
            stays, so the heading never sits above an empty strip. */}
        {homepageSections["top-rated-stays"] &&
          (loadingOffers || offerError || stayShown.length > 0) && (
            <Section
              title="Top Rated Stays"
              subtitle="Consistently loved by guests across India"
              className="py-8 md:py-12"
            >
              {loadingOffers ? (
                <CardGridSkeleton count={4} />
              ) : offerError ? (
                <p className="text-red-500 text-center py-8">
                  Failed to load offers. Please try again later.
                </p>
              ) : (
                <>
                  <ResultCard
                    activeFilter="unique-stays"
                    ResultstayShown={stayShown}
                    ResultcaravanShown={[]}
                    ResultactivityShown={[]}
                  />
                  {stayCards.length > stayShown.length && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        onClick={() => incPage("unique-stays")}
                        className="rounded-full bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white px-8 h-11 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                      >
                        View more
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Section>
          )}

        <LatestArticles latestBlogs={latestBlogs} loadingBlogs={!blogsData} />

        <FAQSection
          homepageSections={homepageSections}
          faqs={faqs}
          isLoading={faqsLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          visibleFAQTabs={visibleFAQTabs}
        />
      </div>

      <Footer />
      {/* Clearance for the fixed bottom nav, painted in the footer's own colour
          so the page doesn't end on a white band. Collapses to 0 at lg, where
          the nav is hidden. */}
      <div className="bg-[#0a1c1c] pb-mobile-nav" aria-hidden />
      <MobileUserNav />
    </>
  );
}
