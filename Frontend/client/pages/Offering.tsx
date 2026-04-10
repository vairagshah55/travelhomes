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
} from "lucide-react";
import { Sidebar } from "@/components/Navigation";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardHeader } from "@/components/Header";
import { offersApi, OfferDTO, getOnboardingData } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { CustomPagination } from "@/components/CustomPagination";

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
  const seats = listing.seatingCapacity || 0;
  const sleeps = listing.sleepingCapacity || 0;
  const price = Number(listing.regularPrice || 0);
  return (
    <div className="relative group">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        onClick={() => onCardClick(id)}
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden">
          {cover ? (
            <img
              src={getImageUrl(cover)}
              alt={listing.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
          )}

          {/* Badge + Actions */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <Badge className="bg-white text-dashboard-primary font-bold text-sm px-2 py-1 rounded shadow-sm">
              {category}
            </Badge>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/80 hover:bg-white rounded-full shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDropdown(id);
                }}
              >
                <MoreHorizontal size={16} className="text-gray-700" />
              </Button>

              {showDropdown === id && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                  {listing.status === "approved" ? (
                    <>
                      <button
                        className="w-full px-4 py-3 text-left text-sm font-medium text-dashboard-heading dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(listing);
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className="w-full px-4 py-3 text-left text-sm font-medium text-dashboard-heading dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardClick(id);
                        }}
                      >
                        <Eye size={14} /> View
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="w-full px-4 py-3 text-left text-sm font-medium text-dashboard-heading dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(listing);
                        }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>

                      <button
                        className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(id);
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-base text-dashboard-heading dark:text-white mb-2 font-plus-jakarta">
                {listing.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 font-poppins">
                <span>{seats} Seats /</span>
                <span>{sleeps} Sleeps</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Star
                size={14}
                fill="currentColor"
                className="text-dashboard-heading dark:text-white"
              />
              <span className="text-sm font-medium text-dashboard-heading dark:text-white">
                4.9
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-dashboard-heading dark:text-white font-plus-jakarta">
                ₹{price}
              </span>
              <span className="text-sm text-dashboard-heading dark:text-white font-plus-jakarta">
                / day
              </span>
            </div>
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
      <DialogContent className="max-w-4xl p-0">
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
            <Button onClick={submit} disabled={saving}>
              {isEdit ? "Save Changes" : "Create Offer"}
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

  return (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader Headtitle={"Offering"} />

        {/* Content */}
        <div className="flex-1 flex flex-col pr-5 pb-5 min-h-0">
          {/* Tabs + Add button */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-dashboard-stroke dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-3xl">
            <div className="flex items-center">
              <button
                onClick={() => setActiveTab("approved")}
                className={`px-4 py-3 text-base font-bold font-plus-jakarta relative ${
                  activeTab === "approved"
                    ? "text-dashboard-heading dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-dashboard-heading dark:hover:text-white"
                }`}
              >
                Approved
                {activeTab === "approved" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dashboard-primary"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-3 text-base font-bold font-plus-jakarta relative ${
                  activeTab === "pending"
                    ? "text-dashboard-heading dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-dashboard-heading dark:hover:text-white"
                }`}
              >
                Pending
                {activeTab === "pending" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dashboard-primary"></div>
                )}
              </button>
            </div>

            <Button
            onClick={()=>navigate("/offering/add")}
              // onClick={() => {

                // setEditing(null);
                // setModalOpen(true);
              // }}
              className="bg-dashboard-primary text-white hover:bg-gray-800 rounded-full px-6 h-11 font-geist font-medium flex items-center gap-2"
            >
              <Plus size={18} />
              Add New Offers
            </Button>
          </div>

          {/* Grid */}
          <div
            className="flex-1 p-5 bg-white dark:bg-gray-800 rounded-b-3xl overflow-y-auto"
            onClick={() => setShowDropdown(null)}
          >
            {loading ? (
              <UniqueStaysSkeleton />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 ">
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

            {/* Empty State */}
            {!loading &&
              ((activeTab === "approved" && offers.length === 0) ||
                (activeTab === "pending" && offers.length === 0)) && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <Plus size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-dashboard-heading dark:text-white mb-2">
                    No {activeTab} offerings yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm">
                    {activeTab === "approved"
                      ? "Approved offers will show here once the admin approves your offer."
                      : "Newly created offers appear here as pending until approved by admin."}
                  </p>
                </div>
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
