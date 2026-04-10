import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define interface based on Offer schema
export interface Offer {
  _id?: string;
  name: string;
  category: string;
  regularPrice: string | number;
  finalPrice: string | number;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  description: string;
  status?: string;
  features?: string;
  rules?: string;
  priceIncludes?: string;
  priceExcludes?: string;
  seatingCapacity?: string | number;
  sleepingCapacity?: string | number;
  timeDuration?: string;
}

interface ManagementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Offer>) => void;
  initialData?: Offer;
  isLoading?: boolean;
}

const ManagementForm: React.FC<ManagementFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Offer>>({
    name: "",
    category: "",
    regularPrice: "",
    finalPrice: "",
    locality: "",
    city: "",
    state: "",
    pincode: "",
    description: "",
    features: "",
    rules: "",
    priceIncludes: "",
    priceExcludes: "",
    seatingCapacity: "",
    sleepingCapacity: "",
    timeDuration: "",
    status: "pending",
  });

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Convert arrays to comma-separated strings if needed
        features: Array.isArray(initialData.features) ? initialData.features.join(", ") : initialData.features || "",
        rules: Array.isArray(initialData.rules) ? initialData.rules.join(", ") : initialData.rules || "",
        priceIncludes: Array.isArray(initialData.priceIncludes) ? initialData.priceIncludes.join(", ") : initialData.priceIncludes || "",
        priceExcludes: Array.isArray(initialData.priceExcludes) ? initialData.priceExcludes.join(", ") : initialData.priceExcludes || "",
      });
    } else {
       // Reset form when opening for "Add New"
       setFormData({
        name: "",
        category: "",
        regularPrice: "",
        finalPrice: "",
        locality: "",
        city: "",
        state: "",
        pincode: "",
        description: "",
        features: "",
        rules: "",
        priceIncludes: "",
        priceExcludes: "",
        seatingCapacity: "",
        sleepingCapacity: "",
        timeDuration: "",
        status: "pending",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process comma-separated strings into arrays for the backend
    const processedData = {
      ...formData,
      features: typeof formData.features === 'string' 
        ? formData.features.split(',').map(s => s.trim()).filter(Boolean) 
        : formData.features,
      rules: typeof formData.rules === 'string' 
        ? formData.rules.split(',').map(s => s.trim()).filter(Boolean) 
        : formData.rules,
      priceIncludes: typeof formData.priceIncludes === 'string' 
        ? formData.priceIncludes.split(',').map(s => s.trim()).filter(Boolean) 
        : formData.priceIncludes,
      priceExcludes: typeof formData.priceExcludes === 'string' 
        ? formData.priceExcludes.split(',').map(s => s.trim()).filter(Boolean) 
        : formData.priceExcludes,
    };

    onSubmit(processedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-4xl mx-4 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-6 h-6 bg-[#E5E5E5] rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
        >
          <X size={16} className="text-black" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black font-geist">
            {initialData ? "Edit Listing" : "Add New Listing"}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Name*
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter listing name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Category*
              </label>
               <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Regular Price
              </label>
              <Input
                name="regularPrice"
                value={formData.regularPrice || ""}
                onChange={handleChange}
                placeholder="Enter regular price"
                className="w-full"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Final Price
              </label>
              <Input
                name="finalPrice"
                value={formData.finalPrice || ""}
                onChange={handleChange}
                placeholder="Enter final price"
                className="w-full"
                type="number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <Textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Enter description"
              className="w-full min-h-[100px]"
            />
          </div>
          
           <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Features (comma separated)
            </label>
            <Input
              name="features"
              value={formData.features || ""}
              onChange={handleChange}
              placeholder="e.g. WiFi, AC, Parking"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Rules & Regulations (comma separated)
            </label>
            <Input
              name="rules"
              value={formData.rules || ""}
              onChange={handleChange}
              placeholder="e.g. No smoking, No pets"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                Price Includes (comma separated)
                </label>
                <Input
                name="priceIncludes"
                value={formData.priceIncludes || ""}
                onChange={handleChange}
                placeholder="e.g. Breakfast, Lunch"
                className="w-full"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                Price Excludes (comma separated)
                </label>
                <Input
                name="priceExcludes"
                value={formData.priceExcludes || ""}
                onChange={handleChange}
                placeholder="e.g. Flight, Insurance"
                className="w-full"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Seating Capacity
              </label>
              <Input
                name="seatingCapacity"
                value={formData.seatingCapacity || ""}
                onChange={handleChange}
                placeholder="Enter seating capacity"
                className="w-full"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Sleeping Capacity
              </label>
              <Input
                name="sleepingCapacity"
                value={formData.sleepingCapacity || ""}
                onChange={handleChange}
                placeholder="Enter sleeping capacity"
                className="w-full"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Duration
              </label>
              <Input
                name="timeDuration"
                value={formData.timeDuration || ""}
                onChange={handleChange}
                placeholder="e.g. 2 hours, 1 day"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Locality
              </label>
              <Input
                name="locality"
                value={formData.locality || ""}
                onChange={handleChange}
                placeholder="Enter locality"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <Input
                name="city"
                value={formData.city || ""}
                onChange={handleChange}
                placeholder="Enter city"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                State
              </label>
              <Input
                name="state"
                value={formData.state || ""}
                onChange={handleChange}
                placeholder="Enter state"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pincode
              </label>
              <Input
                name="pincode"
                value={formData.pincode || ""}
                onChange={handleChange}
                placeholder="Enter pincode"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="px-6 bg-black text-white hover:bg-gray-800"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagementForm;