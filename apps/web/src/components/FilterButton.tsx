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
            ? "bg-white text-[#0A1E3D] border-white shadow-[0_4px_20px_rgba(255,255,255,0.25)]"
            : "bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm"
          : isHero
          ? "bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 hover:border-white/40"
          : "bg-white text-[#0A1E3D] border-[#E4E8F0] hover:border-[#1E3A8A] hover:bg-[#EEF2FB] shadow-sm"
      }`}
    >
      {active && (
        <motion.span
          layoutId={isHero ? "hero-filter-pill" : "filter-pill"}
          className="absolute inset-0 rounded-full"
          style={{
            background: isHero ? "white" : "#1E3A8A",
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <div className="relative z-10 w-5 h-5 flex items-center justify-center flex-shrink-0">
        <Icon
          className={`w-4 h-4 transition-colors duration-200 ${
            active && isHero
              ? "text-[#0A1E3D]"
              : isHero
              ? "text-white/90"
              : active
              ? "text-white"
              : "text-[#5F6A82]"
          }`}
        />
      </div>
      <span className={`relative z-10 text-sm font-semibold capitalize tracking-tight transition-colors duration-200 ${
        active && isHero ? "text-[#0A1E3D]" : ""
      }`}>
        {label}
      </span>
    </motion.button>
  );
}

export default FilterButton;
