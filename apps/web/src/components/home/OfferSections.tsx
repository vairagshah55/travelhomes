import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Section from "../Section";
import ResultCard from "../ResultCard";
import { CardGridSkeleton } from "./skeletons";
import { ScrollReveal } from "./ScrollReveal";

type FilterType = "camper-van" | "unique-stays" | "activity" | "vehicle-rental";

interface CardItem {
  id: string;
  title: string;
  details: string;
  price: string;
  Maxprice?: string | number;
  unit: string;
  image: string;
  images?: string[];
}

interface OfferSectionsProps {
  activeFilter: FilterType;
  homepageSections: Record<string, boolean>;
  loadingOffers: boolean;
  offerError: string | null;
  caravanShown: CardItem[];
  stayShown: CardItem[];
  activityShown: CardItem[];
  // Optional so Index can adopt this one section at a time; an absent list
  // renders as "no vehicles yet" rather than crashing on .slice.
  vehicleShown?: CardItem[];
}

const MAX_SECONDARY = 5;

const ViewAllLink = ({ href }: { href: string }) => (
  <Link
    to={href}
    className="inline-flex items-center gap-1 text-sm font-semibold text-[#0a1c1c] underline underline-offset-2 hover:text-[#717171] transition-colors"
  >
    View all <ChevronRight className="w-4 h-4" />
  </Link>
);

const ErrorMsg = () => (
  <p className="text-red-500 text-center py-8">Failed to load offers. Please try again later.</p>
);

/* ── Wraps a Section with scroll-reveal and its own skeleton ───────────────── */
function OfferSection({
  title,
  subtitle,
  sectionId,
  loading,
  error,
  hasItems,
  children,
  viewAllHref,
}: {
  title: string;
  subtitle: string;
  sectionId?: string;
  loading: boolean;
  error: string | null;
  /** Whether this section's own list has anything approved to show. */
  hasItems: boolean;
  children: React.ReactNode;
  viewAllHref?: string;
}) {
  // Once the fetch has settled with nothing in this category, drop the whole
  // section — otherwise the heading and its "View all" link sit above an empty
  // strip. Kept after loading/error so the skeleton and the failure message
  // still get a chance to render.
  if (!loading && !error && !hasItems) return null;

  return (
    <ScrollReveal>
      <Section
        title={title}
        subtitle={subtitle}
        // Tighter top padding than the old py-8/12 (bottom kept as-is): the
        // landing page wants the first card row visible closer to the fold,
        // right under the hero. lg:short: tightens further on windows under
        // 820px tall — see tailwind.config's `short` screen.
        className="pt-5 pb-8 md:pt-7 md:pb-12 lg:short:pt-3"
        sectionId={sectionId}
        rightContent={viewAllHref ? <ViewAllLink href={viewAllHref} /> : undefined}
      >
        {loading ? <CardGridSkeleton count={4} /> : null}
        {error ? <ErrorMsg /> : null}
        {!loading && !error ? children : null}
      </Section>
    </ScrollReveal>
  );
}

