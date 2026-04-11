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
            ? "bg-white text-gray-900 border-white shadow-[0_4px_20px_rgba(255,255,255,0.25)]"
            : "bg-gray-900 text-white border-gray-900 shadow-md"
          : isHero
          ? "bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 hover:border-white/40"
          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50 shadow-sm"
      }`}
    >
      {active && (
        <motion.span
          layoutId={isHero ? "hero-filter-pill" : "filter-pill"}
          className="absolute inset-0 rounded-full"
          style={{
            background: isHero
              ? "white"
              : "linear-gradient(135deg, #1a1a1a 0%, #333 100%)",
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <div className="relative z-10 w-5 h-5 flex items-center justify-center flex-shrink-0">
        <Icon
          className={`w-4 h-4 transition-colors duration-200 ${
            active && isHero
              ? "text-gray-900"
              : isHero
              ? "text-white/90"
              : active
              ? "text-white"
              : "text-gray-500"
          }`}
        />
      </div>
      <span className={`relative z-10 text-sm font-semibold capitalize tracking-wide transition-colors duration-200 ${
        active && isHero ? "text-gray-900" : ""
      }`}>
        {label}
      </span>
    </motion.button>
  );
}

export default FilterButton;
