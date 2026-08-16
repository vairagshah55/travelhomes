import React from "react";
import {
  Edit2,
  Eye,
  Image as ImageIcon,
  MapPin,
  MoreHorizontal,
  Moon,
  Trash2,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRAND_VARS, PANEL, StatusBadge } from "@/components/shared";
import { type OfferDTO } from "@/lib/api";
import { cn, getImageUrl } from "@/lib/utils";

const MENU_ITEM =
  "cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold " +
  "focus:bg-brand/[0.1] focus:text-brand data-[highlighted]:bg-brand/[0.1] data-[highlighted]:text-brand";

const MENU_ITEM_DANGER =
  "cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-red-600 " +
  "focus:bg-red-50 focus:text-red-700 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700 " +
  "dark:focus:bg-red-500/10 dark:data-[highlighted]:bg-red-500/10";

/**
 * Listing card for the vendor Offerings grid. Built on the kit's PANEL surface
 * so a card reads as a panel that happens to hold a photo, and on the shared
 * StatusBadge so "approved / pending" looks the same here as in every table.
 */
export const OfferingCard = ({
  listing,
  onDelete,
  onEdit,
  onCardClick,
}: {
  listing: OfferDTO;
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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardClick(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCardClick(id);
        }
      }}
      className={cn(
        PANEL,
        "group flex flex-col overflow-hidden cursor-pointer outline-none",
        "transition-[transform,box-shadow] duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(59,217,218,0.28),0_18px_40px_-20px_rgba(59,217,218,0.65)]",
        "focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:border-brand",
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          <img
            src={getImageUrl(cover)}
            alt={listing.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <ImageIcon size={32} className="text-muted-foreground/40" strokeWidth={1.6} />
          </div>
        )}

        {/* Scrim so the category chip stays legible on light photos. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent"
        />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <StatusBadge status={status} size="sm" className="shadow-sm" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                aria-label={`Actions for ${listing.name}`}
                className="grid place-items-center w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 text-[#475467] dark:text-gray-200 shadow-[0_2px_8px_rgba(16,24,40,0.14)] backdrop-blur-sm outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              style={BRAND_VARS}
              className="w-[168px] p-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem className={MENU_ITEM} onClick={() => onEdit(listing)}>
                <Edit2 size={13} /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className={MENU_ITEM} onClick={() => onCardClick(id)}>
                <Eye size={13} /> View details
              </DropdownMenuItem>
              {/* Approved listings are live — deletion goes through support. */}
              {status !== "approved" && (
                <DropdownMenuItem className={MENU_ITEM_DANGER} onClick={() => onDelete(id)}>
                  <Trash2 size={13} /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
          {category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-[14px] font-bold tracking-[-0.01em] text-foreground truncate">
          {listing.name}
        </h3>

        {location && (
          <p className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground truncate">
            <MapPin size={11} className="shrink-0" />
            {location}
          </p>
        )}

        {(seats > 0 || sleeps > 0) && (
          <div className="mt-2.5 flex items-center gap-2 text-[12px] text-muted-foreground">
            {seats > 0 && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Users size={12} /> {seats} seats
              </span>
            )}
            {seats > 0 && sleeps > 0 && <span className="text-border">·</span>}
            {sleeps > 0 && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Moon size={12} /> {sleeps} sleeps
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3.5 flex items-end justify-between gap-2">
          <p className="min-w-0">
            <span className="text-[18px] font-bold tracking-[-0.02em] tabular-nums text-foreground">
              ₹{price.toLocaleString("en-IN")}
            </span>
            <span className="ml-1 text-[11px] text-muted-foreground">/ day</span>
          </p>
          <span className="shrink-0 rounded-full bg-brand/[0.09] px-3 py-1.5 text-[12px] font-semibold text-brand transition-colors duration-150 group-hover:bg-brand group-hover:text-brand-fg">
            View
          </span>
        </div>
      </div>
    </div>
  );
};
