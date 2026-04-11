import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export function GuestDropdown({
  guests,
  onUpdate,
  onClose,
}: {
  guests: { adults: number; children: number; infants: number; pet?: number };
  onUpdate: (guests: {
    adults: number;
    children: number;
    infants: number;
    pet?: number;
  }) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState({ ...guests });

  const updateLocal = (
    type: "adults" | "children" | "infants" | "pet",
    increment: boolean
  ) => {
    const current = local[type] || 0;
    setLocal((prev) => ({
      ...prev,
      [type]: increment ? current + 1 : Math.max(0, current - 1),
    }));
  };

  const handleDone = () => {
    onUpdate(local);
    onClose();
  };

  const GuestRow = ({
    label,
    subtitle,
    type,
    min = 0,
    isLast = false,
  }: {
    label: string;
    subtitle: string;
    type: "adults" | "children" | "infants" | "pet";
    min?: number;
    isLast?: boolean;
  }) => (
    <div className={`flex items-center justify-between py-2.5 ${!isLast ? "border-b border-gray-100" : ""}`}>
      <div className="text-left">
        <div className="font-semibold text-sm text-gray-900">{label}</div>
        <div className="text-[11px] text-gray-400 mt-px">{subtitle}</div>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => updateLocal(type, false)}
          disabled={(local[type] || 0) <= min}
          className="w-7 h-7 border border-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm hover:border-gray-900 hover:text-gray-900 disabled:opacity-25 disabled:hover:border-gray-200 disabled:hover:text-gray-500 transition-all duration-150"
        >
          -
        </button>
        <span className="w-5 text-center text-sm font-semibold text-gray-900 tabular-nums">{local[type] || 0}</span>
        <button
          onClick={() => updateLocal(type, true)}
          className="w-7 h-7 border border-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm hover:border-gray-900 hover:text-gray-900 transition-all duration-150"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="absolute top-[calc(100%+24px)] left-0 w-[280px] bg-white rounded-2xl shadow-xl z-[9999] border border-gray-100 px-4 pt-2 pb-3">
      <GuestRow label="Adults" subtitle="Ages 13 or above" type="adults" min={1} />
      <GuestRow label="Children" subtitle="Ages 2 – 12" type="children" />
      <GuestRow label="Infants" subtitle="Under 2" type="infants" />
      <GuestRow label="Pets" subtitle="Service animals" type="pet" isLast />
      <Button
        onClick={handleDone}
        className="w-full mt-2.5 bg-gray-900 text-white rounded-xl h-9 text-xs font-semibold hover:bg-black active:scale-[0.98] transition-all duration-200"
      >
        Done
      </Button>
    </div>
  );
}
