import React from "react";
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
  const updateGuests = (
    type: "adults" | "children" | "infants" | "pet",
    increment: boolean
  ) => {
    const current = guests[type] || 0;

    onUpdate({
      ...guests,
      [type]: increment ? current + 1 : Math.max(0, current - 1),
    });
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
    <div className={`flex items-center justify-between py-3.5 ${!isLast ? "border-b border-gray-100" : ""}`}>
      <div className="text-left">
        <div className="font-medium text-[15px] text-gray-900">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => updateGuests(type, false)}
          disabled={(guests[type] || 0) <= min}
          className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all duration-150"
        >
          -
        </button>
        <span className="w-6 text-center text-sm font-semibold text-gray-900 tabular-nums">{guests[type] || 0}</span>
        <button
          onClick={() => updateGuests(type, true)}
          className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all duration-150"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="absolute top-[calc(100%+24px)] right-0 w-[300px] bg-white rounded-2xl shadow-xl z-[9999] border border-gray-100 px-5 pt-1 pb-4">
      <GuestRow label="Adults" subtitle="Ages 13 or above" type="adults" min={1} />
      <GuestRow label="Children" subtitle="Ages 2 – 12" type="children" />
      <GuestRow label="Infants" subtitle="Under 2" type="infants" />
      <GuestRow label="Pets" subtitle="Service animals" type="pet" isLast />
      <Button
        onClick={onClose}
        className="w-full mt-3 bg-gray-900 text-white rounded-xl h-10 text-sm font-semibold hover:bg-black active:scale-[0.98] transition-all duration-200"
      >
        Done
      </Button>
    </div>
  );
}
