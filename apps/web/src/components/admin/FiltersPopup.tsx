import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, ChevronDown } from "lucide-react";

interface FiltersPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: string[]) => void;
  currentFilters?: string[];
}

const FiltersPopup: React.FC<FiltersPopupProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
}) => {
  // Initialize state with current filters if available
  const [location, setLocation] = useState(currentFilters?.find(f => f.startsWith('location:'))?.split(':')[1] || "");
  const [serviceType, setServiceType] = useState(currentFilters?.find(f => f.startsWith('service:'))?.split(':')[1] || "");
  const [status, setStatus] = useState(currentFilters?.find(f => f.startsWith('status:'))?.split(':')[1] || "");
  const [dateFrom, setDateFrom] = useState(currentFilters?.find(f => f.startsWith('dateFrom:'))?.split(':')[1] || "");
  const [dateTo, setDateTo] = useState(currentFilters?.find(f => f.startsWith('dateTo:'))?.split(':')[1] || "");

  const handleApplyFilters = () => {
    const filters = [];
    
    if (location) filters.push(`location:${location}`);
    if (serviceType) filters.push(`service:${serviceType}`);
    if (status) filters.push(`status:${status}`);
    if (dateFrom) filters.push(`dateFrom:${dateFrom}`);
    if (dateTo) filters.push(`dateTo:${dateTo}`);
    
    onApplyFilters(filters);
    onClose(); // Close the popup after applying filters
  };

  const handleClearFilters = () => {
    setLocation("");
    setServiceType("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    onApplyFilters([]);
    onClose(); // Close the popup after clearing filters
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-7 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-black font-geist">
              Filters
            </DialogTitle>
            {/* <button
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
            > */}
              {/* <X className="h-4 w-4 text-black" /> */}
            {/* </button> */}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {/* First Row */}
          <div className="grid grid-cols-3 gap-6">
            {/* Location */}
            <div className="space-y-2">
              <label className="block text-base font-normal text-gray-700">
                Location
              </label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="w-full h-10 border-gray-300 text-gray-600">
                  <SelectValue placeholder="Select location" />
                
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Jamshedpur">Jamshedpur</SelectItem>
                  <SelectItem value="Kolkata">Kolkata</SelectItem>
                  <SelectItem value="Manali">Manali</SelectItem>
                  <SelectItem value="Goa">Goa</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <label className="block text-base font-normal text-gray-700">
                Service Type
              </label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger className="w-full h-10 border-gray-300 text-gray-600">
                  <SelectValue placeholder="Select service type" />
                
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="Camper Van">Camper Van</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="Cabin">Cabin</SelectItem>
                  <SelectItem value="Beach House">Beach House</SelectItem>
                  <SelectItem value="Hotel">Hotel</SelectItem>
                  <SelectItem value="Resort">Resort</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-base font-normal text-gray-700">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full h-10 border-gray-300 text-gray-600">
                  <SelectValue placeholder="Select status" />
                
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="modified">Modified</SelectItem>
                  <SelectItem value="deactivate">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Date From */}
            <div className="space-y-2">
              <label className="block text-base font-normal text-gray-700">
                Date From
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-10 border-gray-300 text-gray-600"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="block text-base font-normal text-gray-700">
                Date To
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-10 border-gray-300 text-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="px-8 py-3 h-12 rounded-full border-gray-400 text-gray-700 hover:bg-gray-50"
            >
              Clear Filter
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="px-8 py-3 h-12 rounded-full bg-black text-white hover:bg-gray-800"
            >
              Apply Filter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FiltersPopup;
