import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Footer from "../components/Footer";
import MobileUserNav from "@/components/MobileUserNav";
import { offersApi, OfferDTO, API_BASE_URL, cmsPublicApi, PublicFaq } from "@/lib/api";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useFaqs } from "@/hooks/useFaqs";
import { testimonialsApi, PublicTestimonial } from "@/lib/testimonials";
import { useAuth } from "../contexts/AuthContext";
import Section from "@/components/Section";
import DefaultCard from "@/components/DefaultCard";
import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/home/skeletons";

import { HeroSection } from "@/components/home/HeroSection";
import { OfferSections } from "@/components/home/OfferSections";
import { TrendingDestinations } from "@/components/home/TrendingDestinations";
import { ServiceListingBanner } from "@/components/home/ServiceListingBanner";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { LatestArticles } from "@/components/home/LatestArticles";
import { FAQSection } from "@/components/home/FAQSection";

type FilterType = "camper-van" | "unique-stays" | "activity";

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
    avatar: "/test5.png",
    email: "aarav.mehta@example.com",
    createdAt: "2025-10-12T09:24:00Z",
  },
  {
    id: "t2",
    userName: "Priya Sharma",
    rating: 4,
    content:
      "Really impressed with how easy it was to find what I needed. The platform feels modern and intuitive.",
    avatar: "/user-avatar.svg",
    email: "priya.sharma@example.com",
    createdAt: "2025-09-28T14:45:00Z",
  },
  {
    id: "t3",
    userName: "Rahul Verma",
    rating: 5,
    content:
      "Exceptional service and great user experience. I found exactly what I was looking for within minutes!",
    avatar: "/test2.png",
    email: "rahul.verma@example.com",
    createdAt: "2025-08-20T11:10:00Z",
  },
  {
    id: "t4",
    userName: "Neha Kapoor",
    rating: 5,
    content:
      "Loved the design and smooth navigation. It's rare to see a platform this well thought out!",
    avatar: "/test3.png",
    email: "neha.kapoor@example.com",
    createdAt: "2025-07-05T18:20:00Z",
  },
  {
    id: "t5",
    userName: "Rohan Singh",
    rating: 4,
    content:
      "Great experience overall! Would definitely recommend this to anyone looking for reliable service.",
    avatar: "/test4.png",
    email: "rohan.singh@example.com",
    createdAt: "2025-06-15T07:40:00Z",
  },
];

const SECTION_DEFAULTS: Record<string, boolean> = {
  "camper-van": true,
  "unique-stays": true,
  "best-activity": true,
  "trending-destinations": true,
  testimonials: true,
  "top-rated-stays": true,
  faq: true,
};

const PAGE_SIZE = 12;

