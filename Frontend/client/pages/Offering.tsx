import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  MoreHorizontal,
  Star,
  Eye,
  Edit2,
  Clock,
  Calendar,
  Trash2,
  User,
  X,
  Image as ImageIcon,
  Award,
} from "lucide-react";
import { Sidebar } from "@/components/Navigation";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardHeader } from "@/components/Header";
import { offersApi, OfferDTO, getOnboardingData } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { CustomPagination } from "@/components/CustomPagination";

// ─── Status chip ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  pending:  'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-400',
  cancelled:'bg-red-100    text-red-600    dark:bg-red-900/40    dark:text-red-400',
};

// --------- Card Component ---------
const OfferingCard = ({
  listing,
  showDropdown,
  onToggleDropdown,
  onApprove,
  onCancel,
  onDelete,
  onEdit,
  onCardClick,
}: {
  listing: OfferDTO;
  showDropdown: string | null;
  onToggleDropdown: (id: string) => void;
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (offer: OfferDTO) => void;
  onCardClick: (id: string) => void;
}) => {
  const id = listing._id!;
  const cover = listing.photos?.coverUrl || "";
  const category = listing.category || "Offer";
  const seats = Number(listing.seatingCapacity || 0);
  const sleeps = Number(listing.sleepingCapacity || 0);
  const price = Number(listing.regularPrice || 0);
  const status = (listing.status || "pending") as string;
  const location = [listing.city, listing.state].filter(Boolean).join(", ");

  return (
    <div className="relative group" data-parallax="0.05">
      <div
        data-animate="property-card"
        data-animate-item
        className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer motion-property-card"
        onClick={() => onCardClick(id)}
      >
        {/* ── Image ── */}
        <div className="relative h-52 overflow-hidden bg-gray-100 dark:bg-gray-800 motion-property-image-wrap">
          {cover ? (
            <img
              src={getImageUrl(cover)}
              alt={listing.name}
              data-animate-image
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 motion-property-image"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={36} className="text-gray-300 dark:text-gray-600" />
            </div>
          )}

          {/* Status chip + menu */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.pending} ${status === 'pending' ? 'motion-badge-pending' : status === 'approved' ? 'motion-badge-confirmed' : ''}`}>
              {status}
            </span>

            {/* Three-dot menu */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 rounded-full shadow-sm backdrop-blur-sm"
                onClick={() => onToggleDropdown(id)}
              >
                <MoreHorizontal size={15} className="text-gray-700 dark:text-gray-300" />
              </Button>

              {showDropdown === id && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-20 overflow-hidden motion-dropdown-surface" data-state="open">
                  <button
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 transition-colors"
                    onClick={() => onEdit(listing)}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 transition-colors"
                    onClick={() => onCardClick(id)}
                  >
                    <Eye size={13} /> View Details
                  </button>
                  {status !== "approved" && (
                    <button
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
                      onClick={() => onDelete(id)}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Category pill at bottom of image */}
          <div className="absolute bottom-3 left-3">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
              {category}
            </span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white font-plus-jakarta truncate mb-1">
            {listing.name}
          </h3>

          {location && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2.5 truncate">
              {location}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 mb-3">
            {seats > 0 && <span>{seats} seats</span>}
            {seats > 0 && sleeps > 0 && <span className="text-gray-300 dark:text-gray-700">·</span>}
            {sleeps > 0 && <span>{sleeps} sleeps</span>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-0.5">
              <span className="text-base font-bold text-gray-900 dark:text-white font-plus-jakarta">
                ₹{price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-0.5">/ day</span>
            </div>
            <button
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#3BD9DA', background: '#E8FAFA' }}
              onClick={(e) => { e.stopPropagation(); onCardClick(id); }}
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --------- Modal (Create/Edit) ---------
interface OfferFormProps {
  open: boolean;
  initial?: Partial<OfferDTO> | null;
  onOpenChange: (v: boolean) => void;
  onSaved: (offer: OfferDTO, isEdit: boolean) => void;
}

const defaultForm: Partial<OfferDTO> = {
  name: "",
  category: "",
  description: "",
  rules: [""],
  features: [],
  seatingCapacity: "",
  sleepingCapacity: "",
  locality: "",
  pincode: "",
  city: "",
  state: "",
  regularPrice: "",
  priceIncludes: [""],
  priceExcludes: [""],
  photos: { coverUrl: "", galleryUrls: [] },
};

const OfferModal: React.FC<OfferFormProps> = ({
  open,
  initial,
  onOpenChange,
  onSaved,
}) => {
  const isEdit = !!(initial && initial._id);
  const [form, setForm] = useState<Partial<OfferDTO>>(defaultForm);
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...defaultForm, ...initial });
  }, [open, initial]);

  const update = (field: keyof OfferDTO, value: any) =>
    setForm((p) => ({ ...p, [field]: value }));

  const setArrayItem = (
    field: "rules" | "priceIncludes" | "priceExcludes" | "photos",
    index: number,
    value: string,
  ) => {
    if (field === "photos") return;
    const current = (form[field] as string[]) || [];
    const next = current.map((v, i) => (i === index ? value : v));
    update(field as any, next);
  };

  const addArrayItem = (field: "rules" | "priceIncludes" | "priceExcludes") => {
    const current = (form[field] as string[]) || [];
    update(field, [...current, ""]);
  };

  const removeArrayItem = (
    field: "rules" | "priceIncludes" | "priceExcludes",
    index: number,
  ) => {
    const current = (form[field] as string[]) || [];
    update(
      field,
      current.filter((_, i) => i !== index),
    );
  };


  const removeGalleryUrl = (index: number) => {
    const urls = form.photos?.galleryUrls || [];
    update("photos", {
      ...(form.photos || {}),
      galleryUrls: urls.filter((_, i) => i !== index),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      
      const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append("files", file); // Fixed field name to "files" to match backend expectation
        const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
        const res = await fetch(`${API_BASE_URL}/api/vendorchats/upload`, {
            method: 'POST',
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
            const url = json.data[0].url; 
            return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
        }
        throw new Error(json.message || "Upload failed");
      };

      if (isCover) {
         const url = await uploadFile(files[0]);
         update("photos", {
            ...(form.photos || {}),
            coverUrl: url,
          });
      } else {
          const newUrls: string[] = [];
          for (let i = 0; i < files.length; i++) {
              try {
                  const url = await uploadFile(files[i]);
                  newUrls.push(url);
              } catch (err) {
                  console.error(`Failed to upload file ${i}`, err);
              }
          }
          const currentUrls = form.photos?.galleryUrls || [];
          update("photos", { ...(form.photos || {}), galleryUrls: [...currentUrls, ...newUrls] });
      }
    } catch (error: any) {
      console.error("Upload failed", error);
      toast.error(error.message || "Image upload failed");
    } finally {
      setUploading(false);
      // Reset input to allow selecting same file again
      e.target.value = "";
    }
  };


  const submit = async () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    if (!form.category) {
      toast.error("Category is required");
      return;
    }
    if (!form.description) {
      toast.error("Description is required");
      return;
    }
    if (!form.regularPrice && form.regularPrice !== 0) {
      toast.error("Price is required");
      return;
    }
    
    if ((form.photos?.galleryUrls?.length || 0) < 5) {
      toast.error("Please upload at least 5 gallery images.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
      
      // Determine serviceType based on category if not already set
      let serviceType = form.serviceType;
      const cat = (form.category || "").toLowerCase();
      if (cat.includes("van") || cat.includes("caravan")) serviceType = "camper-van";
      else if (cat.includes("stay") || cat.includes("stays")) serviceType = "unique-stay";
      else if (cat.includes("activity") || cat.includes("activities")) serviceType = "activity";
      else if (!serviceType) serviceType = "unique-stay"; // Default fallback

      // Create a clean payload without _id if it's there
      const { _id, ...restOfForm } = form as any;

      const payload: Partial<OfferDTO> = {
        ...restOfForm,
        serviceType,
        seatingCapacity: form.seatingCapacity
          ? Number(form.seatingCapacity)
          : undefined,
        sleepingCapacity: form.sleepingCapacity
          ? Number(form.sleepingCapacity)
          : undefined,
        regularPrice: form.regularPrice ? Number(form.regularPrice) : 0,
        status: "pending",
      };

      console.log("Submitting payload:", payload);

      const res =
        isEdit && initial?._id
          ? await offersApi.update(initial._id, payload, token || undefined)
          : await offersApi.create(payload, token || undefined);
      
      if (res.success) {
        onSaved(res.data, !!isEdit);
        onOpenChange(false);
        toast.success(isEdit ? "Offer updated successfully!" : "Offer created successfully!");
      } else {
        throw new Error((res as any).message || "Operation failed");
      }
    } catch (e: any) {
      console.error("Save Error:", e);
      toast.error(e.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 motion-modal-surface">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{isEdit ? "Edit Offer" : "Add New Offer"}</DialogTitle>
        </DialogHeader>
        {/* Scrollable body */}
        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Basic */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name || ""}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={form.category || ""}
                onChange={(e) => update("category", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select Category</option>
                <option value="Offer">Offer</option>
                <option value="Camper Van">Camper Van</option>
                <option value="Unique Stay">Unique Stay</option>
                <option value="Activity">Activity</option>
                {/* Add other categories as needed */}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description || ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Write here..."
            />
          </div>

          {/* Capacities + Price */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label>Seating Capacity</Label>
              <Input
                value={String(form.seatingCapacity || "")}
                inputMode="numeric"
                pattern="\\d*"
                onChange={(e) =>
                  update(
                    "seatingCapacity",
                    e.target.value.replace(/[^0-9]/g, ""),
                  )
                }
                placeholder="e.g. 4"
              />
            </div>
            <div className="space-y-2">
              <Label>Sleeping Capacity</Label>
              <Input
                value={String(form.sleepingCapacity || "")}
                inputMode="numeric"
                pattern="\\d*"
                onChange={(e) =>
                  update(
                    "sleepingCapacity",
                    e.target.value.replace(/[^0-9]/g, ""),
                  )
                }
                placeholder="e.g. 2"
              />
            </div>
            <div className="space-y-2">
              <Label>Regular Price (per day)</Label>
              <Input
                value={String(form.regularPrice || "")}
                inputMode="numeric"
                pattern="\\d*"
                onChange={(e) =>
                  update("regularPrice", e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="e.g. 2890"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            <div className="space-y-2">
              <Label>Locality</Label>
              <Input
                value={form.locality || ""}
                onChange={(e) => update("locality", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Pincode</Label>
              <Input
                value={form.pincode || ""}
                onChange={(e) => update("pincode", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={form.city || ""}
                onChange={(e) => update("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={form.state || ""}
                onChange={(e) => update("state", e.target.value)}
              />
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <Label>Rules</Label>
            <div className="space-y-2">
              {(form.rules || []).map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={r}
                    onChange={(e) => setArrayItem("rules", i, e.target.value)}
                    placeholder={`Rule #${i + 1}`}
                  />
                  <Button
                    variant="outline"
                    onClick={() => removeArrayItem("rules", i)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="secondary" onClick={() => addArrayItem("rules")}>
                Add Rule
              </Button>
            </div>
          </div>

          {/* Includes/Excludes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Price Includes</Label>
              {(form.priceIncludes || []).map((v, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={v}
                    onChange={(e) =>
                      setArrayItem("priceIncludes", i, e.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() => removeArrayItem("priceIncludes", i)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={() => addArrayItem("priceIncludes")}
              >
                Add Include
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Price Excludes</Label>
              {(form.priceExcludes || []).map((v, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={v}
                    onChange={(e) =>
                      setArrayItem("priceExcludes", i, e.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() => removeArrayItem("priceExcludes", i)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={() => addArrayItem("priceExcludes")}
              >
                Add Exclude
              </Button>
            </div>
          </div>

          {/* Photos Section */}
          <div className="space-y-6">
            
            {/* Cover Image */}
            <div className="space-y-2">
               <Label className="text-base font-semibold">Cover Image</Label>
               <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] relative bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  {form.photos?.coverUrl ? (
                    <div className="relative w-full h-full min-h-[200px] flex items-center justify-center">
                      <img 
                        src={getImageUrl(form.photos.coverUrl)} 
                        alt="Cover" 
                        className="w-full h-full object-contain rounded-md max-h-[300px]" 
                      />
                      <button 
                        type="button"
                        onClick={() => update("photos", { ...(form.photos || {}), coverUrl: "" })}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center w-full h-full flex flex-col items-center justify-center cursor-pointer">
                        <div className="relative">
                           <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                           <div className="mt-2 flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                             <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none">
                               <span>Upload a cover image</span>
                               <input 
                                 type="file" 
                                 className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                                 accept="image/*"
                                 onChange={(e) => handleFileUpload(e, true)}
                               />
                             </label>
                           </div>
                           <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                        </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Gallery Images */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <Label className="text-base font-semibold">Gallery Images <span className="text-sm font-normal text-gray-500 ml-2">(Min 5)</span></Label>
                 <span className="text-sm text-gray-500">{form.photos?.galleryUrls?.length || 0} images</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {/* Existing Images */}
                 {(form.photos?.galleryUrls || []).map((u, i) => (
                    <div key={i} className="relative aspect-square group border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm">
                       <img src={getImageUrl(u)} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                       <button 
                         type="button"
                         onClick={() => removeGalleryUrl(i)}
                         className="absolute top-1 right-1 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 backdrop-blur-sm"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                 ))}

                 {/* Add New Button */}
                 <div className="relative aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                    ) : (
                        <>
                            <Plus className="h-8 w-8 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                            <span className="mt-2 text-sm text-gray-500 font-medium group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">Add Photos</span>
                            <input 
                              type="file" 
                              multiple
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, false)}
                            />
                        </>
                    )}
                 </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={submit}
              disabled={saving}
              style={{ background: '#3BD9DA', color: '#131313' }}
              className="hover:opacity-90 font-semibold"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Offer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --------- Page ---------
