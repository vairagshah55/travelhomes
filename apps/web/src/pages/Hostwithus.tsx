import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Quote, ShieldCheck } from "lucide-react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  ActionLink,
  CONTAINER,
  Eyebrow,
  FaqList,
  Reveal,
  Rule,
  SECTION_Y,
  SectionHead,
  SiteSection,
  SkelLine,
} from "@/components/site/kit";
import { useFaqs } from "@/hooks/useFaqs";
import { PublicTestimonial, testimonialsApi } from "@/lib/testimonials";
import { cn } from "@/lib/utils";

/**
 * /hostwithus — the host-acquisition landing page.
 *
 * ── What this page was ────────────────────────────────────────────────────
 * Roughly half of it was the Career page, pasted in and never rewritten:
 *
 *   • the hero was `/career.jpg` (a file that doesn't exist in the repo) under
 *     "Join a team where passion meets purpose. We're more than just a
 *     workplace…", with a **"Search jobs…"** input on it;
 *   • the earnings section's body copy read "we are looking for experienced and
 *     talented Full-Stack Developers to join our fast-paced Engineering team";
 *   • the benefits heading was "Benefits of Working With Us" / "great work
 *     starts with a great workplace";
 *   • the self-host vs managed comparison had **"Apply"** buttons.
 *
 * A property owner reading it was being pitched a software job.
 *
 * ── The functional bug ───────────────────────────────────────────────────
 * The "Profit Calculator" had two working sliders and a headline figure of
 * `₹93,000` that was **hardcoded** — dragging either slider changed nothing.
 * It now multiplies out. The old default rate of ₹45,000/day looks like a typo
 * for ₹4,500: 4,500 × 21 days = ₹94,500, which is where that ₹93,000 came from,
 * whereas 45,000 × 21 would have read ₹945,000. Defaulted to the figure the
 * page was already claiming.
 *
 * Also gone: a 2s `setTimeout` + "Fetching hostwithus data…" spinner that
 * fetched nothing and rendered above the content rather than instead of it, and
 * `/host.jpg`, `/host1.jpg`, `/host2.jpg`, `/hostbanner.png` — none of which
 * exist, so all four rendered as broken images.
 */

/* Kept verbatim from the page's `hostBenefits`: these are the product's own
   existing claims, so they stay as written rather than being embellished. */
const BENEFITS = [
  {
    title: "Get 5-star reviews faster",
    body: "We help lift your ratings with consistent guest service and attention to the details that guests actually mention.",
  },
  {
    title: "Earn more per booking",
    body: "Dynamic pricing and listing optimisation work out what your place should be going for, season by season.",
  },
  {
    title: "Get your time back",
    body: "Bookings, payments and guest communication are handled, so hosting doesn't turn into a second job.",
  },
];

/** Mirrors the real onboarding flow: service selection → details → admin
    review (`vendorStatus: pending → approved`) → live and bookable. */
const STEPS = [
  {
    title: "Pick what you're listing",
    body: "A camper van, a unique stay, or an activity. Each one has its own short set of questions.",
  },
  {
    title: "Add the details",
    body: "Photos, capacity, pricing, house rules and the amenities you offer. You can save and come back to it.",
  },
  {
    title: "Get verified",
    body: "We review your listing and business details before anything goes live, so guests trust what they book.",
  },
  {
    title: "Start taking bookings",
    body: "Your listing goes live and appears in search. Manage your calendar and earnings from the host dashboard.",
  },
];

/* The page's existing comparison, unchanged in substance. */
const COMPARISON = [
  {
    title: "Host it yourself",
    caption: "You keep full control and do the work.",
    bullets: [
      "List directly on travel sites",
      "Control your calendar and guests",
      "Set your own house rules",
      "Respond to guest inquiries",
      "Manage cleanings and maintenance",
      "Collect and handle payments",
      "Handle all guest check-ins and check-outs",
      "Market your home yourself",
    ],
    featured: false,
  },
  {
    title: "Managed by us",
    caption: "We run the operation, you keep the income.",
    bullets: [
      "Professional listing and photography",
      "Dynamic pricing and revenue management",
      "24/7 guest support",
      "Housekeeping and quality checks",
      "Maintenance coordinated for you",
      "All bookings, checks and payments handled",
      "Optimal occupancy and rate",
      "No stress or hassle",
    ],
    featured: true,
  },
];

