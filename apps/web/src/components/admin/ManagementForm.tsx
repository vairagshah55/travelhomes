import React, { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
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
import { getImageUrl } from "@/lib/adminUtils";

// Mirrors the editable subset of the Offer schema. Index signature keeps any
// extra fields (photos, vendorId, timestamps…) intact so an edit never drops
// data the form doesn't surface.
export interface Offer {
  _id?: string;
  name?: string;
  category?: string;
  status?: string;
  regularPrice?: string | number;
  finalPrice?: string | number;
  description?: string;
  features?: string | string[];
  rules?: string | string[];
  priceIncludes?: string | string[];
  priceExcludes?: string | string[];
  seatingCapacity?: string | number;
  sleepingCapacity?: string | number;
  guestCapacity?: string | number;
  personCapacity?: string | number;
  numberOfBeds?: string | number;
  numberOfRooms?: string | number;
  numberOfBathrooms?: string | number;
  stayType?: string;
  timeDuration?: string;
  perDayCharge?: string | number;
  perKmCharge?: string | number;
  perDayIncludes?: string | string[];
  perDayExcludes?: string | string[];
  perKmIncludes?: string | string[];
  perKmExcludes?: string | string[];
  expectations?: string | string[];
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  discounts?: Record<string, any>;
  photos?: { coverUrl?: string; galleryUrls?: string[] };
  [key: string]: any;
}

interface ManagementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Offer>) => void;
  initialData?: Offer;
  isLoading?: boolean;
}

const DISCOUNT_SLOTS: [string, string][] = [
  ["firstUser", "First User"],
  ["festival", "Festival"],
  ["weekly", "Weekly"],
  ["special", "Special"],
];

// Comma-separated string ⇄ array fields.
const ARRAY_FIELDS = [
  "features",
  "rules",
  "priceIncludes",
  "priceExcludes",
  "expectations",
  "perDayIncludes",
  "perDayExcludes",
  "perKmIncludes",
  "perKmExcludes",
];

// Fields the DB stores as Number — strip empty strings so Mongoose doesn't try
// to cast "" → NaN (which fails the update).
const NUMERIC_FIELDS = [
  "regularPrice",
  "finalPrice",
  "seatingCapacity",
  "sleepingCapacity",
  "guestCapacity",
  "personCapacity",
  "numberOfBeds",
  "numberOfRooms",
  "numberOfBathrooms",
  "perDayCharge",
  "perKmCharge",
];

