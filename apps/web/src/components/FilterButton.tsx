import React from "react";
import { motion } from "framer-motion";

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
      className={`relative flex items-center gap-1.5 md:gap-2.5 px-4 md:px-5 py-2.5 min-h-[44px] whitespace-nowrap rounded-full transition-colors duration-200 border overflow-hidden ${
        active
          ? // The theme accent, via the token rather than a second copy of the
            // hex — `--th-brand` is what a skin or a scoped palette remaps, and
            // a literal #3BD9DA here would sit out any such remap.
            //
            // The glow stays a literal: there is no shadow token to follow. Note
            // that arbitrary values must not contain spaces — Tailwind can't
            // parse `rgba(59, 217, 218, 0.65)` and drops the whole class, which
            // is why this glow never rendered at first. Commas only.
            "bg-th-brand text-th-brand-fg border-th-brand shadow-[0_4px_16px_rgba(59,217,218,0.55)]"
          : isHero
            ? // Opaque white — no tint, no backdrop blur. Any translucent fill is
              // a veil that takes its colour from whatever it sits on: `bg-white/10`
              // read pale blue over the forest photo, and `bg-black/35` then read
              // brown over the sandstone one. Only a solid fill is the same colour
              // on every hero image the CMS can set.
              //
              // `border-transparent` rather than dropping the border: the shared
              // class above sets a 1px `border` for every state, so a state naming
              // no colour would fall back to Tailwind's default grey — and removing
              // the width here instead would resize the pill by 2px each time it
              // toggles to the bordered active state. The drop shadow, not a
              // hairline, is what separates the pill from a light photo.
              "bg-white text-[#0a1c1c] border-transparent shadow-[0_4px_14px_rgba(0,0,0,0.22)] hover:bg-[#e6fafa]"
            : "bg-white text-[#0a1c1c] border-[#E4E8F0] hover:border-[#3BD9DA] hover:bg-[#e6fafa] shadow-sm"
      }`}
    >
      {active && (
        <motion.span
          layoutId={isHero ? "hero-filter-pill" : "filter-pill"}
          className="absolute inset-0 rounded-full bg-th-brand"
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
