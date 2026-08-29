import React from "react";
import { motion } from "framer-motion";

/**
 * The corner radius shared by every category button on the storefront.
 *
 * Four places need it and they are easy to change independently: this card, the
 * `layoutId` highlight that slides underneath it, and the same two in
 * SiteHeader's hand-rolled sticky tabs. Mismatch them and you get a pill-shaped
 * fill animating under a rectangular card, or a header that changes shape the
 * moment you scroll past the hero. Exported so there is one value, not four.
 *
 * 8px, not the 12px this started at: radius reads relative to height, and on a
 * 48px control 12px is a quarter of the box, which looks rounder than the
 * number suggests. 8px is the ratio most product UIs land on at this size.
 */
export const CATEGORY_BUTTON_RADIUS = "rounded-[8px]";

function FilterButton({
  icon: Icon,
  label,
  active = false,
  onClick,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  variant?: "default" | "hero";
}) {
  const isHero = variant === "hero";

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`relative flex items-center gap-1.5 md:gap-2.5 whitespace-nowrap transition-colors duration-200 border overflow-hidden ${
        /* Geometry is per-variant, because only the hero was redesigned. The
           `default` variant still renders the sticky header row and the search
           page's filter chips, where a 56px-tall card would be a different
           control in a different context — those stay pills until asked. The
           gap and the icon/label structure are shared, so alignment reads the
           same in both. */
        isHero
          ? /* Equal width via a min-width floor, plus `justify-center` so the
               icon+label sit in the middle of the wider box rather than hugging
               the left edge of it. The floor clears the longest label the hero
               renders ("Vehicle Rental", ~87px at 14px/600 Inter with
               tracking-tight) with room to spare, so all four categories come
               out identical. Height is a flat h-12 (48px) at every width —
               compact, and identical across breakpoints so the row never
               changes height as it reflows.

               Measured at 1512px: the labels render 73 / 78 / 84px wide, so the
               widest button needs 84 + 20 (icon) + 10 (gap) + 40 (padding) + 2
               (border) = 156px. The 160px floor clears that by 4px. Anything
               below ~156px stops being a floor for "Vehicle Rental", it starts
               widening past the others, and the equal-width look breaks — so
               re-measure before lowering it.

               A floor rather than a fixed width on purpose: if a label ever
               outgrows it, that button widens instead of clipping its text.
               The trade is that such a label would break the equal-width look
               — worth knowing before renaming a category. A grid with
               `auto-cols-fr` would enforce equality with no magic number, but
               that means restyling the hero's row container, which also owns
               the overflow-x snap rail. */
            `px-4 md:px-5 h-12 min-w-[136px] md:min-w-[160px] justify-center ${CATEGORY_BUTTON_RADIUS}`
          : "px-4 md:px-5 py-2.5 min-h-[44px] rounded-full"
      } ${
        active
          ? isHero
            ? // Turquoise via the token, not a second copy of the hex —
              // `--th-brand` is what a skin or a scoped palette remaps.
              //
              // Two soft layers rather than the old single 0.55 cyan glow: a
              // 1px contact shadow to seat the card, and a wider tinted one at
              // 0.20 to lift it. The loud glow read as a 2019 CTA; this keeps
              // the colour without the halo. The hairline is WHITE, not
              // `border-th-brand` — a turquoise border on a turquoise fill is
              // invisible, so the active card had no edge while the inactive
              // ones did. Arbitrary values must not contain SPACES — Tailwind
              // can't parse `rgba(59, 217, 218, 0.55)` and silently drops the
              // whole class, which is why the original glow never rendered.
              // Commas, including the one separating the two shadows, are fine.
              "bg-th-brand text-th-brand-fg border-white/30 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(59,217,218,0.20)]"
            : "bg-th-brand text-th-brand-fg border-th-brand shadow-[0_4px_16px_rgba(59,217,218,0.55)]"
          : isHero
            ? // Opaque white — no tint, no backdrop blur. Any translucent fill is
              // a veil that takes its colour from whatever it sits on: `bg-white/10`
              // read pale blue over the forest photo, and `bg-black/35` then read
              // brown over the sandstone one. Only a solid fill is the same colour
              // on every hero image the CMS can set.
              //
              // The 1px hairline is back by request, and it has to be a real
              // colour: the shared class above sets `border` for every state, so
              // naming none falls back to Tailwind's default grey. #E4E8F0 is the
              // same hairline the default variant already uses.
              "bg-white text-[#0a1c1c] border-[#E4E8F0] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(16,24,40,0.06)] hover:border-[#CBD5E1] hover:bg-[#FAFBFC]"
            : "bg-white text-[#0a1c1c] border-[#E4E8F0] hover:border-[#3BD9DA] hover:bg-[#e6fafa] shadow-sm"
      }`}
    >
      {active && (
        <motion.span
          layoutId={isHero ? "hero-filter-pill" : "filter-pill"}
          className={`absolute inset-0 bg-th-brand ${isHero ? CATEGORY_BUTTON_RADIUS : "rounded-full"}`}
          transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.6 }}
        />
      )}
      <div className="relative z-10 w-5 h-5 flex items-center justify-center flex-shrink-0">
        <Icon
          className={`w-4 h-4 transition-colors duration-150 ${
            active ? "text-th-brand-fg" : "text-[#5F6A82]"
          }`}
        />
      </div>
      <span className="relative z-10 text-[13px] md:text-sm font-semibold capitalize tracking-tight">
        {label}
      </span>
    </motion.button>
  );
}

export default FilterButton;