const FAQ_TABS = [
  { id: "unique-stays", label: "Unique stays", category: "unique stay" },
  { id: "activities", label: "Activities", category: "activity" },
  { id: "caravan", label: "Caravan", category: "camper van" },
] as const;

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/**
 * Attribution for a testimonial, guarding against rows the CMS lets through.
 *
 * The live database currently holds a testimonial whose `userName` is the
 * literal string `"undefined undefined"` — the server stores whatever it's
 * given, and something upstream template-joined two missing name fields. A
 * plain `t.userName || fallback` doesn't catch it, because that string is
 * truthy, so the old page rendered "undefined undefined" under a review.
 */
function displayName(raw?: string): string {
  const name = (raw || "").replace(/\b(undefined|null)\b/gi, "").replace(/\s+/g, " ").trim();
  return name || "TravelHomes guest";
}

/* ── Earnings estimator ───────────────────────────────────────────────────── */

/* Range inputs can't be styled through ordinary utilities — the thumb is a
   pseudo-element, and each engine names it differently. Arbitrary variants keep
   it in `className` rather than an inline `style` (CONVENTIONS.md Rule 1). The
   default thumb is a small OS dot that looked unfinished against the ink panel. */
const sliderCls = cn(
  "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 outline-none",
  "focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]",
  "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-th-logo",
  "[&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-th-text-primary",
  "[&::-webkit-slider-thumb]:shadow-th-md [&::-webkit-slider-thumb]:transition-transform",
  "motion-safe:[&::-webkit-slider-thumb]:hover:scale-110",
  "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full",
  "[&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-th-text-primary",
  "[&::-moz-range-thumb]:bg-th-logo",
);

