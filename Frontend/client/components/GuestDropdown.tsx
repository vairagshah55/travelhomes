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

  return (
    <div className="absolute top-full left-0 mt-2 w-[300px] bg-white rounded-xl shadow-xl z-[9999] border border-gray-200 p-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <div className="font-medium text-[16px] text-left text-black">Adults</div>
            <div className="text-sm text-gray-500">Ages 13 or above</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateGuests("adults", false)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
              disabled={guests.adults <= 1}
            >
              -
            </button>
            <span className="w-8 text-center text-black">{guests.adults}</span>
            <button
              onClick={() => updateGuests("adults", true)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <div className="font-medium text-black">Children</div>
            <div className="text-sm text-gray-500">Ages 2-12</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateGuests("children", false)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
              disabled={guests.children <= 0}
            >
              -
            </button>
            <span className="w-8 text-center text-black">
              {guests.children}
            </span>
            <button
              onClick={() => updateGuests("children", true)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <div className="font-medium text-black">Infants</div>
            <div className="text-sm text-gray-500">Under 2</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateGuests("infants", false)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
              disabled={guests.infants <= 0}
            >
              -
            </button>
            <span className="w-8 text-center text-black">{guests.infants}</span>
            <button
              onClick={() => updateGuests("infants", true)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <div className="font-medium text-black">Pet</div>
            <div className="text-sm text-gray-500">Pets</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateGuests("pet", false)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
              disabled={guests.pet <= 0}
            >
              -
            </button>
            <span className="w-8 text-center text-black">{guests.pet}</span>
            <button
              onClick={() => updateGuests("pet", true)}
              className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-black transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-black text-white rounded-full py-3 hover:bg-gray-800 transition-colors"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
