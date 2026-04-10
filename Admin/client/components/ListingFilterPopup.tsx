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
import { X } from "lucide-react";
import indianCities from "../../public/indian_cities.json";

interface ListingFilterPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

const ListingFilterPopup: React.FC<ListingFilterPopupProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
}) => {
  const [brandName, setBrandName] = useState("");
  const [personName, setPersonName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [location, setLocation] = useState("");

    const Locations = indianCities;
   
 
  const handleApply = () => {
    onApplyFilters({
      brandName,
      personName,
      serviceName,
      location,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-6 rounded-xl">
        <DialogHeader className="mb-6 flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold font-geist">Filters</DialogTitle>
          {/* <button
            onClick={onClose}
            className="rounded-full bg-gray-100 p-1 hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button> */}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Brand Name</label>
            <Input 
              placeholder="Lorem Ipsum" 
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="rounded-lg border-gray-300"
            />
          </div>

          {/* <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Person Name</label>
            <Input 
              placeholder="Lorem Ipsum" 
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="rounded-lg border-gray-300"
            />
          </div> */}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Service Name</label>
            <Select value={serviceName} onValueChange={setServiceName}>
              <SelectTrigger className="w-full rounded-lg border-gray-300 text-gray-500">
                <SelectValue placeholder="Camper Van" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Camper Van">Camper Van</SelectItem>
                <SelectItem value="Unique Stay">Unique Stay</SelectItem>
                <SelectItem value="Activity">Activity</SelectItem>
                <SelectItem value="caravan">Caravan</SelectItem>
                <SelectItem value="motorhome">Motorhome</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-full rounded-lg border-gray-300 text-gray-500">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {Locations.length > 0 ? (
                  Locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem> )
                ) )
                    :  <div className="px-4 py-2 text-gray-500 text-sm">No results found</div>
                }
                
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleApply}
            className="bg-black text-white hover:bg-gray-800 rounded-full px-8"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingFilterPopup;
