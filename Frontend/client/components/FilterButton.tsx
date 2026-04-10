import React from "react";

function FilterButton({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center max-md:gap-1 gap-3 px-4 py-2 rounded-full transition-colors ${
        active
          ? "bg-black text-white border border-gray-500"
          : "bg-[#F6F6F6] text-black max-md:text-black hover:bg-[#dfdddd]"
      }`}
    >
      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
        <Icon className="w-4 h-4 text-black max-md:w-6 max-md:h-6" />
      </div>
      <span className="text-sm max-md:text-xs font-medium capitalize">
        {label}
      </span>
    </button>
  );
}

export default FilterButton;
