import React, { useEffect, useState } from "react";
import { IndianRupee, MapPin, FileText, Camera, Tag, Tent, Percent, Check, Loader2, Trash2, ImagePlus } from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "@/components/Navigation";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardHeader } from "@/components/Header";
import { offersApi, OfferDTO } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { PiVanBold } from "react-icons/pi";
import { GiBinoculars } from "react-icons/gi";
import {
  TEAL, BLACK, GRAY_500, GRAY_400, GRAY_200, WHITE, SURFACE, ERROR, ERROR_BG,
  SectionCard, Field, StyledInput, StyledTextarea, StyledSelect,
  RulesList, FeaturePill, DiscountRow,
} from "@/components/offering";
import { CamperVanPricing, UniqueStayPricing, ActivityPricing } from "@/components/offering";

// ─── Constants (mirrors AddOfferings) ─────────────────────────────────────────
const TABS = [
  { key: "camper-van",   label: "Camper Van",    icon: <PiVanBold size={16} /> },
  { key: "unique-stay",  label: "Unique Stays",  icon: <Tent size={16} /> },
  { key: "activity",     label: "Activities",    icon: <GiBinoculars size={16} /> },
];

const CATEGORIES: Record<string, string[]> = {
  "camper-van":  ["Camper Trailer", "Luxury RV", "Basic Van", "Adventure Vehicle", "Panel Van", "Cargo Van", "Motorhome", "Campervan", "Caravan"],
  "unique-stay": ["Villa", "Cabin", "Castle", "Cave", "Farmhouse", "Camping", "Hut", "Heritage", "Tiny Home", "Tent", "Container", "Treehouse"],
  activity:      ["Hiking", "Camping", "Rafting", "Paragliding", "Trekking", "Biking", "Safari", "Snorkeling", "Kayaking"],
};

