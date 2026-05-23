import React from "react";

function SearchField({
  icon,
  label,
  value,
  className = "",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} onClick={onClick}>
      <div className="flex items-center gap-2 text-white/70">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-white font-semibold text-lg">{value}</div>
    </div>
  );
}

export default SearchField;
