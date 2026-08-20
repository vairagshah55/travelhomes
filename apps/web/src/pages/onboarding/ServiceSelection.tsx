import React, { useState, useEffect, useMemo } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { StepHeader } from "@/components/onboarding/shared/primitives";
import LogoWebsite from "@/components/ui/LogoWebsite";
import { cn } from "@/lib/utils";

/**
 * Step 1 of the vendor flow — pick a service, then enter that flow's wizard.
 *
 * Presentation follows the shared onboarding system rather than its own
 * vocabulary. It previously hand-rolled everything the system already owns: a
 * bespoke header with a three-node step rail, a `clamp()` heading, six local
 * keyframes duplicating `.onb-fade-up`, two large blurred colour blobs, and
 * cyan `rgba(59,217,218,.44)` glows on the CTA and the selected card. The blobs
 * and glows are the two things the system explicitly moved away from (see the
 * notes on `--onb-page-bg` and `.onb-glow-shadow` in global.css), so this page
 * kept looking like the pre-revamp app after the rest of the flow was reworked
 * — the same drift CategoryStep had before it adopted StepHeader.
 *
 * Chrome (`.onb-header` / `.onb-footer`), the selectable-card pattern, and the
 * two-column content grid are all matched to OnboardingLayout + CategoryStep.
 * This page is not a wizard step, so it composes those pieces directly instead
 * of rendering OnboardingLayout, whose phase rail and Back/Next contract
 * describe a multi-step form this screen isn't one of.
 */

type ServiceType = "caravan" | "stay" | "activity" | "vehicle";

const SERVICE_META: Record<ServiceType, { title: string; description: string; tag: string }> = {
  caravan: {
    title: "Caravan Rental",
    description:
      "Rent out your camper van or motorhome to adventure seekers looking for the open road.",
    tag: "Popular",
  },
  stay: {
    title: "Unique Stays",
    description:
      "Host travelers in your villa, cabin, farmhouse, or any unique accommodation space.",
    tag: "Trending",
  },
  activity: {
    title: "Activities & Experiences",
    description: "Guide outdoor adventures, tours, workshops, and unforgettable local experiences.",
    tag: "New",
  },
  vehicle: {
    title: "Vehicle Rental",
    description:
      "Rent out your car, van, or bus — self-drive or with a driver — to travellers on the move.",
    tag: "New",
  },
};

/** Homepage-section key that gates each service (admin CMS → Home page). */
const SECTION_KEY_BY_SERVICE: Record<ServiceType, string> = {
  caravan: "camper-van",
  stay: "unique-stays",
  activity: "best-activity",
  vehicle: "vehicle-rental",
};

const ILLUSTRATION_BY_SERVICE: Record<ServiceType, string> = {
  caravan:
    "https://api.builder.io/api/v1/image/assets/TEMP/b0d5bf84a04251328fd3565624ad1b2b09a5cd43",
  stay: "https://api.builder.io/api/v1/image/assets/TEMP/8e762f2f0679274541ddec18f7f1325791c712e7",
  activity:
    "https://api.builder.io/api/v1/image/assets/TEMP/ac3af7014c1557f3fdf25509200649edd541b7e3",
  // Reuses the caravan illustration: both are road vehicles, and a mismatched
  // stock photo reads worse than a related one. Swap when artwork exists.
  vehicle:
    "https://api.builder.io/api/v1/image/assets/TEMP/b0d5bf84a04251328fd3565624ad1b2b09a5cd43",
};

const SESSION_IDS: Record<ServiceType, { key: string; value: string }> = {
  activity: { key: "activityID", value: "activity1" },
  caravan: { key: "camperVanID", value: "camperVan2" },
  stay: { key: "stayID", value: "stay3" },
  vehicle: { key: "vehicleID", value: "vehicle4" },
};

const ServiceSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<ServiceType | null>("caravan");
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    "camper-van": true,
    "unique-stays": true,
    "best-activity": true,
    "vehicle-rental": true,
  });
  const [showError, setShowError] = useState(false);

  /**
   * Whether a submission is already under review.
   *
   * This used to live in three `useState`s seeded to "no pending application",
   * populated by an uncached fetch in an effect. Because the initial state was
   * a definite answer rather than "unknown", the page painted every card
   * unlocked with Caravan pre-selected, and only flipped to the locked state
   * with its "under review" banner once `/api/onboarding/mine` came back —
   * seconds later, since that endpoint was returning multi-megabyte documents.
   * The vendor could click Continue during that window and be dropped into a
   * flow the server then refuses.
   *
   * Derived from the shared query now, so "still loading" is representable and
   * the render can wait for it (see `statusPending` below).
   */
  const { data: submission, isPending: statusPending } = useOnboardingStatus(!!user);

  const pendingServiceType = submission?.doc?.status === "pending" ? submission.type : null;
  const hasPendingApplication = !!pendingServiceType;
  const pendingData = hasPendingApplication ? submission?.doc : null;

  // Land the selection on the one service the vendor can actually continue
  // with, once we know there is one.
  useEffect(() => {
    if (pendingServiceType) setSelectedService(pendingServiceType as ServiceType);
  }, [pendingServiceType]);

  const { data: homepageSections } = useHomepageSections();
  useEffect(() => {
    if (!homepageSections || homepageSections.length === 0) return;
    const nextState: Record<string, boolean> = {};
    (homepageSections as any[]).forEach((s: any) => {
      nextState[s.sectionKey] = s.isVisible;
    });
    setVisibleSections((prev) => ({ ...prev, ...nextState }));
  }, [homepageSections]);

  useEffect(() => {
    if (selectedService && visibleSections[SECTION_KEY_BY_SERVICE[selectedService]] === false) {
      const availableService = (Object.keys(SECTION_KEY_BY_SERVICE) as ServiceType[]).find(
        (key) => visibleSections[SECTION_KEY_BY_SERVICE[key]] !== false,
      );
      setSelectedService(availableService ?? null);
    }
  }, [visibleSections, selectedService]);

  // Reads the same cached submission as above rather than firing a second
  // request for the identical endpoint.
  useEffect(() => {
    if (user?.vendorStatus !== "rejected") return;
    if (statusPending) return;
    if (submission?.type) {
      toast.info("Please update your rejected application");
      navigate(`/onboarding/${submission.type}`);
    }
  }, [user, navigate, submission, statusPending]);

  const handleBack = () => navigate("/");

  const handleContinue = () => {
    // Don't let anyone through the gate before we know whether it's shut.
    if (statusPending) return;
    if (hasPendingApplication && selectedService !== pendingServiceType) {
      toast.error("Your vendor application is pending approval. You cannot create a new service.");
      return;
    }
    if (!selectedService) {
      setShowError(true);
      toast.error("Please select a service to continue");
      return;
    }
    sessionStorage.setItem("onboardingType", selectedService);
    const { key, value } = SESSION_IDS[selectedService];
    sessionStorage.setItem(key, value);
    sessionStorage.setItem("id", value);
    navigate(`/onboarding/${selectedService}`);
  };

  const visibleServices = (Object.keys(SECTION_KEY_BY_SERVICE) as ServiceType[]).filter(
    (s) => visibleSections[SECTION_KEY_BY_SERVICE[s]] !== false,
  );

  const pendingTitle = pendingServiceType
    ? SERVICE_META[pendingServiceType as ServiceType]?.title
    : null;

  /** Formatted submission date, or null when the timestamp is missing/unparseable. */
  const submittedOn = useMemo(() => {
    if (!pendingData?.createdAt) return null;
    const d = new Date(pendingData.createdAt);
    return Number.isNaN(d.getTime())
      ? null
      : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }, [pendingData?.createdAt]);

  return (
    <div
      data-onboarding
      className="relative min-h-screen font-sans flex flex-col bg-[color:var(--onb-page-bg,#efeeea)] text-th-text-primary"
    >
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="onb-header">
        <LogoWebsite />
        <span className="hidden sm:block text-[12px] font-semibold tracking-[0.02em] text-th-warm-text-muted">
          Step <span className="text-th-text-primary">1</span> of 3
        </span>
      </div>

      {/* ─── Content ────────────────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-y-auto pt-16 pb-28">
        <div className="max-w-[1120px] mx-auto w-full px-5 sm:px-6 lg:px-10 py-7 sm:py-9">
          <div className="onb-fade-up flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_336px] lg:gap-10 lg:items-start">
            <div className="w-full min-w-0 flex flex-col gap-6">
              {/* Support copy is deliberately shorter than the original. StepHeader
                  caps it at 46ch for readability, so "…add to TravelHomes." split
                  the product name across two lines beneath a title that runs the
                  full column width. Dropping "to TravelHomes" costs nothing — the
                  host is already here. */}
              <StepHeader
                kicker="Select Service"
                title="Which service are you offering?"
                subtitle="Choose the type of listing you'd like to add. You can always expand your offerings later."
                step={1}
                totalSteps={3}
              />

              {/* Pending application notice */}
              {hasPendingApplication && pendingData && (
                <div className="flex items-start gap-3.5 rounded-[16px] border border-th-warn-bright-border bg-th-warn-bright-bg p-4 sm:p-[18px]">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-th-warn-bright-border bg-th-surface-0">
                    <Clock size={16} strokeWidth={2} className="text-th-warn-bright" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold tracking-[-0.01em] text-th-text-primary">
                      Your {pendingTitle || "listing"} is under review
                    </p>
                    <p className="mt-1 text-[12.5px] leading-[1.55] text-[color:var(--onb-text-secondary,#657477)]">
                      {/* `createdAt` isn't guaranteed — an unguarded
                          `new Date(undefined)` rendered the literal string
                          "Invalid Date" in the middle of the sentence. */}
                      {submittedOn ? `Submitted ${submittedOn}. ` : ""}
                      Our team will review within 24–48 hours, and the other services stay locked
                      until then.
                    </p>
                  </div>
                </div>
              )}

              {/* ─── Service cards ─────────────────────────────────────── */}
              {/* role=radio on buttons so the single-select nature and the
                  checked state are announced. This was a plain div with an
                  onClick and no keyboard path at all. */}
              <div role="radiogroup" aria-label="Service type" className="flex flex-col gap-3">
                {/* Until the pending check resolves we don't know which cards are
                    locked, so render placeholders rather than an interactive
                    "everything is available" state we may be about to retract. */}
                {statusPending
                  ? visibleServices.map((service) => (
                      <div
                        key={service}
                        aria-hidden
                        className="flex w-full items-center gap-4 rounded-[16px] border-[1.5px] border-th-warm-border bg-th-surface-0 px-[18px] py-4"
                      >
                        <span className="h-12 w-12 shrink-0 animate-pulse rounded-[14px] bg-th-warm-surface" />
                        <span className="min-w-0 flex-1 space-y-2">
                          <span className="block h-3.5 w-40 animate-pulse rounded bg-th-warm-surface" />
                          <span className="block h-3 w-full max-w-[280px] animate-pulse rounded bg-th-warm-surface" />
                        </span>
                      </div>
                    ))
                  : visibleServices.map((service, index) => {
                  const meta = SERVICE_META[service];
                  const selected = selectedService === service;
                  // The one service actually awaiting admin action…
                  const isPendingService = hasPendingApplication && service === pendingServiceType;
                  // …versus the ones blocked *because* of it.
                  const locked = hasPendingApplication && service !== pendingServiceType;
                  return (
                    <button
                      key={service}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={locked}
                      onClick={() => {
                        setSelectedService(service);
                        setShowError(false);
                      }}
                      // Stagger is computed per index, so it stays inline.
                      style={{ animationDelay: `${index * 70}ms` }}
                      className={cn(
                        "onb-fade-up relative w-full flex items-center gap-4 px-[18px] py-4 rounded-[16px] border-[1.5px] text-left transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--th-ring)]",
                        locked
                          ? "cursor-not-allowed border-th-warm-border bg-th-surface-0 opacity-55"
                          : "cursor-pointer",
                        !locked && selected
                          ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_var(--th-ring),0_2px_12px_rgba(0,0,0,0.04)]"
                          : "",
                        !locked && !selected
                          ? "border-th-warm-border bg-th-surface-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-th-brand hover:bg-th-brand-soft"
                          : "",
                      )}
                    >
                      {/* Icon chip */}
                      <span
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border-[1.5px] transition-all duration-150",
                          selected && !locked
                            ? "border-th-brand-border-soft bg-th-brand-soft text-th-brand"
                            : "border-th-warm-border bg-th-warm-surface text-th-warm-text-muted",
                        )}
                      >
                        {SERVICE_ICONS[service]}
                      </span>

                      {/* Text */}
                      <span className="min-w-0 flex-1">
                        <span className="mb-[3px] flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "text-[14px] font-bold tracking-[-0.01em] transition-colors duration-150",
                              selected && !locked ? "text-th-brand" : "text-th-text-primary",
                            )}
                          >
                            {meta.title}
                          </span>
                          {/* Quiet chip. The tag used to appear only once a card
                              was selected, which is backwards — "Popular" is
                              meant to inform the choice, not reward it.

                              `locked` means "a DIFFERENT service is in review",
                              so labelling locked cards "Pending review" put that
                              badge on the two services that aren't under review
                              and left the one that is showing "Trending". The
                              three states are distinct and now read that way. */}
                          <span
                            className={cn(
                              "rounded-full border px-2 py-[1px] text-[9.5px] font-bold uppercase tracking-[0.08em]",
                              isPendingService
                                ? "border-th-warn-bright-border bg-th-warn-bright-bg text-th-warn-bright"
                                : "border-th-warm-border bg-th-warm-surface text-th-warm-text-muted",
                              locked && "opacity-80",
                            )}
                          >
                            {isPendingService ? "In review" : locked ? "Locked" : meta.tag}
                          </span>
                        </span>
                        <span className="block text-[12.5px] font-normal leading-[1.55] text-th-warm-text-dark">
                          {meta.description}
                        </span>
                      </span>

                      {/* Selection indicator */}
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150",
                          selected && !locked
                            ? "border-th-brand bg-th-brand"
                            : "border-th-warm-border bg-transparent",
                        )}
                      >
                        {selected && !locked && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M2 5l2.5 2.5L8 3"
                              stroke="currentColor"
                              className="text-th-text-inverse"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      </button>
                      );
                    })}
              </div>

              {/* Validation error. Replaces a shake animation on the CTA —
                  the only shake keyframe in the codebase is bound to
                  [data-animate-delta="negative"] for metric deltas, and a
                  visible message is what a screen reader can act on anyway. */}
              {showError && !selectedService && (
                <p role="alert" className="text-[12.5px] font-medium text-th-error-bright">
                  Please select a service to continue.
                </p>
              )}
            </div>

            {/* ─── Illustration aside ──────────────────────────────────── */}
            {/* Mirrors OnboardingLayout's preview panel: a real card with the
                system border + shadow. The previous version floated the image
                over two 60–90px blurred colour blobs with absolutely-positioned
                badges — the "uneven beige wash" the system removed. */}
            <aside className="hidden lg:block lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-[18px] border border-[color:var(--onb-card-border)] bg-th-surface-0 shadow-[var(--onb-card-shadow)]">
                {/* White, not the warm well the form fields use: these PNGs
                    carry their own white background, so a tinted panel behind
                    them renders as a white square inside a beige box. */}
                <div className="flex items-center justify-center border-b border-th-warm-border bg-th-surface-0 px-6 py-7">
                  {selectedService ? (
                    <img
                      key={selectedService}
                      src={ILLUSTRATION_BY_SERVICE[selectedService]}
                      alt=""
                      className="onb-scale-in h-[236px] w-full object-contain"
                    />
                  ) : (
                    <div className="h-[236px] w-full" />
                  )}
                </div>
                <dl className="divide-y divide-th-warm-border">
                  {[
                    { term: "Verified hosts", detail: "Every host is identity-checked" },
                    { term: "Quick setup", detail: "Most listings go live in minutes" },
                  ].map((row) => (
                    <div key={row.term} className="px-5 py-3.5">
                      <dt className="text-[12.5px] font-bold tracking-[-0.01em] text-th-text-primary">
                        {row.term}
                      </dt>
                      <dd className="mt-0.5 text-[12px] leading-[1.5] text-th-warm-text-muted">
                        {row.detail}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ─── Sticky footer nav ──────────────────────────────────────────── */}
      <div className="onb-footer px-5 sm:px-6 lg:px-10 py-3.5">
        <div className="max-w-[1120px] mx-auto w-full flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleBack}
            className={cn(
              "onb-btn-secondary h-12 px-5 sm:px-7 text-[14px] rounded-full",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--th-ring)]",
            )}
          >
            Back to home
          </button>

          <button
            type="button"
            onClick={handleContinue}
            // Disabled until the pending check resolves: the vendor could
            // otherwise continue into a service the server is about to refuse.
            disabled={statusPending}
            aria-busy={statusPending}
            className={cn(
              "onb-btn-primary h-12 px-6 sm:px-8 text-[14px] rounded-full whitespace-nowrap",
              "inline-flex items-center gap-2",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2",
              "focus-visible:ring-[color:var(--onb-cta-ink,#0a5559)] focus-visible:ring-offset-th-surface-0",
            )}
          >
            {statusPending ? "Checking…" : "Continue"}
            <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Icons ─────────────────────────────────────────────────────────────── */
