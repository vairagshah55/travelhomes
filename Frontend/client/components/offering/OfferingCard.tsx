import React from "react";
import { MoreHorizontal, Edit2, Eye, Trash2, MapPin, Users, Moon, Image as ImageIcon, IndianRupee } from "lucide-react";
import { type OfferDTO } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

const TEAL      = "#07e4e4";
const TEAL_BG   = "rgba(7, 228, 228, 0.07)";
const BLACK     = "#131313";
const GRAY_500  = "#6b6b6b";
const GRAY_400  = "#9a9a9a";
const GRAY_200  = "#e4e4e4";
const WHITE     = "#ffffff";
const SURFACE   = "#F7F8FA";
const GREEN     = "#16a34a";
const AMBER     = "#d97706";
const ERROR     = "#ef4444";

const STATUS: Record<string, { bg: string; color: string; border: string }> = {
  approved:  { bg: "#f0fdf4", color: GREEN, border: `${GREEN}25` },
  pending:   { bg: "#fffbeb", color: AMBER, border: `${AMBER}25` },
  cancelled: { bg: "#fef2f2", color: ERROR, border: `${ERROR}25` },
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
      style={{
        backgroundColor: WHITE,
        border: "1.5px solid #EBEBEB",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 200, overflow: "hidden", backgroundColor: SURFACE }}>
        {cover ? (
          <img src={getImageUrl(cover)} alt={listing.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ImageIcon size={36} color={GRAY_200} />
          </div>
        )}

        {/* Status + menu overlay */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: "capitalize", backdropFilter: "blur(4px)" }}>
            {status}
          </span>

          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => onToggleDropdown(id)}
              style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.9)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <MoreHorizontal size={14} color={GRAY_500} />
            </button>
            {showDropdown === id && (
              <div style={{ position: "absolute", right: 0, top: 38, width: 160, backgroundColor: WHITE, border: "1.5px solid #EBEBEB", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", overflow: "hidden", zIndex: 20 }}>
                {[
                  { icon: <Edit2 size={13} />, label: "Edit", action: () => onEdit(listing), color: GRAY_500 },
                  { icon: <Eye size={13} />, label: "View Details", action: () => onCardClick(id), color: GRAY_500 },
                  ...(status !== "approved" ? [{ icon: <Trash2 size={13} />, label: "Delete", action: () => onDelete(id), color: ERROR }] : []),
                ].map((item) => (
                  <button key={item.label} type="button" onClick={item.action}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", backgroundColor: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: item.color, transition: "background-color 0.1s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}>
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category */}
        <div style={{ position: "absolute", bottom: 12, left: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, backgroundColor: "rgba(0,0,0,0.5)", color: WHITE, backdropFilter: "blur(4px)" }}>
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px 16px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: BLACK, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {listing.name}
        </h3>
        {location && (
          <p style={{ fontSize: 12, color: GRAY_400, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={11} /> {location}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: GRAY_400, marginBottom: 12 }}>
          {seats > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={12} /> {seats} seats</span>}
          {seats > 0 && sleeps > 0 && <span style={{ color: GRAY_200 }}>·</span>}
          {sleeps > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Moon size={12} /> {sleeps} sleeps</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 800, color: BLACK }}>₹{price.toLocaleString("en-IN")}</span>
            <span style={{ fontSize: 11, color: GRAY_400, marginLeft: 4 }}>/ day</span>
          </div>
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onCardClick(id); }}
            style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 99, border: `1.5px solid ${TEAL}`, backgroundColor: TEAL_BG, color: TEAL, cursor: "pointer", transition: "all 0.15s" }}>
            View
          </button>
        </div>
      </div>
    </div>
  );
};
