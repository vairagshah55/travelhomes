import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Section from "../Section";
import DefaultCard from "../DefaultCard";
import ResultCard from "../ResultCard";
import { CardGridSkeleton } from "./skeletons";
import { ScrollReveal } from "./ScrollReveal";

type FilterType = "camper-van" | "unique-stays" | "activity";

interface CardItem {
  id: string; title: string; details: string; price: string;
  Maxprice?: string | number; unit: string; image: string; images?: string[];
}

interface OfferSectionsProps {
  activeFilter: FilterType;
  homepageSections: Record<string, boolean>;
  loadingOffers: boolean;
  offerError: string | null;
  caravanShown: CardItem[];
  stayShown: CardItem[];
  activityShown: CardItem[];
}

const MAX_SECONDARY = 5;

const ViewAllLink = ({ href }: { href: string }) => (
  <Link
    to={href}
    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
  >
    View all <ChevronRight className="w-4 h-4" />
  </Link>
);

const ErrorMsg = () => (
  <p className="text-red-500 text-center py-8">Failed to load offers. Please try again later.</p>
);

/* ── Wraps a Section with scroll-reveal and its own skeleton ───────────────── */
function OfferSection({
  title, subtitle, sectionId, loading, error, children, viewAllHref,
}: {
  title: string; subtitle: string; sectionId?: string;
  loading: boolean; error: string | null;
  children: React.ReactNode; viewAllHref?: string;
}) {
  return (
    <ScrollReveal>
      <Section
        title={title}
        subtitle={subtitle}
        className="py-8 md:py-12"
        sectionId={sectionId}
        rightContent={viewAllHref ? <ViewAllLink href={viewAllHref} /> : undefined}
      >
        {loading  ? <CardGridSkeleton count={4} />  : null}
        {error    ? <ErrorMsg />                     : null}
        {!loading && !error ? children : null}
      </Section>
    </ScrollReveal>
  );
}

export function OfferSections({
  activeFilter, homepageSections, loadingOffers, offerError,
  caravanShown, stayShown, activityShown,
}: OfferSectionsProps) {
  const caravanPreview  = caravanShown.slice(0,  MAX_SECONDARY);
  const stayPreview     = stayShown.slice(0,     MAX_SECONDARY);
  const activityPreview = activityShown.slice(0, MAX_SECONDARY);

  return (
    <>
      {/* ── Primary section (matches active filter) ── */}
      {activeFilter === "camper-van" && homepageSections["camper-van"] && (
        <OfferSection title="Top Camper Vans" subtitle="Roam free — handpicked vans for every kind of journey" sectionId="camper-van" loading={loadingOffers} error={offerError} viewAllHref="/search?filter=camper-van">
          <ResultCard activeFilter={activeFilter} ResultactivityShown={activityShown} ResultstayShown={stayShown} ResultcaravanShown={caravanShown} />
        </OfferSection>
      )}

      {activeFilter === "unique-stays" && homepageSections["unique-stays"] && (
        <OfferSection title="Unique Stays" subtitle="One-of-a-kind places you won't find anywhere else" sectionId="unique-stays" loading={loadingOffers} error={offerError} viewAllHref="/search?filter=unique-stays">
          <ResultCard activeFilter={activeFilter} ResultactivityShown={activityShown} ResultstayShown={stayShown} ResultcaravanShown={caravanShown} />
        </OfferSection>
      )}

      {activeFilter === "activity" && homepageSections["best-activity"] && (
        <OfferSection title="Best Activities" subtitle="Adventures worth taking, experiences worth having" sectionId="activity" loading={loadingOffers} error={offerError} viewAllHref="/search?filter=activity">
          <ResultCard activeFilter={activeFilter} ResultactivityShown={activityShown} ResultstayShown={stayShown} ResultcaravanShown={caravanShown} />
        </OfferSection>
      )}

      {/* ── Secondary sections (max 5, with View all link) ── */}
      {activeFilter === "camper-van" && (
        <>
          {homepageSections["unique-stays"] && (
            <OfferSection title="Unique Stays" subtitle="Handpicked for every kind of traveler" sectionId="unique-stays" loading={loadingOffers} error={offerError} viewAllHref="/search?filter=unique-stays">
              <DefaultCard activeFilter={activeFilter} CardData={stayPreview} />
            </OfferSection>
          )}
          {homepageSections["best-activity"] && (
            <OfferSection title="Best Activity" subtitle="Handpicked for every kind of traveler" sectionId="activity" loading={loadingOffers} error={offerError} viewAllHref="/search?filter=activity">
              <DefaultCard CardData={activityPreview} activeFilter={activeFilter} />
            </OfferSection>
          )}
        </>
      )}

      {activeFilter === "unique-stays" && (
        <>
          {homepageSections["camper-van"] && (
            <OfferSection title="Stay at our top Camper Van" subtitle="Handpicked for every kind of traveler" sectionId="camper-van" loading={loadingOffers} error={offerError} viewAllHref="/search?filter=camper-van">
              <DefaultCard CardData={caravanPreview} activeFilter={activeFilter} />
            </OfferSection>
          )}
          {homepageSections["best-activity"] && (
            <OfferSection title="Best Activity" subtitle="Handpicked for every kind of traveler" sectionId="activity" loading={loadingOffers} error={offerError} viewAllHref="/search?filter=activity">
              <DefaultCard CardData={activityPreview} activeFilter={activeFilter} />
            </OfferSection>
          )}
        </>
      )}

      {activeFilter === "activity" && (
        <>
          {homepageSections["camper-van"] && (
            <OfferSection title="Stay at our top Camper Van" subtitle="Handpicked for every kind of traveler" sectionId="camper-van" loading={loadingOffers} error={offerError} viewAllHref="/search?filter=camper-van">
              <DefaultCard CardData={caravanPreview} activeFilter={activeFilter} />
            </OfferSection>
          )}
          {homepageSections["unique-stays"] && (
            <OfferSection title="Unique Stays" subtitle="Handpicked for every kind of traveler" sectionId="unique-stays" loading={loadingOffers} error={offerError} viewAllHref="/search?filter=unique-stays">
              <DefaultCard CardData={stayPreview} activeFilter={activeFilter} />
            </OfferSection>
          )}
        </>
      )}
    </>
  );
}
