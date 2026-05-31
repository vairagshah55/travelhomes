import React from "react";
import { MoreHorizontal, Edit2, Eye, Trash2, MapPin, Users, Moon, Image as ImageIcon, IndianRupee } from "lucide-react";
import { type OfferDTO, offersApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Status colors kept as data objects since they come from non-token palette
// (semantic green/amber/red for approved/pending/cancelled — not th-brand).
const STATUS: Record<string, { bg: string; color: string; border: string }> = {
  approved:  { bg: "#f0fdf4", color: "#16a34a", border: "#16a34a25" },
  pending:   { bg: "#fffbeb", color: "#d97706", border: "#d9770625" },
  cancelled: { bg: "#fef2f2", color: "#ef4444", border: "#ef444425" },
};

export const OfferingCard = ({ listing, showDropdown, onToggleDropdown, onDelete, onEdit, onCardClick }: {
  listing: OfferDTO;
  showDropdown: string | null;
  onToggleDropdown: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (offer: OfferDTO) => void;
  onCardClick: (id: string) => void;
}) => {
  const id = listing._id!;
  const cover = listing.photos?.coverUrl || "";
  const category = listing.category || "Offer";
  const seats = Number(listing.seatingCapacity || 0);
  const sleeps = Number(listing.sleepingCapacity || 0);
  const price = Number(listing.regularPrice || 0);
  const status = (listing.status || "pending") as string;
  const location = [listing.city, listing.state].filter(Boolean).join(", ");
  const s = STATUS[status] || STATUS.pending;

  return (
    <div
      onClick={() => onCardClick(id)}
      className="bg-th-surface-0 border border-[#EBEBEB] rounded-[20px] overflow-hidden cursor-pointer transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)] hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
    >
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden bg-th-warm-surface">
        {cover ? (
          <img src={getImageUrl(cover)} alt={listing.name} className="w-full h-full object-cover transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={36} className="text-th-warm-border" />
          </div>
        )}

        {/* Status + menu overlay */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <span
            className="text-[11px] font-bold px-2.5 py-[3px] rounded-full capitalize backdrop-blur-sm"
            style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}
          >
            {status}
          </span>

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onToggleDropdown(id)}
              className="w-8 h-8 rounded-full bg-white/90 border-none flex items-center justify-center cursor-pointer backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
            >
              <MoreHorizontal size={14} className="text-th-warm-text-dark" />
            </button>
            {showDropdown === id && (
              <div className="absolute right-0 top-[38px] w-[160px] bg-th-surface-0 border border-[#EBEBEB] rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden z-20">
                {[
                  { icon: <Edit2 size={13} />, label: "Edit", action: () => onEdit(listing), danger: false },
                  { icon: <Eye size={13} />, label: "View Details", action: () => onCardClick(id), danger: false },
                  ...(status !== "approved" ? [{ icon: <Trash2 size={13} />, label: "Delete", action: () => onDelete(id), danger: true }] : []),
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-transparent border-none cursor-pointer text-[13px] font-semibold transition-colors hover:bg-th-warm-surface",
                      item.danger ? "text-th-error-bright" : "text-th-warm-text-dark",
                    )}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="absolute bottom-3 left-3">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/50 text-th-text-inverse backdrop-blur-sm">
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 pt-3.5">
        <h3 className="text-[14px] font-bold text-th-text-primary mb-[2px] whitespace-nowrap overflow-hidden text-ellipsis">
          {listing.name}
        </h3>
        {location && (
          <p className="text-[12px] text-th-warm-text-muted mb-2.5 flex items-center gap-1">
            <MapPin size={11} /> {location}
          </p>
        )}
        <div className="flex items-center gap-2 text-[12px] text-th-warm-text-muted mb-3">
          {seats > 0 && <span className="flex items-center gap-[3px]"><Users size={12} /> {seats} seats</span>}
          {seats > 0 && sleeps > 0 && <span className="text-th-warm-border">·</span>}
          {sleeps > 0 && <span className="flex items-center gap-[3px]"><Moon size={12} /> {sleeps} sleeps</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[18px] font-extrabold text-th-text-primary">₹{price.toLocaleString("en-IN")}</span>
            <span className="text-[11px] text-th-warm-text-muted ml-1">/ day</span>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCardClick(id); }}
            className="text-[12px] font-bold px-3.5 py-1.5 rounded-full border border-th-brand bg-th-brand-soft text-th-brand cursor-pointer transition-all"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
};