/* Kept as bespoke line art: these are the three top-level services, and the
   emoji CategoryStep uses for van sub-types would read as a downgrade here.
   currentColor so the chip's selected/idle state drives them. */
const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  caravan: (
    <svg width="26" height="26" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path
        d="M20.2775 27.0794H17.079L14.833 31.6976H18.044M20.2775 27.0794L18.044 31.6976M20.2775 27.0794H20.1058H25.5673V31.6976H17.8598H18.044M20.9316 23.3385H56.4155C59.2758 23.3385 62.1639 25.6925 62.3676 29.041C62.3829 29.2921 62.3994 29.5414 62.4368 29.7903C62.606 30.9167 63.0833 34.3846 62.9874 37.0871C62.876 40.227 62.0026 45.0718 62.0026 45.0718H60.0586C60.0586 45.0718 59.507 42.6731 56.29 41.6713H49.1697C47.4599 42.3193 47.0788 43.4698 46.5027 45.0718H26.4908C26.4908 41.9787 23.4471 39.9396 20.9306 39.9396C18.414 39.9396 15.1787 42.1225 15.1787 45.0718H11.4467C4.8038 45.0718 13.696 27.6599 14.5791 26.1849L15.0134 25.5415H13.2876C13.6875 24.6675 14.5791 23.3497 20.9316 23.3385ZM23.7519 45.7797C23.7519 47.3713 22.4616 48.6616 20.8701 48.6616C19.2785 48.6616 17.9882 47.3713 17.9882 45.7797C17.9882 44.1881 19.2785 42.8979 20.8701 42.8979C22.4616 42.8979 23.7519 44.1881 23.7519 45.7797ZM55.9582 45.7797C55.9582 47.3713 54.668 48.6616 53.0764 48.6616C51.4848 48.6616 50.1945 47.3713 50.1945 45.7797C50.1945 44.1881 51.4848 42.8979 53.0764 42.8979C54.668 42.8979 55.9582 44.1881 55.9582 45.7797ZM28.7488 27.0794H33.367V31.6976H28.7488V27.0794ZM36.551 27.0794H41.1691V31.6976H36.551V27.0794ZM44.3508 27.0794H48.969V31.6976H44.3508V27.0794ZM52.1507 27.0794H56.7688V31.6976H52.1507V27.0794Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  stay: (
    <svg width="26" height="26" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path
        d="M9 51.0452V47.9745H10.2502L16.0895 39.0683M16.0895 39.0683C15.2047 41.9588 14.1578 44.9775 14.1578 47.9745L25.0808 52.1792H46.0121L57.5009 47.9745C57.5009 45.0245 56.5095 41.9955 55.5063 39.0683M16.0895 39.0683C19.2925 28.6048 27.04 19.8208 35.3485 19.8208C43.5963 19.8208 51.9944 28.8209 55.5063 39.0683M63 51.0452V47.9745H61.7498L55.5063 39.0683M31.4164 29.5564H35.1256C38.2921 29.5564 39.9162 30.8351 40.767 33.8851L44.1476 44.6971C44.5658 46.1962 43.4386 47.1449 41.8823 47.1449H29.62C28.0918 47.1449 26.9695 46.2461 27.3374 44.7628L31.4164 29.5564Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  activity: (
    <svg width="26" height="26" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path
        d="M22.323 42.9009H21.2793C20.0367 42.9009 19.0293 41.8936 19.0293 40.6509L19.0293 27.4377C19.0293 26.195 20.0367 25.1877 21.2793 25.1877H22.323M49.6768 25.2886H50.7205C51.9631 25.2886 52.9705 26.296 52.9705 27.5386V40.7519C52.9705 41.9945 51.9631 43.0019 50.7205 43.0019H49.6768M49.6768 43.0019V25.9768V24.3978C49.6768 23.5217 49.1759 22.7624 48.4449 22.3909M49.6768 43.0019V47.6C49.6768 48.403 49.2561 49.1077 48.6232 49.5059M23.5539 22.3913C22.8234 22.7631 22.323 23.522 22.323 24.3978V25.9775V43.0012V47.6C22.323 48.4025 22.7432 49.1069 23.3755 49.5052M23.5539 22.3913C24.0984 24.2641 25.8271 25.6327 27.8755 25.6327H44.1232C46.1718 25.6327 47.9006 24.2638 48.4449 22.3909M23.5539 22.3913C23.4378 21.9919 23.3755 21.5696 23.3755 21.1327V15.3803C23.3755 14.1376 24.3829 13.1303 25.6255 13.1303H46.3732C47.6158 13.1303 48.6232 14.1376 48.6232 15.3803V21.1327C48.6232 21.5694 48.561 21.9916 48.4449 22.3909M48.6232 49.5059V49.338C48.6232 48.0954 47.6158 47.088 46.3732 47.088H25.6255C24.3829 47.088 23.3755 48.0954 23.3755 49.338V49.5052M48.6232 49.5059V56.6197C48.6232 57.8624 47.6158 58.8697 46.3732 58.8697H25.6255C24.3829 58.8697 23.3755 57.8624 23.3755 56.6197V49.5052M29.084 20.8405V33.7384M42.4719 20.8405V33.7384M40.2441 44.5138V49.7389M31.7537 44.5138V49.7389M28.9379 19.151C29.2468 20.2135 30.2276 20.99 31.3897 20.99H40.6078C41.77 20.99 42.7509 20.2134 43.0597 19.1508"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  vehicle: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 15.5V11.2l1.7-4.4A2 2 0 0 1 8.07 5.5h7.86a2 2 0 0 1 1.87 1.3l1.7 4.4v4.3M4.5 15.5h15M4.5 15.5v2a.5.5 0 0 0 .5.5h1.5a.5.5 0 0 0 .5-.5v-2M19.5 15.5v2a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5v-2M5 11.5h14M8 13.5h.01M16 13.5h.01"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export default ServiceSelection;
