import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

interface FilterState {
  service: string;
  date: string;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply }) => {
  const [filters, setFilters] = useState<FilterState>({
    service: "Unique Stay",
    date: "12/03/2025",
  });

  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  const serviceOptions = ["Unique Stay", "Campervan", "Activity"];

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#0a1c1c] font-poppins">Filter</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-6 mb-8">
          {/* Service Field */}
          <div className="space-y-4">
            <label className="block text-base text-gray-700 font-plus-jakarta">Service</label>
            <div className="relative">
              <button
                onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                className="w-full px-3 py-4 border border-gray-300 rounded-xl text-left text-base text-gray-600 font-plus-jakarta flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#3BD9DA] focus:border-transparent"
              >
                <span>{filters.service}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isServiceDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M15.8327 7.08325L9.99935 12.9166L4.16602 7.08325"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {isServiceDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {serviceOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, service: option }));
                        setIsServiceDropdownOpen(false);
                      }}
                      className="w-full px-3 py-3 text-left text-base text-gray-600 font-plus-jakarta hover:bg-[#e6fafa] hover:text-[#117479] transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date Field */}
          <div className="space-y-4">
            <label className="block text-base text-gray-700 font-plus-jakarta">Date</label>
            <div className="relative">
              <button
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="w-full px-3 py-4 border border-gray-300 rounded-xl text-left text-base text-gray-600 font-plus-jakarta flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#3BD9DA] focus:border-transparent"
              >
                <span>{filters.date}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isDateDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M15.8327 7.08325L9.99935 12.9166L4.16602 7.08325"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {isDateDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4">
                  <input
                    type="date"
                    value={filters.date.split("/").reverse().join("-")}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
                      setFilters((prev) => ({ ...prev, date: formattedDate }));
                      setIsDateDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-[#3BD9DA]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1 py-3 border-[#3bd9da] text-[#117479] hover:bg-[#3BD9DA] hover:text-white rounded-full font-geist"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 py-3 bg-[#3BD9DA] text-white hover:bg-[#2BC7C8] rounded-full font-geist"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
