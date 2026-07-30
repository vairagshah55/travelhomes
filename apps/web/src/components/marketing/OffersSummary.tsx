import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Tag } from "lucide-react";
import { Panel, PanelHead, StatusBadge } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { OfferDTO } from "@/lib/api";
import { inr, mediaUrl } from "./api";

/**
 * Cross-link into /marketing/offers. Reads the same cached query the offers
 * page uses, so the three rows here and the table there can never disagree.
 */
export const OffersSummary: React.FC<{
  offers: OfferDTO[];
  total: number;
  isLoading: boolean;
}> = ({ offers, total, isLoading }) => {
  const navigate = useNavigate();
  const recent = offers.slice(0, 3);

  return (
    <Panel>
      <PanelHead
        icon={Tag}
        title="Offers"
        blurb={total === 1 ? "1 offering listed" : `${total} offerings listed`}
      />

      <div className="p-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-1/3 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="px-2 py-6 text-center space-y-3">
            <p className="text-[12.5px] text-muted-foreground">
              You haven&apos;t listed an offering yet.
            </p>
            <button
              onClick={() => navigate("/offering/add")}
              className="h-9 px-4 rounded-xl bg-brand/[0.09] text-brand text-[12.5px] font-semibold hover:bg-brand/[0.16] transition-colors"
            >
              Add an offering
            </button>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {recent.map((offer) => (
              <li key={offer._id}>
                <button
                  onClick={() => navigate(`/offering/${offer._id}`)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-xl text-left outline-none",
                    "hover:bg-muted/70 dark:hover:bg-white/[0.04]",
                    "focus-visible:ring-2 focus-visible:ring-brand/40 transition-colors duration-150",
                  )}
                >
                  {offer.photos?.coverUrl ? (
                    <img
                      src={mediaUrl(offer.photos.coverUrl)}
                      alt=""
                      loading="lazy"
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.5px] font-semibold text-foreground truncate">
                      {offer.name}
                    </span>
                    <span className="block text-[11px] text-muted-foreground tabular-nums">
                      {inr(offer.regularPrice)}
                    </span>
                  </span>
                  <StatusBadge status={offer.status || "pending"} size="sm" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="px-3 pb-3">
        <button
          onClick={() => navigate("/marketing/offers")}
          className={cn(
            "w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-xl outline-none",
            "bg-brand/[0.09] text-brand text-[12.5px] font-semibold",
            "hover:bg-brand/[0.16] focus-visible:ring-2 focus-visible:ring-brand/40",
            "transition-colors duration-150",
          )}
        >
          Manage offers
          <ArrowRight size={14} strokeWidth={2.4} />
        </button>
      </footer>
    </Panel>
  );
};

export default OffersSummary;