const FEATURES: Record<string, string[]> = {
  "camper-van":  ["Fan", "AC", "Kitchen", "Water", "Wifi", "Solar", "Toilet", "Shower", "Fridge", "TV", "Music", "GPS"],
  "unique-stay": ["WiFi", "AC", "Kitchen", "Pool", "Parking", "Garden", "BBQ", "Fireplace", "Hot Tub", "Gym", "Laundry"],
  activity:      ["Guide", "Equipment", "Meals", "Transport", "Insurance", "Photography"],
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const getToken = () =>
  localStorage.getItem("travel_auth_token") || sessionStorage.getItem("travel_auth_token") || "";

// ─── Photo section (edit-aware: works with URLs + accepts new file uploads) ───
const EditPhotoGrid = ({
  coverUrl, galleryUrls,
  onCoverChange, onGalleryAdd, onGalleryRemove,
  uploading, coverError, galleryError,
}: {
  coverUrl: string; galleryUrls: string[];
  onCoverChange: (url: string) => void;
  onGalleryAdd: (url: string) => void;
  onGalleryRemove: (index: number) => void;
  uploading: boolean; coverError?: string; galleryError?: string;
}) => {
  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("files", file);
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/api/vendorchats/upload`, {
      method: "POST", body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json();
    if (json.success && json.data?.length > 0) {
      const url = json.data[0].url;
      return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
    }
    throw new Error(json.message || "Upload failed");
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      onCoverChange(url);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
    e.target.value = "";
  };

  const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const url = await uploadFile(file);
        onGalleryAdd(url);
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Cover */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: GRAY_500, marginBottom: 8 }}>Cover Photo</p>
        <div style={{
          position: "relative", height: 180, borderRadius: 14, overflow: "hidden",
          border: `2px dashed ${coverError ? "#fca5a5" : GRAY_200}`, backgroundColor: SURFACE,
        }}>
          {coverUrl ? (
            <>
              <img src={getImageUrl(coverUrl)} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                type="button"
                onClick={() => onCoverChange("")}
                style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.9)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: WHITE }}
              >
                <Trash2 size={13} />
              </button>
            </>
          ) : (
            <label style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
              <ImagePlus size={24} color={GRAY_400} />
              <span style={{ fontSize: 13, fontWeight: 600, color: GRAY_500 }}>Upload cover image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
            </label>
          )}
        </div>
        {coverError && <p style={{ fontSize: 11, color: ERROR, marginTop: 4 }}>{coverError}</p>}
      </div>

      {/* Gallery */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: GRAY_500, marginBottom: 8 }}>
          Gallery Photos <span style={{ color: GRAY_400, fontWeight: 400 }}>({galleryUrls.length} uploaded, min 5)</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {galleryUrls.map((url, i) => (
            <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: `1.5px solid ${GRAY_200}` }} className="group">
              <img src={getImageUrl(url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                type="button"
                onClick={() => onGalleryRemove(i)}
                style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.85)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0, transition: "opacity 0.15s" }}
                className="group-hover:!opacity-100"
              >
                <Trash2 size={11} color={WHITE} />
              </button>
            </div>
          ))}
          <label style={{ aspectRatio: "1", borderRadius: 10, border: `2px dashed ${galleryError ? "#fca5a5" : GRAY_200}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: uploading ? "not-allowed" : "pointer", backgroundColor: SURFACE }}>
            {uploading ? <Loader2 size={20} color={GRAY_400} className="animate-spin" /> : (
              <><ImagePlus size={20} color={GRAY_400} /><span style={{ fontSize: 11, fontWeight: 600, color: GRAY_400 }}>Add</span></>
            )}
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleGallerySelect} disabled={uploading} />
          </label>
        </div>
        {galleryError && <p style={{ fontSize: 11, color: ERROR, marginTop: 4 }}>{galleryError}</p>}
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const EditOfferings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("camper-van");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "", category: "", description: "", rules: [""] as string[], features: [] as string[],
    address: "", locality: "", pincode: "", city: "", state: "",
    // Camper Van
    seatingCapacity: "1", sleepingCapacity: "0",
    perKmCharge: "", perDayCharge: "",
    perKmIncludes: [] as string[], perKmExcludes: [] as string[],
    perDayIncludes: [] as string[], perDayExcludes: [] as string[],
    // Unique Stay
    stayType: "entire", guestCapacity: 1, numberOfRooms: 0, numberOfBeds: 0, numberOfBathrooms: 0,
    rooms: [] as any[], entireStayRules: [] as string[], optionalRules: [] as string[],
    // Activity
    activityName: "", timeDuration: "", personCapacity: 1, expectations: [] as string[], priceDetails: [] as any[],
    // Pricing
    regularPrice: "", priceIncludes: [] as string[], priceExcludes: [] as string[],
    // Discounts
    firstUserDiscount: false, firstUserDiscountType: "percentage", firstUserDiscountValue: "",
    festivalOffers: false, festivalOffersType: "percentage", festivalOffersValue: "",
    weeklyMonthlyOffers: false, weeklyMonthlyOffersType: "percentage", weeklyMonthlyOffersValue: "",
    specialOffers: false, specialOffersType: "percentage", specialOffersValue: "",
  });

  // Photos tracked as URLs directly (edit-safe)
  const [coverUrl, setCoverUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  // ─── Load offer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    offersApi.get(id).then((res) => {
      const o: OfferDTO = res.data;

      // Determine tab from serviceType or category
      let tab = "camper-van";
      const st = (o.serviceType || "").toLowerCase();
      const cat = (o.category || "").toLowerCase();
      if (st === "unique-stay" || cat.includes("stay")) tab = "unique-stay";
      else if (st === "activity" || cat.includes("activity")) tab = "activity";
      setActiveTab(tab);

      setFormData({
        name:        tab === "activity" ? "" : (o.name || ""),
        activityName: tab === "activity" ? (o.name || "") : "",
        category:    o.category || "",
        description: o.description || "",
        rules:       o.rules?.length ? o.rules : [""],
        features:    o.features || [],
        address:     o.address || "",
        locality:    o.locality || "",
        pincode:     o.pincode || "",
        city:        o.city || "",
        state:       o.state || "",
        // Camper Van
        seatingCapacity:  String(o.seatingCapacity || "1"),
        sleepingCapacity: String(o.sleepingCapacity || "0"),
        perKmCharge:  String(o.perKmCharge || ""),
        perDayCharge: String(o.perDayCharge || ""),
        perKmIncludes:  o.perKmIncludes || [],
        perKmExcludes:  o.perKmExcludes || [],
        perDayIncludes: o.perDayIncludes || [],
        perDayExcludes: o.perDayExcludes || [],
        // Unique Stay
        stayType:          o.stayType || "entire",
        guestCapacity:     Number(o.guestCapacity || 1),
        numberOfRooms:     Number(o.numberOfRooms || 0),
        numberOfBeds:      Number(o.numberOfBeds || 0),
        numberOfBathrooms: Number(o.numberOfBathrooms || 0),
        rooms:             [],
        entireStayRules:   [],
        optionalRules:     [],
        // Activity
        timeDuration:   o.timeDuration || "",
        personCapacity: Number(o.personCapacity || 1),
        expectations:   o.expectations || [],
        priceDetails:   [],
        // Pricing
        regularPrice:   String(o.regularPrice || ""),
        priceIncludes:  o.priceIncludes?.length ? o.priceIncludes : [],
        priceExcludes:  o.priceExcludes?.length ? o.priceExcludes : [],
        // Discounts (not persisted in model, reset)
        firstUserDiscount: false, firstUserDiscountType: "percentage", firstUserDiscountValue: "",
        festivalOffers: false, festivalOffersType: "percentage", festivalOffersValue: "",
        weeklyMonthlyOffers: false, weeklyMonthlyOffersType: "percentage", weeklyMonthlyOffersValue: "",
        specialOffers: false, specialOffersType: "percentage", specialOffersValue: "",
      });

      setCoverUrl(o.photos?.coverUrl || "");
      setGalleryUrls(o.photos?.galleryUrls || []);
    }).catch((e) => {
      toast.error("Failed to load offering");
      navigate("/offering");
    }).finally(() => setLoading(false));
  }, [id]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const clearError = (field: string) =>
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });

  const set = (field: string, value: any) => {
    setFormData((p) => ({ ...p, [field]: value }));
    clearError(field);
  };

  const handleArrayChange = (field: string, index: number, value: string) =>
    setFormData((p) => ({ ...p, [field]: (p as any)[field].map((item: string, i: number) => (i === index ? value : item)) }));

  const addArrayItem = (field: string) =>
    setFormData((p) => ({ ...p, [field]: [...(p as any)[field], ""] }));

  const removeArrayItem = (field: string, index: number) =>
    setFormData((p) => ({ ...p, [field]: (p as any)[field].filter((_: any, i: number) => i !== index) }));

  const toggleFeature = (f: string) =>
    setFormData((p) => ({ ...p, features: p.features.includes(f) ? p.features.filter((x) => x !== f) : [...p.features, f] }));

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (activeTab === "activity") {
      if (!formData.activityName.trim()) e.activityName = "Activity name is required";
    } else {
      if (!formData.name.trim()) e.name = "Name is required";
      if (!formData.category) e.category = "Category is required";
    }
    if (!formData.description.trim()) e.description = "Description is required";
    if (!coverUrl) e.cover = "Cover photo is required";
    if (galleryUrls.length < 5) e.gallery = `Upload at least 5 gallery photos (${galleryUrls.length}/5)`;
    if (!formData.state) e.state = "State is required";
    if (!formData.city) e.city = "City is required";
    if (activeTab === "camper-van") {
      if (!formData.perKmCharge && !formData.perDayCharge) e.perKmCharge = "At least one pricing is required";
    } else if (activeTab === "unique-stay") {
      if (!formData.regularPrice) e.regularPrice = "Price is required";
    } else if (activeTab === "activity") {
      if (!formData.regularPrice) e.regularPrice = "Price is required";
      if (!formData.timeDuration) e.timeDuration = "Duration is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate() || !id) return;
    setIsSubmitting(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      let specificData: any = {};
      if (activeTab === "camper-van") {
        specificData = {
          seatingCapacity: Number(formData.seatingCapacity),
          sleepingCapacity: Number(formData.sleepingCapacity),
          perKmCharge: formData.perKmCharge ? Number(formData.perKmCharge) : undefined,
          perDayCharge: formData.perDayCharge ? Number(formData.perDayCharge) : undefined,
          perKmIncludes: formData.perKmIncludes.filter(Boolean),
          perKmExcludes: formData.perKmExcludes.filter(Boolean),
          perDayIncludes: formData.perDayIncludes.filter(Boolean),
          perDayExcludes: formData.perDayExcludes.filter(Boolean),
        };
      } else if (activeTab === "unique-stay") {
        specificData = {
          guestCapacity: Number(formData.guestCapacity),
          numberOfRooms: Number(formData.numberOfRooms),
          numberOfBeds: Number(formData.numberOfBeds),
          numberOfBathrooms: Number(formData.numberOfBathrooms),
          stayType: formData.stayType,
        };
      } else if (activeTab === "activity") {
        specificData = {
          personCapacity: Number(formData.personCapacity),
          timeDuration: formData.timeDuration,
          expectations: formData.expectations.filter(Boolean),
        };
      }

      const payload: Partial<OfferDTO> = {
        name: activeTab === "activity" ? formData.activityName : formData.name,
        category: formData.category,
        description: formData.description,
        rules: formData.rules.filter(Boolean),
        features: formData.features,
        address: formData.address,
        locality: formData.locality,
        pincode: formData.pincode,
        city: formData.city,
        state: formData.state,
        regularPrice: Number(formData.regularPrice || 0),
        priceIncludes: formData.priceIncludes.filter(Boolean),
        priceExcludes: formData.priceExcludes.filter(Boolean),
        photos: { coverUrl, galleryUrls },
        serviceType: activeTab,
        status: "pending",
        ...specificData,
      };

      const res = await offersApi.update(id, payload, token);
      if (res.success) {
        toast.success("Offering updated!");
        navigate(`/offering/${id}`);
      } else {
        throw new Error((res as any).message || "Update failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = CATEGORIES[activeTab] || [];
  const features   = FEATURES[activeTab]   || [];
  const arrayHelpers = { handleArrayChange, addArrayItem, removeArrayItem };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 size={32} className="animate-spin text-teal-400" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-plus-jakarta">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <DashboardHeader Headtitle="Edit Offering" />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">

            {/* ── Page header ── */}
            <div className="text-center space-y-2 pt-2">
              <div className="flex items-center justify-center gap-2.5 mb-3">
                <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: GRAY_400 }}>Edit Listing</span>
                <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
              </div>
              <h1 style={{ fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 800, color: BLACK, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                Edit Offering
              </h1>
              <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>Update details for your service offering.</p>
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: "flex", gap: 8, backgroundColor: SURFACE, borderRadius: 14, padding: 4 }}>
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button key={tab.key} type="button" onClick={() => { setActiveTab(tab.key); setErrors({}); }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 42, borderRadius: 11, border: `1.5px solid ${active ? `${TEAL}30` : "transparent"}`, backgroundColor: active ? WHITE : "transparent", color: active ? TEAL : GRAY_400, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                    {tab.icon} {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── Description ── */}
            <SectionCard icon={<FileText size={16} color={TEAL} strokeWidth={2.5} />} title="Description" subtitle="Basic info about your offering">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={activeTab === "activity" ? "Activity Name" : "Name"} required error={errors.name || errors.activityName}>
                  <StyledInput
                    value={activeTab === "activity" ? formData.activityName : formData.name}
                    onChange={(v) => set(activeTab === "activity" ? "activityName" : "name", v)}
                    placeholder={activeTab === "activity" ? "e.g. River Rafting" : "e.g. Sunset Villa"}
                    error={!!(errors.name || errors.activityName)}
                  />
                </Field>
                <Field label={activeTab === "activity" ? "Activity Type" : "Category"} required error={errors.category}>
                  <StyledSelect value={formData.category} onChange={(v) => set("category", v)} placeholder="Select" error={!!errors.category}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </StyledSelect>
                </Field>
              </div>
              <Field label="Description" required error={errors.description}>
                <StyledTextarea value={formData.description} onChange={(v) => set("description", v)} placeholder="Describe your offering in detail…" error={!!errors.description} />
              </Field>
              <Field label="Rules">
                <RulesList rules={formData.rules} onChange={(i, v) => handleArrayChange("rules", i, v)} onAdd={() => addArrayItem("rules")} onRemove={(i) => removeArrayItem("rules", i)} />
              </Field>
            </SectionCard>

            {/* ── Photos ── */}
            <SectionCard icon={<Camera size={16} color={TEAL} strokeWidth={2.5} />} title="Photos" subtitle="Cover and gallery images">
              <EditPhotoGrid
                coverUrl={coverUrl}
                galleryUrls={galleryUrls}
                onCoverChange={(url) => { setCoverUrl(url); clearError("cover"); }}
                onGalleryAdd={(url) => { setGalleryUrls((p) => [...p, url]); clearError("gallery"); }}
                onGalleryRemove={(i) => setGalleryUrls((p) => p.filter((_, idx) => idx !== i))}
                uploading={uploading}
                coverError={errors.cover}
                galleryError={errors.gallery}
              />
            </SectionCard>

            {/* ── Features ── */}
            <SectionCard icon={<Tag size={16} color={TEAL} strokeWidth={2.5} />} title="Features" subtitle="What your offering includes">
              <div className="flex flex-wrap gap-2.5">
                {features.map((f) => (
                  <FeaturePill key={f} label={f} selected={formData.features.includes(f)} onClick={() => toggleFeature(f)} />
                ))}
              </div>
            </SectionCard>

            {/* ── Location ── */}
            <SectionCard icon={<MapPin size={16} color={TEAL} strokeWidth={2.5} />} title="Location" subtitle="Where is your offering located?">
              <Field label="Address">
                <StyledInput value={formData.address} onChange={(v) => set("address", v)} placeholder="Street address" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="State" required error={errors.state}>
                  <StyledInput value={formData.state} onChange={(v) => set("state", v)} placeholder="State" error={!!errors.state} />
                </Field>
                <Field label="City" required error={errors.city}>
                  <StyledInput value={formData.city} onChange={(v) => set("city", v)} placeholder="City" error={!!errors.city} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pincode">
                  <StyledInput value={formData.pincode} onChange={(v) => set("pincode", v.replace(/\D/g, ""))} placeholder="6-digit code" maxLength={6} />
                </Field>
                <Field label="Locality">
                  <StyledInput value={formData.locality} onChange={(v) => set("locality", v)} placeholder="Locality / Country" />
                </Field>
              </div>
            </SectionCard>

            {/* ── Pricing (tab-specific) ── */}
            <SectionCard icon={<IndianRupee size={16} color={TEAL} strokeWidth={2.5} />} title="Pricing" subtitle="Set your rates">
              {activeTab === "camper-van"  && <CamperVanPricing  formData={formData} set={set} errors={errors} {...arrayHelpers} />}
              {activeTab === "unique-stay" && <UniqueStayPricing  formData={formData} set={set} errors={errors} {...arrayHelpers} />}
              {activeTab === "activity"    && <ActivityPricing    formData={formData} set={set} errors={errors} {...arrayHelpers} />}
            </SectionCard>

            {/* ── Discounts ── */}
            <SectionCard icon={<Percent size={16} color={TEAL} strokeWidth={2.5} />} title="Discounts" subtitle="Optional promotional offers">
              <div className="flex flex-col gap-3">
                <DiscountRow label="First User Discount"    enabled={formData.firstUserDiscount}    onToggle={(v) => set("firstUserDiscount", v)}    type={formData.firstUserDiscountType}    value={formData.firstUserDiscountValue}    onTypeChange={(v) => set("firstUserDiscountType", v)}    onValueChange={(v) => set("firstUserDiscountValue", v)} />
                <DiscountRow label="Festival Offers"        enabled={formData.festivalOffers}        onToggle={(v) => set("festivalOffers", v)}        type={formData.festivalOffersType}        value={formData.festivalOffersValue}        onTypeChange={(v) => set("festivalOffersType", v)}        onValueChange={(v) => set("festivalOffersValue", v)} />
                <DiscountRow label="Weekly / Monthly Offers" enabled={formData.weeklyMonthlyOffers} onToggle={(v) => set("weeklyMonthlyOffers", v)}  type={formData.weeklyMonthlyOffersType}   value={formData.weeklyMonthlyOffersValue}   onTypeChange={(v) => set("weeklyMonthlyOffersType", v)}   onValueChange={(v) => set("weeklyMonthlyOffersValue", v)} />
                <DiscountRow label="Special Offers"         enabled={formData.specialOffers}         onToggle={(v) => set("specialOffers", v)}         type={formData.specialOffersType}         value={formData.specialOffersValue}         onTypeChange={(v) => set("specialOffersType", v)}         onValueChange={(v) => set("specialOffersValue", v)} />
              </div>
            </SectionCard>

            {/* ── Submit error ── */}
            {errors.submit && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 13, backgroundColor: ERROR_BG, border: "1.5px solid #fca5a5" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: ERROR }}>{errors.submit}</p>
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex justify-end gap-3 pt-2 pb-6">
              <button
                type="button"
                onClick={() => navigate(`/offering/${id}`)}
                style={{ height: 44, padding: "0 24px", borderRadius: 13, border: `1.5px solid ${GRAY_200}`, backgroundColor: "transparent", fontSize: 14, fontWeight: 600, color: GRAY_500, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ height: 44, padding: "0 28px", borderRadius: 13, border: "none", backgroundColor: TEAL, fontSize: 14, fontWeight: 700, color: BLACK, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.5 : 1, boxShadow: "0 4px 20px rgba(7,228,228,0.3)" }}
              >
                {isSubmitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditOfferings;