function EarningsEstimator() {
  const [rate, setRate] = useState(4500);
  const [nights, setNights] = useState(21);
  const monthly = rate * nights;

  return (
    <div className="rounded-th-3xl bg-th-text-primary p-7 shadow-th-xl sm:p-9">
      <Eyebrow tone="ink">Earnings estimator</Eyebrow>

      <p className="mt-7 text-[13px] font-medium text-white/60">Estimated monthly earnings</p>
      <p
        aria-live="polite"
        className="mt-1 font-display text-[40px] leading-none tabular-nums text-th-logo sm:text-[52px]"
      >
        ₹{inr.format(monthly)}
      </p>

      <div className="mt-9 space-y-7">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="host-rate" className="text-[13px] font-medium text-white/70">
              Nightly rate
            </label>
            <span className="text-[14px] font-bold tabular-nums text-th-text-inverse">
              ₹{inr.format(rate)}
            </span>
          </div>
          <input
            id="host-rate"
            type="range"
            min={1000}
            max={100000}
            step={500}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className={cn("mt-3", sliderCls)}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="host-nights" className="text-[13px] font-medium text-white/70">
              Nights booked per month
            </label>
            <span className="text-[14px] font-bold tabular-nums text-th-text-inverse">
              {nights}
            </span>
          </div>
          <input
            id="host-nights"
            type="range"
            min={1}
            max={31}
            value={nights}
            onChange={(e) => setNights(Number(e.target.value))}
            className={cn("mt-3", sliderCls)}
          />
        </div>
      </div>

      {/* An estimate is arithmetic on the visitor's own inputs — say so, rather
          than let a big number read as a promise. */}
      <p className="mt-8 border-t border-white/10 pt-5 text-[12px] leading-relaxed text-white/50">
        An estimate only: your nightly rate multiplied by the nights you expect to fill, before
        expenses. What you actually earn depends on your location, season and demand.
      </p>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function HostWithUs() {
  const [activeTab, setActiveTab] = useState<(typeof FAQ_TABS)[number]["id"]>("unique-stays");

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<PublicTestimonial[]>({
    queryKey: ["cms", "testimonials", "public"],
    queryFn: async () => {
      try {
        return (await testimonialsApi.list()) || [];
      } catch (err) {
        console.error("Failed to load testimonials", err);
        return [];
      }
    },
  });

  const { data: faqs = [] } = useFaqs();

  /* Only real quotes. TestimonialCard substitutes a hardcoded sample quote
     ("Being good at capturing signals is key to our success!…") for empty
     content, and that placeholder must never reach a visitor. */
  const quotes = useMemo(
    () => testimonials.filter((t) => (t.content || "").trim().length > 0).slice(0, 3),
    [testimonials],
  );

  const activeCategory = FAQ_TABS.find((t) => t.id === activeTab)?.category;
  const visibleFaqs = useMemo(
    () => faqs.filter((f) => (f.category || "").toLowerCase() === activeCategory),
    [faqs, activeCategory],
  );

  return (
    <div className="flex min-h-screen flex-col bg-th-surface-0">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────────
          The estimator sits in the hero on purpose: it answers "what's in it
          for me" in the first viewport, with the visitor's own numbers. */}
      <section className={`${SECTION_Y} border-b border-th-border bg-th-surface-1`}>
        <div className={CONTAINER}>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-7">
              <Eyebrow>Host with TravelHomes</Eyebrow>
              <h1 className="mt-5 font-display text-[38px] leading-[1.04] tracking-[-0.03em] text-th-text-primary sm:text-[52px] md:text-[60px]">
                Your place.
                <br />
                Their next trip.
              </h1>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-th-text-muted sm:text-[17.5px]">
                A cosy apartment, a serene villa, a camper van or a one-off getaway — open it up to
                travellers and earn from the space you already have. Listing is free, and you decide
                how hands-on you want to be.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                {/* The real onboarding entry point — same destination as the
                    header's "List your offering" button. */}
                <ActionLink to="/onboarding/service-selection" withArrow>
                  List your offering
                </ActionLink>
                <ActionLink to="/contact" tone="outline">
                  Talk to our team
                </ActionLink>
              </div>

              <p className="mt-7 inline-flex items-center gap-2 text-[13px] font-medium text-th-text-muted">
                <ShieldCheck size={15} strokeWidth={2.2} aria-hidden className="text-th-accent" />
                Every listing is reviewed before it goes live
              </p>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-5">
              <EarningsEstimator />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Why host with us ───────────────────────────────────────────────── */}
      <SiteSection tone="light">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHead
              eyebrow="Why host with us"
              title="Three fewer things to worry about"
              lead="What hosting on TravelHomes takes off your plate."
            />
          </div>

          <ul className="lg:col-span-8">
            {BENEFITS.map((b, i) => (
              <li key={b.title}>
                <Reveal delay={i * 90}>
                  <div className="flex gap-6 border-t border-th-border py-7 sm:gap-9">
                    <span
                      aria-hidden
                      className="shrink-0 pt-1 font-display text-[15px] tabular-nums text-th-accent"
                    >
                      0{i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-[22px] leading-snug tracking-[-0.01em] text-th-text-primary sm:text-[26px]">
                        {b.title}
                      </h3>
                      <p className="mt-2.5 max-w-xl text-[14.5px] leading-relaxed text-th-text-muted">
                        {b.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </SiteSection>

      {/* ── How it works ─────────────────────────────────────────────────────
          Four steps on one connecting rule. The rule is drawn on the container,
          not per-step, so it doesn't overshoot the first and last markers. */}
      <SiteSection tone="raised">
        <SectionHead
          eyebrow="How it works"
          title="Live in four steps"
          lead="From deciding to list to taking your first booking."
          align="center"
          className="mx-auto max-w-2xl"
        />

        <ol className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <span
            aria-hidden
            className="absolute left-0 right-0 top-5 hidden border-t border-dashed border-th-border-hover lg:block"
          />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <Reveal delay={i * 100}>
                <span className="relative grid h-10 w-10 place-items-center rounded-full border border-th-border bg-th-surface-0 font-display text-[15px] tabular-nums text-th-accent shadow-th-xs">
                  {i + 1}
                </span>
                <h3 className="mt-6 font-display text-[20px] leading-snug text-th-text-primary">
                  {s.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-th-text-muted">{s.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </SiteSection>

      {/* ── Comparison ───────────────────────────────────────────────────────
          Two real paths with real CTAs. The old cards ended in "Apply" and
          "Learn More" buttons that were wired to nothing at all. */}
      <SiteSection tone="light">
        <SectionHead
          eyebrow="Two ways to host"
          title="As hands-on as you want to be"
          lead="Run it yourself, or hand the operation over. You can start with one and move to the other."
          align="center"
          className="mx-auto max-w-2xl"
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {COMPARISON.map((col, i) => (
            <Reveal key={col.title} delay={i * 110}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-th-3xl p-7 sm:p-9",
                  col.featured
                    ? "bg-th-text-primary shadow-th-xl"
                    : "border border-th-border bg-th-surface-0",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className={cn(
                        "font-display text-[24px] leading-snug tracking-[-0.01em] sm:text-[28px]",
                        col.featured ? "text-th-text-inverse" : "text-th-text-primary",
                      )}
                    >
                      {col.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-2 text-[14px] leading-relaxed",
                        col.featured ? "text-white/60" : "text-th-text-muted",
                      )}
                    >
                      {col.caption}
                    </p>
                  </div>
                  {col.featured && (
                    <span className="shrink-0 rounded-th-full bg-th-logo px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-th-logo-fg">
                      Popular
                    </span>
                  )}
                </div>

                <ul className="mt-8 flex-1 space-y-3.5">
                  {col.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <Check
                        size={16}
                        strokeWidth={2.6}
                        aria-hidden
                        className={cn(
                          "mt-0.5 shrink-0",
                          col.featured ? "text-th-logo" : "text-th-accent",
                        )}
                      />
                      <span
                        className={cn(
                          "text-[14.5px] leading-snug",
                          col.featured ? "text-white/85" : "text-th-text-secondary",
                        )}
                      >
                        {b}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-9">
                  {col.featured ? (
                    <ActionLink to="/contact" tone="inverse" className="w-full" withArrow>
                      Ask about managed hosting
                    </ActionLink>
                  ) : (
                    <ActionLink
                      to="/onboarding/service-selection"
                      tone="outline"
                      className="w-full"
                      withArrow
                    >
                      List it yourself
                    </ActionLink>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </SiteSection>

      {/* ── Testimonials ─────────────────────────────────────────────────────
          Real CMS testimonials as editorial pull-quotes. Skeletoned while they
          load; the whole band is dropped if there are none, rather than showing
          an empty carousel with two arrow buttons like the old version did. */}
      {(testimonialsLoading || quotes.length > 0) && (
        <SiteSection tone="raised">
          <SectionHead
            eyebrow="From the community"
            title="What people tell us"
            className="max-w-2xl"
          />

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {testimonialsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <SkelLine w="w-8" h="h-8" />
                    <SkelLine />
                    <SkelLine />
                    <SkelLine w="w-3/4" />
                    <div className="pt-4">
                      <SkelLine w="w-32" h="h-3.5" />
                    </div>
                  </div>
                ))
              : quotes.map((t, i) => (
                  <Reveal key={`${t.userName}-${i}`} delay={i * 100}>
                    <figure className="flex h-full flex-col">
                      <Quote
                        size={26}
                        strokeWidth={2}
                        aria-hidden
                        className="shrink-0 text-th-border-hover"
                      />
                      <blockquote className="mt-5 flex-1 text-[16px] leading-relaxed text-th-text-secondary">
                        {t.content}
                      </blockquote>
                      <figcaption className="mt-6 border-t border-th-border pt-4">
                        <span className="block text-[14px] font-semibold text-th-text-primary">
                          {displayName(t.userName)}
                        </span>
                        {typeof t.rating === "number" && t.rating > 0 && (
                          <span className="mt-0.5 block text-[12.5px] tabular-nums text-th-text-muted">
                            Rated {t.rating} out of 5
                          </span>
                        )}
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
          </div>
        </SiteSection>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <SiteSection tone="light">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHead
              eyebrow="Questions"
              title="Frequently asked questions"
              lead="Answers by the kind of listing you're thinking about."
            />

            {/* Segmented control. `role="tablist"` with real `aria-selected`
                state — the old version was three unlabelled buttons. */}
            <div
              role="tablist"
              aria-label="FAQ categories"
              className="mt-8 inline-flex flex-wrap gap-1 rounded-th-full border border-th-border bg-th-surface-1 p-1"
            >
              {FAQ_TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "h-9 rounded-th-full px-4 text-[13px] font-semibold outline-none transition-colors duration-150 focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]",
                    activeTab === tab.id
                      ? "bg-th-brand text-th-brand-fg shadow-th-xs"
                      : "text-th-text-secondary hover:bg-th-surface-2",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            {visibleFaqs.length > 0 ? (
              <FaqList items={visibleFaqs} />
            ) : (
              <div className="border-y border-th-border py-12 text-center">
                <p className="text-[14.5px] text-th-text-muted">
                  Nothing here yet for this type of listing.{" "}
                  <Link
                    to="/contact"
                    className="font-semibold text-th-accent underline decoration-th-brand-border-soft underline-offset-4 hover:decoration-th-accent"
                  >
                    Ask us directly
                  </Link>{" "}
                  and we'll answer.
                </p>
              </div>
            )}
          </div>
        </div>
      </SiteSection>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-th-text-primary py-20 md:py-28">
        <div className={CONTAINER}>
          <Reveal className="mx-auto max-w-3xl text-center">
            <Eyebrow tone="ink">Ready when you are</Eyebrow>
            <h2 className="mt-6 font-display text-[32px] leading-[1.1] tracking-[-0.02em] text-th-text-inverse sm:text-[46px]">
              Start earning from your space.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/70">
              Listing is free and takes a few minutes. You can save your progress and finish later.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <ActionLink to="/onboarding/service-selection" tone="inverse" withArrow>
                List your offering
              </ActionLink>
              <ActionLink to="/contact" tone="ghostInverse">
                Talk to our team
              </ActionLink>
            </div>
            <div className="mt-12">
              <Rule tone="ink" />
              <p className="pt-6 text-[13px] text-white/50">
                Already listed something? Manage it from your host dashboard.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
