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
      className={`relative flex items-center gap-2 md:gap-2.5 px-5 py-2.5 rounded-full transition-all duration-300 border overflow-hidden ${
        active
          ? isHero
            ? "bg-white text-[#222222] border-white shadow-[0_4px_20px_rgba(255,255,255,0.25)]"
            : "bg-[#222222] text-white border-[#222222] shadow-sm"
          : isHero
          ? "bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 hover:border-white/40"
          : "bg-white text-[#222222] border-[#DDDDDD] hover:border-[#222222] hover:bg-[#F7F7F7] shadow-sm"
      }`}
    >
      {active && (
        <motion.span
          layoutId={isHero ? "hero-filter-pill" : "filter-pill"}
          className="absolute inset-0 rounded-full"
          style={{
            background: isHero ? "white" : "#222222",
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <div className="relative z-10 w-5 h-5 flex items-center justify-center flex-shrink-0">
        <Icon
          className={`w-4 h-4 transition-colors duration-200 ${
            active && isHero
              ? "text-[#222222]"
              : isHero
              ? "text-white/90"
              : active
              ? "text-white"
              : "text-[#717171]"
          }`}
        />
      </div>
      <span className={`relative z-10 text-sm font-semibold capitalize tracking-tight transition-colors duration-200 ${
        active && isHero ? "text-[#222222]" : ""
      }`}>
        {label}
      </span>
    </motion.button>
  );
}

export default FilterButton;