export default function Index() {
  const { user } = useAuth();

  /* ── UI state ─────────────────────────────────────────────────────────────── */
  const [activeFilter, setActiveFilter] = useState<FilterType>("unique-stays");
  const [activeTab, setActiveTab] = useState("unique-stays");
  const [scrollHighlightFilter, setScrollHighlightFilter] = useState<FilterType | null>(null);
  const [heroHeight, setHeroHeight] = useState(500);
  const [pages, setPages] = useState({ caravan: 1, "unique-stays": 1, activity: 1 });

  const heroSectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /* ── React Query — all data ───────────────────────────────────────────────── */
  // Shared hook so AddOfferings, ServiceSelection, SiteHeader,
  // SearchResults, and the 3 onboarding flows hit the same cache.
  const { data: sectionsData } = useHomepageSections();

  const { data: categoryMapData } = useQuery({
    queryKey: ["offer-categories"],
    queryFn: async () => {
      const [van, stay, act] = await Promise.all([
        cmsPublicApi.getFeatures("Camper Van", "category"),
        cmsPublicApi.getFeatures("Unique Stays", "category"),
        cmsPublicApi.getFeatures("Activity", "category"),
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

  const { data: faqsData } = useFaqs();

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
    return sectionsData.reduce(
      (acc: Record<string, boolean>, s: any) => ({ ...acc, [s.sectionKey]: s.isVisible }),
      { ...SECTION_DEFAULTS },
    );
  }, [sectionsData]);

  const categoryMap = categoryMapData ?? {};
  const offers = offersResponse?.data ?? [];
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
  const getNormCategory = (cat?: string, serviceType?: string) => {
    const s = String(serviceType || "").toLowerCase();
    if (s === "camper-van") return "caravan" as const;
    if (s === "unique-stay" || s === "unique-stays") return "unique-stays" as const;
    if (s === "activity") return "activity" as const;
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
  };

  const mapOfferToCard = (o: OfferDTO): CardItem => {
    const ncat = getNormCategory(o.category, o.serviceType);
    const route =
      ncat === "caravan"
        ? `/campervan/${o._id}`
        : ncat === "unique-stays"
          ? `/unique-stay/${o._id}`
          : `/activity/${o._id}`;
    const unit = ncat === "activity" ? "/ person" : ncat === "caravan" ? "/ day" : "/ night";
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
  };

  const approved = offers.filter((o) => o.status === "approved");
  const caravanCards = useMemo(
    () =>
      approved
        .filter((o) => getNormCategory(o.category, o.serviceType) === "caravan")
        .map(mapOfferToCard),
    [approved, categoryMap],
  );
  const stayCards = useMemo(
    () =>
      approved
        .filter((o) => getNormCategory(o.category, o.serviceType) === "unique-stays")
        .map(mapOfferToCard),
    [approved, categoryMap],
  );
  const activityCards = useMemo(
    () =>
      approved
        .filter((o) => getNormCategory(o.category, o.serviceType) === "activity")
        .map(mapOfferToCard),
    [approved, categoryMap],
  );

  const caravanTotal = Math.max(1, Math.ceil(caravanCards.length / PAGE_SIZE));
  const stayTotal = Math.max(1, Math.ceil(stayCards.length / PAGE_SIZE));
  const activityTotal = Math.max(1, Math.ceil(activityCards.length / PAGE_SIZE));

  const caravanShown = caravanCards.slice(0, pages.caravan * PAGE_SIZE);
  const stayShown = stayCards.slice(0, pages["unique-stays"] * PAGE_SIZE);
  const activityShown = activityCards.slice(0, pages.activity * PAGE_SIZE);

  const incPage = (k: "caravan" | "unique-stays" | "activity") =>
    setPages((p) => ({
      ...p,
      [k]: Math.min(
        k === "caravan" ? caravanTotal : k === "unique-stays" ? stayTotal : activityTotal,
        p[k] + 1,
      ),
    }));

  const visibleFAQTabs = [
    { id: "unique-stays", label: "Unique Stays", isVisible: homepageSections["unique-stays"] },
    { id: "activities", label: "Activities", isVisible: homepageSections["best-activity"] },
    { id: "caravan", label: "Caravan", isVisible: homepageSections["camper-van"] },
  ].filter((t) => t.isVisible);

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

      <div ref={contentRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <OfferSections
          activeFilter={activeFilter}
          homepageSections={homepageSections}
          loadingOffers={loadingOffers}
          offerError={offerError}
          caravanShown={caravanShown}
          stayShown={stayShown}
          activityShown={activityShown}
        />

        <TrendingDestinations
          homepageSections={homepageSections}
          loadingOffers={loadingOffers}
          offerError={offerError}
        />

        <ServiceListingBanner />

        <TestimonialsSection
          homepageSections={homepageSections}
          testimonials={testimonials}
          refetchTestimonials={refetchTestimonials}
          user={user}
        />

        {/* Top Rated Stays */}
        {homepageSections["top-rated-stays"] && (
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
                <DefaultCard CardData={stayShown} activeFilter={activeFilter} />
                {stayCards.length > stayShown.length && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={() => incPage("unique-stays")}
                      className="rounded-full bg-blue-600 hover:bg-blue-700 text-white px-8 h-11 shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          visibleFAQTabs={visibleFAQTabs}
        />
      </div>

      <Footer />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 border-t border-gray-100 dark:border-gray-800 shadow-sm">
        <MobileUserNav />
      </div>
    </>
  );
}
