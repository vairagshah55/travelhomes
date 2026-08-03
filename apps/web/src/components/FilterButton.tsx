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
          ? // Arbitrary values must not contain spaces — Tailwind can't parse
            // `rgba(59, 217, 218, 0.65)` and drops the whole class, which is why
            // this glow never rendered. Commas only.
            "bg-[#3BD9DA] text-white border-[#3BD9DA] shadow-[0_4px_16px_rgba(59,217,218,0.55)]"
          : isHero
            ? "bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 hover:border-white/40"
            : "bg-white text-[#0a1c1c] border-[#E4E8F0] hover:border-[#3BD9DA] hover:bg-[#e6fafa] shadow-sm"
      }`}
    >
      {active && (
        <motion.span
          layoutId={isHero ? "hero-filter-pill" : "filter-pill"}
          className="absolute inset-0 rounded-full bg-[#3BD9DA]"
          transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.6 }}
        />
      )}
      <div className="relative z-10 w-5 h-5 flex items-center justify-center flex-shrink-0">
        <Icon
          className={`w-4 h-4 transition-colors duration-150 ${
            active ? "text-white" : isHero ? "text-white/90" : "text-[#5F6A82]"
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
