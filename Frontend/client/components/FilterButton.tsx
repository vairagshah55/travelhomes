import React from "react";

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
    <button
      onClick={onClick}
      className={`flex items-center gap-2 md:gap-2.5 px-4 py-2 rounded-full transition-all duration-200 border ${
        active
          ? isHero
            ? "bg-white text-gray-900 border-white shadow-md"
            : "bg-gray-900 text-white border-gray-900"
          : isHero
          ? "bg-white/15 backdrop-blur-sm text-white border-white/25 hover:bg-white/25"
          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50 shadow-sm"
      }`}
    >
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        <Icon
          className={`w-4 h-4 ${
            active && isHero
              ? "text-gray-900"
              : isHero
              ? "text-white"
              : active
              ? "text-white"
              : "text-gray-600"
          }`}
        />
      </div>
      <span className="text-sm font-medium capitalize">{label}</span>
    </button>
  );
}

export default FilterButton;