const Offering = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchParams] = useSearchParams();
  const initialTab =
    (searchParams.get("tab") as "approved" | "pending") || "approved";
  const [activeTab, setActiveTab] = useState<"approved" | "pending">(
    initialTab,
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [offers, setOffers] = useState<OfferDTO[]>([]);
  const [approvedoffers, approvedsetOffers] = useState<OfferDTO[]>([]);
  const [pendingoffers, pendingsetOffers] = useState<OfferDTO[]>([]);
  const [cancelledoffers, cancelledsetOffers] = useState<OfferDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OfferDTO | null>(null);

  const reloadApproved = async () => {
    if (!user.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
      // Pass mine: true to ensure we only get offers for the logged-in user
      const res = await offersApi.list("approved", token || undefined, { mine: true });
      const allOffers = Array.isArray((res as any).data) ? (res as any).data : [];
      console.log("Approved Offers (mine=true):", allOffers);
      approvedsetOffers(allOffers);
    } finally {
      setLoading(false);
    }
  };
  const reloadPending = async () => {
    if (!user.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
      const res = await offersApi.list("pending", token || undefined, { mine: true });
      console.log("Raw API Response (Pending):", res);
      const allOffers = Array.isArray((res as any).data) ? (res as any).data : [];
      console.log("Pending Offers (mine=true):", allOffers);
      pendingsetOffers(allOffers);
    } finally {
      setLoading(false);
    }
  };
  const reloadCancelled = async () => {
    if (!user.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
      const res = await offersApi.list("cancelled", token || undefined, { mine: true });
      const allOffers = Array.isArray((res as any).data) ? (res as any).data : [];
      console.log("Cancelled Offers (mine=true):", allOffers);
      cancelledsetOffers(allOffers);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    reloadCancelled();
    reloadPending();
    reloadApproved();

    const intervalId = setInterval(() => {
      reloadCancelled();
      reloadPending();
      reloadApproved();
    }, 100000); // poll every 10s to reflect admin approvals automatically
    return () => clearInterval(intervalId);
  }, [user.id]);

  useEffect(() => {
    if (activeTab === "approved") {
      setOffers(approvedoffers);
    } else if (activeTab === "pending") {
      setOffers(pendingoffers);
    }
  }, [activeTab, approvedoffers, pendingoffers, cancelledoffers]);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(offers.length / itemsPerPage);
  const paginatedOffers = offers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );
 
  const handleToggleCollapse = () => setIsCollapsed(!isCollapsed);
  const handleToggleDropdown = (id: string) =>
    setShowDropdown(showDropdown === id ? null : id);
  const handleCardClick = (id: string) => navigate(`/offering/${id}`);

  const onApprove = async (id: string) => {
    const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
    await offersApi.setStatus(id, "approved", token || undefined);
    reloadApproved();
    setShowDropdown(null);
  };
  const onCancel = async (id: string) => {
    const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
    await offersApi.setStatus(id, "cancelled", token || undefined);
    reloadCancelled();
    setShowDropdown(null);
  };
  const onDelete = async (id: string) => {
    const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
    await offersApi.remove(id, token || undefined);
    reloadApproved();
    setShowDropdown(null);
  };
  const onEdit = (offer: OfferDTO) => {
    setEditing(offer);
    setModalOpen(true);
  };

  const onSaved = (offer: OfferDTO, isEdit: boolean) => {
    // Reload all categories to ensure lists are correct
    reloadCancelled();
    reloadPending();
    reloadApproved();
    setModalOpen(false);
  };

  const tabs: { key: "approved" | "pending"; label: string; count: number }[] = [
    { key: "approved", label: "Approved", count: approvedoffers.length },
    { key: "pending",  label: "Pending",  count: pendingoffers.length },
  ];

  return (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-950 font-plus-jakarta overflow-hidden motion-page-shell">
      {/* Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader Headtitle="Offerings" />

        <div className="flex-1 flex flex-col overflow-hidden m-4 lg:m-5">
          {/* ── Toolbar ── */}
          <div data-animate="section" className="flex items-center justify-between px-1 pb-4 motion-section-reveal">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  data-active={activeTab === tab.key ? "true" : "false"}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-plus-jakarta transition-all duration-150 ${
                    activeTab === tab.key
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  } motion-tab-trigger`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                        activeTab === tab.key
                          ? "text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}
                      style={activeTab === tab.key ? { background: '#3BD9DA' } : {}}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Add button */}
            <Button
              onClick={() => navigate("/offering/add")}
              className="rounded-xl px-5 h-10 font-semibold text-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
              style={{ background: '#3BD9DA', color: '#131313' }}
            >
              <Plus size={16} />
              Add Offering
            </Button>
          </div>

          {/* ── Grid ── */}
          <div
            className="flex-1 overflow-y-auto scrollbar-hide"
            onClick={() => setShowDropdown(null)}
          >
            {loading ? (
              <UniqueStaysSkeleton />
            ) : offers.length === 0 ? (
              /* ── Empty state ── */
              <div data-animate="section" className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4 motion-section-reveal">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: '#E8FAFA' }}
                >
                  <Award size={36} style={{ color: '#3BD9DA' }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {activeTab === "approved" ? "No approved offerings yet" : "No pending offerings"}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mb-6 leading-relaxed">
                  {activeTab === "approved"
                    ? "Once the admin approves your submitted offerings, they'll appear here."
                    : "Offerings you create go into pending review first. Create one to get started."}
                </p>
                {activeTab === "approved" ? (
                  <button
                    onClick={() => setActiveTab("pending")}
                    className="text-sm font-semibold transition-colors"
                    style={{ color: '#3BD9DA' }}
                  >
                    View pending offerings →
                  </button>
                ) : (
                  <Button
                    onClick={() => navigate("/offering/add")}
                    className="rounded-xl px-6 h-10 font-semibold text-sm"
                    style={{ background: '#3BD9DA', color: '#131313' }}
                  >
                    <Plus size={15} className="mr-2" /> Create your first offering
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div key={activeTab} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6 motion-tab-panel" data-animate-group="offering-cards" data-stagger="80">
                  {paginatedOffers.map((listing) => (
                    <OfferingCard
                      key={listing._id}
                      listing={listing}
                      showDropdown={showDropdown}
                      onToggleDropdown={handleToggleDropdown}
                      onApprove={onApprove}
                      onCancel={onCancel}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onCardClick={handleCardClick}
                    />
                  ))}
                </div>
                <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <OfferModal
        open={modalOpen}
        initial={editing}
        onOpenChange={(v) => setModalOpen(v)}
        onSaved={onSaved}
      />
    </div>
  );
};

export default Offering;