export function OfferSections({
  activeFilter,
  homepageSections,
  loadingOffers,
  offerError,
  caravanShown,
  stayShown,
  activityShown,
  vehicleShown = [],
}: OfferSectionsProps) {
  const caravanPreview = caravanShown.slice(0, MAX_SECONDARY);
  const stayPreview = stayShown.slice(0, MAX_SECONDARY);
  const activityPreview = activityShown.slice(0, MAX_SECONDARY);
  const vehiclePreview = vehicleShown.slice(0, MAX_SECONDARY);

  /** Secondary "Vehicle Rental" strip, shown under every other primary tab. */
  const vehicleSecondary = homepageSections["vehicle-rental"] ? (
    <OfferSection
      title="Vehicle Rental"
      subtitle="Cars, vans and buses — self-drive or with a driver"
      sectionId="vehicle-rental"
      loading={loadingOffers}
      error={offerError}
      hasItems={vehiclePreview.length > 0}
      viewAllHref="/search?filter=vehicle-rental"
    >
      <ResultCard
        activeFilter="vehicle-rental"
        ResultvehicleShown={vehiclePreview}
        ResultcaravanShown={[]}
        ResultstayShown={[]}
        ResultactivityShown={[]}
      />
    </OfferSection>
  ) : null;

  return (
    <>
      {/* ── Primary section (matches active filter) ── */}
      {activeFilter === "camper-van" && homepageSections["camper-van"] && (
        <OfferSection
          title="Top Camper Vans"
          subtitle="Roam free — handpicked vans for every kind of journey"
          sectionId="camper-van"
          loading={loadingOffers}
          error={offerError}
          hasItems={caravanShown.length > 0}
          viewAllHref="/search?filter=camper-van"
        >
          <ResultCard
            activeFilter={activeFilter}
            ResultactivityShown={activityShown}
            ResultstayShown={stayShown}
            ResultcaravanShown={caravanShown}
          />
        </OfferSection>
      )}

      {activeFilter === "unique-stays" && homepageSections["unique-stays"] && (
        <OfferSection
          title="Unique Stays"
          subtitle="One-of-a-kind places you won't find anywhere else"
          sectionId="unique-stays"
          loading={loadingOffers}
          error={offerError}
          hasItems={stayShown.length > 0}
          viewAllHref="/search?filter=unique-stays"
        >
          <ResultCard
            activeFilter={activeFilter}
            ResultactivityShown={activityShown}
            ResultstayShown={stayShown}
            ResultcaravanShown={caravanShown}
          />
        </OfferSection>
      )}

      {activeFilter === "activity" && homepageSections["best-activity"] && (
        <OfferSection
          title="Best Activities"
          subtitle="Adventures worth taking, experiences worth having"
          sectionId="activity"
          loading={loadingOffers}
          error={offerError}
          hasItems={activityShown.length > 0}
          viewAllHref="/search?filter=activity"
        >
          <ResultCard
            activeFilter={activeFilter}
            ResultactivityShown={activityShown}
            ResultstayShown={stayShown}
            ResultcaravanShown={caravanShown}
          />
        </OfferSection>
      )}

      {activeFilter === "vehicle-rental" && homepageSections["vehicle-rental"] && (
        <OfferSection
          title="Vehicle Rental"
          subtitle="Cars, vans and buses — self-drive or with a driver"
          sectionId="vehicle-rental"
          loading={loadingOffers}
          error={offerError}
          hasItems={vehicleShown.length > 0}
          viewAllHref="/search?filter=vehicle-rental"
        >
          <ResultCard
            activeFilter={activeFilter}
            ResultvehicleShown={vehicleShown}
            ResultactivityShown={activityShown}
            ResultstayShown={stayShown}
            ResultcaravanShown={caravanShown}
          />
        </OfferSection>
      )}

      {/* ── Secondary sections (max 5, with View all link) ──
          Use ResultCard (same component as the primary section above) so the
          card UI — shimmer wrap, hover-reveal heart, "Saved" badge, price
          styling — is identical across primary + secondary. Pass each
          section's *own* type as `activeFilter` (it controls which of the 3
          lists ResultCard renders + the wishlist item type on heart-click);
          the unrelated lists go in as empty arrays. */}
      {activeFilter === "camper-van" && (
        <>
          {homepageSections["unique-stays"] && (
            <OfferSection
              title="Unique Stays"
              subtitle="Handpicked for every kind of traveler"
              sectionId="unique-stays"
              loading={loadingOffers}
              error={offerError}
              hasItems={stayPreview.length > 0}
              viewAllHref="/search?filter=unique-stays"
            >
              <ResultCard
                activeFilter="unique-stays"
                ResultstayShown={stayPreview}
                ResultcaravanShown={[]}
                ResultactivityShown={[]}
              />
            </OfferSection>
          )}
          {homepageSections["best-activity"] && (
            <OfferSection
              title="Best Activity"
              subtitle="Handpicked for every kind of traveler"
              sectionId="activity"
              loading={loadingOffers}
              error={offerError}
              hasItems={activityPreview.length > 0}
              viewAllHref="/search?filter=activity"
            >
              <ResultCard
                activeFilter="activity"
                ResultactivityShown={activityPreview}
                ResultcaravanShown={[]}
                ResultstayShown={[]}
              />
            </OfferSection>
          )}
          {vehicleSecondary}
        </>
      )}

      {activeFilter === "unique-stays" && (
        <>
          {homepageSections["camper-van"] && (
            <OfferSection
              title="Stay at our top Camper Van"
              subtitle="Handpicked for every kind of traveler"
              sectionId="camper-van"
              loading={loadingOffers}
              error={offerError}
              hasItems={caravanPreview.length > 0}
              viewAllHref="/search?filter=camper-van"
            >
              <ResultCard
                activeFilter="camper-van"
                ResultcaravanShown={caravanPreview}
                ResultstayShown={[]}
                ResultactivityShown={[]}
              />
            </OfferSection>
          )}
          {homepageSections["best-activity"] && (
            <OfferSection
              title="Best Activity"
              subtitle="Handpicked for every kind of traveler"
              sectionId="activity"
              loading={loadingOffers}
              error={offerError}
              hasItems={activityPreview.length > 0}
              viewAllHref="/search?filter=activity"
            >
              <ResultCard
                activeFilter="activity"
                ResultactivityShown={activityPreview}
                ResultcaravanShown={[]}
                ResultstayShown={[]}
              />
            </OfferSection>
          )}
          {vehicleSecondary}
        </>
      )}

      {activeFilter === "activity" && (
        <>
          {homepageSections["camper-van"] && (
            <OfferSection
              title="Stay at our top Camper Van"
              subtitle="Handpicked for every kind of traveler"
              sectionId="camper-van"
              loading={loadingOffers}
              error={offerError}
              hasItems={caravanPreview.length > 0}
              viewAllHref="/search?filter=camper-van"
            >
              <ResultCard
                activeFilter="camper-van"
                ResultcaravanShown={caravanPreview}
                ResultstayShown={[]}
                ResultactivityShown={[]}
              />
            </OfferSection>
          )}
          {homepageSections["unique-stays"] && (
            <OfferSection
              title="Unique Stays"
              subtitle="Handpicked for every kind of traveler"
              sectionId="unique-stays"
              loading={loadingOffers}
              error={offerError}
              hasItems={stayPreview.length > 0}
              viewAllHref="/search?filter=unique-stays"
            >
              <ResultCard
                activeFilter="unique-stays"
                ResultstayShown={stayPreview}
                ResultcaravanShown={[]}
                ResultactivityShown={[]}
              />
            </OfferSection>
          )}
          {vehicleSecondary}
        </>
      )}

      {activeFilter === "vehicle-rental" && (
        <>
          {homepageSections["camper-van"] && (
            <OfferSection
              title="Stay at our top Camper Van"
              subtitle="Handpicked for every kind of traveler"
              sectionId="camper-van"
              loading={loadingOffers}
              error={offerError}
              hasItems={caravanPreview.length > 0}
              viewAllHref="/search?filter=camper-van"
            >
              <ResultCard
                activeFilter="camper-van"
                ResultcaravanShown={caravanPreview}
                ResultstayShown={[]}
                ResultactivityShown={[]}
              />
            </OfferSection>
          )}
          {homepageSections["unique-stays"] && (
            <OfferSection
              title="Unique Stays"
              subtitle="Handpicked for every kind of traveler"
              sectionId="unique-stays"
              loading={loadingOffers}
              error={offerError}
              hasItems={stayPreview.length > 0}
              viewAllHref="/search?filter=unique-stays"
            >
              <ResultCard
                activeFilter="unique-stays"
                ResultstayShown={stayPreview}
                ResultcaravanShown={[]}
                ResultactivityShown={[]}
              />
            </OfferSection>
          )}
          {homepageSections["best-activity"] && (
            <OfferSection
              title="Best Activity"
              subtitle="Handpicked for every kind of traveler"
              sectionId="activity"
              loading={loadingOffers}
              error={offerError}
              hasItems={activityPreview.length > 0}
              viewAllHref="/search?filter=activity"
            >
              <ResultCard
                activeFilter="activity"
                ResultactivityShown={activityPreview}
                ResultcaravanShown={[]}
                ResultstayShown={[]}
              />
            </OfferSection>
          )}
        </>
      )}
    </>
  );
}