const EMPTY: Offer = {
  name: "",
  category: "",
  regularPrice: "",
  finalPrice: "",
  description: "",
  features: "",
  rules: "",
  priceIncludes: "",
  priceExcludes: "",
  seatingCapacity: "",
  sleepingCapacity: "",
  guestCapacity: "",
  personCapacity: "",
  numberOfBeds: "",
  numberOfRooms: "",
  numberOfBathrooms: "",
  stayType: "",
  timeDuration: "",
  perDayCharge: "",
  perKmCharge: "",
  perDayIncludes: "",
  perDayExcludes: "",
  perKmIncludes: "",
  perKmExcludes: "",
  expectations: "",
  locality: "",
  city: "",
  state: "",
  pincode: "",
  address: "",
  discounts: {},
  photos: { coverUrl: "", galleryUrls: [] },
  status: "pending",
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const toCsv = (v: any) => (Array.isArray(v) ? v.join(", ") : (v ?? ""));
const toArr = (v: any) =>
  typeof v === "string"
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : Array.isArray(v)
      ? v
      : [];

const ManagementForm: React.FC<ManagementFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Offer>({ ...EMPTY });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...EMPTY,
        ...initialData,
        // Arrays → comma strings for the inputs
        ...Object.fromEntries(ARRAY_FIELDS.map((k) => [k, toCsv(initialData[k])])),
        discounts: initialData.discounts || {},
        photos: initialData.photos || { coverUrl: "", galleryUrls: [] },
      });
    } else {
      setFormData({ ...EMPTY });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDiscountChange = (slot: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      discounts: {
        ...(prev.discounts || {}),
        [slot]: { ...(prev.discounts?.[slot] || {}), [field]: value },
      },
    }));
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    setFormData((prev) => ({ ...prev, photos: { ...(prev.photos || {}), coverUrl: url } }));
    e.target.value = ""; // let the same file be re-picked
  };

  const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls = await Promise.all(files.map(readFileAsDataUrl));
    setFormData((prev) => ({
      ...prev,
      photos: {
        ...(prev.photos || {}),
        galleryUrls: [...(prev.photos?.galleryUrls || []), ...urls],
      },
    }));
    e.target.value = "";
  };

  const removeCover = () =>
    setFormData((prev) => ({ ...prev, photos: { ...(prev.photos || {}), coverUrl: "" } }));

  const removeGalleryImage = (index: number) =>
    setFormData((prev) => {
      const gallery = [...(prev.photos?.galleryUrls || [])];
      gallery.splice(index, 1);
      return { ...prev, photos: { ...(prev.photos || {}), galleryUrls: gallery } };
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processed: Record<string, any> = { ...formData };
    // Comma strings → arrays
    ARRAY_FIELDS.forEach((k) => {
      processed[k] = toArr(processed[k]);
    });
    // Drop empty numeric fields so we don't send "" for a Number column
    NUMERIC_FIELDS.forEach((k) => {
      if (processed[k] === "" || processed[k] === undefined || processed[k] === null) {
        delete processed[k];
      }
    });
    onSubmit(processed);
  };

  if (!isOpen) return null;

  /* ── Small field renderers ─────────────────────────────────────────────── */
  const Text = (
    name: string,
    label: string,
    opts: { type?: string; placeholder?: string; required?: boolean } = {},
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {opts.required && "*"}
      </label>
      <Input
        name={name}
        value={(formData[name] as any) ?? ""}
        onChange={handleChange}
        type={opts.type || "text"}
        placeholder={opts.placeholder || ""}
        required={opts.required}
        className="w-full"
      />
    </div>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2 pt-2">
      {children}
    </h3>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <X size={16} className="text-gray-700" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? "Edit Listing" : "Add New Listing"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Basics ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Text("name", "Name", { required: true, placeholder: "Enter listing name" })}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Category*</label>
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
            {Text("regularPrice", "Regular Price", {
              type: "number",
              placeholder: "Enter regular price",
            })}
            {Text("finalPrice", "Final Price", {
              type: "number",
              placeholder: "Enter final price",
            })}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <Textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Enter description"
              className="w-full min-h-[100px]"
            />
          </div>

          {Text("features", "Features (comma separated)", {
            placeholder: "e.g. WiFi, AC, Parking",
          })}
          {Text("rules", "Rules & Regulations (comma separated)", {
            placeholder: "e.g. No smoking, No pets",
          })}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Text("priceIncludes", "Price Includes (comma separated)", {
              placeholder: "e.g. Breakfast, Lunch",
            })}
            {Text("priceExcludes", "Price Excludes (comma separated)", {
              placeholder: "e.g. Flight, Insurance",
            })}
          </div>

          {/* ── Property & Capacity ── */}
          <SectionTitle>Property &amp; Capacity</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Text("seatingCapacity", "Seating Capacity", { type: "number" })}
            {Text("sleepingCapacity", "Sleeping Capacity", { type: "number" })}
            {Text("guestCapacity", "Guest Capacity", { type: "number" })}
            {Text("personCapacity", "Person Capacity", { type: "number" })}
            {Text("numberOfBeds", "No. of Beds", { type: "number" })}
            {Text("numberOfRooms", "No. of Rooms", { type: "number" })}
            {Text("numberOfBathrooms", "No. of Bathrooms", { type: "number" })}
            {Text("stayType", "Stay Type", { placeholder: "e.g. Entire place, Private room" })}
            {Text("timeDuration", "Duration", { placeholder: "e.g. 2 hours, 1 day" })}
          </div>

          {/* ── Caravan Pricing ── */}
          <SectionTitle>Caravan Pricing</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Text("perDayCharge", "Per Day Charge", { type: "number" })}
            {Text("perKmCharge", "Per Km Charge", { type: "number" })}
            {Text("perDayIncludes", "Per Day Includes (comma separated)")}
            {Text("perDayExcludes", "Per Day Excludes (comma separated)")}
            {Text("perKmIncludes", "Per Km Includes (comma separated)")}
            {Text("perKmExcludes", "Per Km Excludes (comma separated)")}
          </div>

          {/* ── Activity ── */}
          <SectionTitle>Activity</SectionTitle>
          {Text("expectations", "What to Expect (comma separated)", {
            placeholder: "e.g. Guide included, Safety gear",
          })}

          {/* ── Location ── */}
          <SectionTitle>Location</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Text("locality", "Locality")}
            {Text("city", "City")}
            {Text("state", "State")}
            {Text("pincode", "Pincode")}
          </div>
          {Text("address", "Full Address")}

          {/* ── Photos ── */}
          <SectionTitle>Photos</SectionTitle>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Cover Photo</label>
            <div className="flex items-center gap-4">
              {formData.photos?.coverUrl ? (
                <div className="relative">
                  <img
                    src={getImageUrl(formData.photos.coverUrl)}
                    alt="cover"
                    className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeCover}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full grid place-items-center hover:bg-red-600"
                    aria-label="Remove cover photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-24 rounded-lg border-2 border-dashed border-gray-200 grid place-items-center text-gray-400 text-xs">
                  No cover
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 h-10 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Upload size={15} /> {formData.photos?.coverUrl ? "Replace" : "Upload"} cover
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverChange}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Gallery</label>
            <div className="flex flex-wrap gap-3">
              {(formData.photos?.galleryUrls || []).map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={getImageUrl(img)}
                    alt={`gallery ${i + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full grid place-items-center hover:bg-red-600"
                    aria-label={`Remove gallery photo ${i + 1}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="cursor-pointer w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 grid place-items-center text-gray-400 hover:border-[#117479] hover:text-[#117479] transition-colors">
                <div className="flex flex-col items-center gap-1">
                  <Upload size={18} />
                  <span className="text-[11px]">Add</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryAdd}
                />
              </label>
            </div>
          </div>

          {/* ── Discounts ── */}
          <SectionTitle>Discount Offers</SectionTitle>
          <div className="space-y-3">
            {DISCOUNT_SLOTS.map(([key, label]) => {
              const disc = (formData.discounts as any)?.[key] || {};
              return (
                <div
                  key={key}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border border-gray-200 rounded-lg p-3"
                >
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={!!disc.enabled}
                      onChange={(e) => handleDiscountChange(key, "enabled", e.target.checked)}
                      className="h-4 w-4 accent-[#117479]"
                    />
                    {label}
                  </label>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500">Type</span>
                    <Select
                      value={disc.type || "percentage"}
                      onValueChange={(v) => handleDiscountChange(key, "type", v)}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500">Value</span>
                    <Input
                      value={disc.value || ""}
                      onChange={(e) => handleDiscountChange(key, "value", e.target.value)}
                      className="h-9"
                      placeholder={disc.type === "fixed" ? "₹ amount" : "%"}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500">Final Price</span>
                    <Input
                      value={disc.finalPrice || ""}
                      onChange={(e) => handleDiscountChange(key, "finalPrice", e.target.value)}
                      className="h-9"
                      placeholder="₹ final"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="px-6">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="px-6 bg-[#117479] text-white hover:bg-[#0d5c60]"
            >
              {isLoading ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagementForm;
