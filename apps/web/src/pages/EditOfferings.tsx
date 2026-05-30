import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, MapPin, Tag, Tent, Percent, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { offersApi, OfferDTO } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCountriesData } from "@/hooks/useCountriesData";
import { PiVanBold } from "react-icons/pi";
import { GiBinoculars } from "react-icons/gi";
import {
  TEAL,
  BLACK,
  GRAY_500,
  GRAY_400,
  GRAY_200,
  WHITE,
  SURFACE,
  ERROR,
  ERROR_BG,
  SectionCard,
  Field,
  StyledInput,
  StyledTextarea,
  StyledSelect,
  RulesList,
  FeaturePill,
} from "@/components/offering";
import { DiscountOffersStep } from "@/components/onboarding/shared";
import type { DiscountOffer } from "@/components/onboarding/shared";
import { SearchableSelect } from "@/components/onboarding/shared/primitives";
import { CamperVanPricing, UniqueStayPricing, ActivityPricing } from "@/components/offering";
import {
  DescriptionStep as CaravanDescriptionStep,
  CategoryStep as CaravanCategoryStep,
  FeaturesStep as CaravanFeaturesStep,
  CapacityAddressStep as CaravanCapacityAddressStep,
  PricingStep as CaravanPricingStep,
} from "@/components/onboarding/caravan";

// ─── Constants (mirrors AddOfferings) ─────────────────────────────────────────
const TABS = [
  { key: "camper-van", label: "Camper Van", icon: <PiVanBold size={16} /> },
  { key: "unique-stay", label: "Unique Stays", icon: <Tent size={16} /> },
  { key: "activity", label: "Activities", icon: <GiBinoculars size={16} /> },
];

// Camper-van categories live in CaravanCategoryStep — single source of
// truth. Keep unique-stay + activity here until those tabs are migrated too.
const CATEGORIES: Record<string, string[]> = {
  "unique-stay": [
    "Villa",
    "Cabin",
    "Castle",
    "Cave",
    "Farmhouse",
    "Camping",
    "Hut",
    "Heritage",
    "Tiny Home",
    "Tent",
    "Container",
    "Treehouse",
  ],
  activity: [
    "Hiking",
    "Camping",
    "Rafting",
    "Paragliding",
    "Trekking",
    "Biking",
    "Safari",
    "Snorkeling",
    "Kayaking",
  ],
};

// Camper-van features live in CaravanFeaturesStep — single source of truth.
// Keep unique-stay + activity here until those tabs are migrated too.
const FEATURES: Record<string, string[]> = {
  "unique-stay": [
    "WiFi",
    "AC",
    "Kitchen",
    "Pool",
    "Parking",
    "Garden",
    "BBQ",
    "Fireplace",
    "Hot Tub",
    "Gym",
    "Laundry",
  ],
  activity: ["Guide", "Equipment", "Meals", "Transport", "Insurance", "Photography"],
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// EditPhotoGrid removed — all three tabs now use CaravanDescriptionStep for
// photo + cover handling (via handleBridgeCoverUpload/handleBridgePhotoUpload).

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const EditOfferings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("camper-van");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    rules: [""] as string[],
    features: [] as string[],
    address: "",
    locality: "",
    pincode: "",
    city: "",
    state: "",
    // Camper Van
    seatingCapacity: "1",
    sleepingCapacity: "0",
    perKmCharge: "",
    perDayCharge: "",
    perKmIncludes: [] as string[],
    perKmExcludes: [] as string[],
    perDayIncludes: [] as string[],
    perDayExcludes: [] as string[],
    // Unique Stay
    stayType: "entire",
    guestCapacity: 1,
    numberOfRooms: 0,
    numberOfBeds: 0,
    numberOfBathrooms: 0,
    rooms: [] as any[],
    entireStayRules: [] as string[],
    optionalRules: [] as string[],
    // Activity
    activityName: "",
    timeDuration: "",
    personCapacity: 1,
    expectations: [] as string[],
    priceDetails: [] as any[],
    // Pricing
    regularPrice: "",
    priceIncludes: [] as string[],
    priceExcludes: [] as string[],
    // Discounts — UI-only state; the model has no discount fields so these
    // reset on every reload. finalPrice fields mirror the onboarding shape.
    firstUserDiscount: false,
    firstUserDiscountType: "percentage",
    firstUserDiscountValue: "",
    firstUserDiscountFinalPrice: "",
    festivalOffers: false,
    festivalOffersType: "percentage",
    festivalOffersValue: "",
    festivalOffersFinalPrice: "",
    weeklyMonthlyOffers: false,
    weeklyMonthlyOffersType: "percentage",
    weeklyMonthlyOffersValue: "",
    weeklyMonthlyOffersFinalPrice: "",
    specialOffers: false,
    specialOffersType: "percentage",
    specialOffersValue: "",
    specialOffersFinalPrice: "",
  });

  // Photos tracked as URLs directly (edit-safe)
  const [coverUrl, setCoverUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  // ─── Load offer ────────────────────────────────────────────────────────────
  // useQuery caches the offer keyed by id so navigating from /offering →
  // /offering/:id/edit and back doesn't re-hit the API.
  const offerQuery = useQuery({
    queryKey: ["offer", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await offersApi.get(id!);
      return res.data as OfferDTO;
    },
  });

  // Mirror the fetched offer into the editable form state on first load.
  // Keyed by `offerQuery.data` so resetting the cache (e.g. invalidate)
  // re-seeds the form. We don't restore unsaved edits on refetch — this
  // matches the legacy fire-once behavior.
  useEffect(() => {
    if (!offerQuery.data) return;
    const o = offerQuery.data;

    let tab = "camper-van";
    const st = (o.serviceType || "").toLowerCase();
    const cat = (o.category || "").toLowerCase();
    if (st === "unique-stay" || cat.includes("stay")) tab = "unique-stay";
    else if (st === "activity" || cat.includes("activity")) tab = "activity";
    setActiveTab(tab);

    setFormData({
      name: tab === "activity" ? "" : o.name || "",
      activityName: tab === "activity" ? o.name || "" : "",
      category: o.category || "",
      description: o.description || "",
      rules: o.rules?.length ? o.rules : [""],
      features: o.features || [],
      address: o.address || "",
      locality: o.locality || "",
      pincode: o.pincode || "",
      city: o.city || "",
      state: o.state || "",
      // Camper Van
      seatingCapacity: String(o.seatingCapacity || "1"),
      sleepingCapacity: String(o.sleepingCapacity || "0"),
      perKmCharge: String(o.perKmCharge || ""),
      perDayCharge: String(o.perDayCharge || ""),
      perKmIncludes: o.perKmIncludes || [],
      perKmExcludes: o.perKmExcludes || [],
      perDayIncludes: o.perDayIncludes || [],
      perDayExcludes: o.perDayExcludes || [],
      // Unique Stay
      stayType: o.stayType || "entire",
      guestCapacity: Number(o.guestCapacity || 1),
      numberOfRooms: Number(o.numberOfRooms || 0),
      numberOfBeds: Number(o.numberOfBeds || 0),
      numberOfBathrooms: Number(o.numberOfBathrooms || 0),
      rooms: [],
      entireStayRules: [],
      optionalRules: [],
      // Activity
      timeDuration: o.timeDuration || "",
      personCapacity: Number(o.personCapacity || 1),
      expectations: o.expectations || [],
      priceDetails: [],
      // Pricing
      regularPrice: String(o.regularPrice || ""),
      priceIncludes: o.priceIncludes?.length ? o.priceIncludes : [],
      priceExcludes: o.priceExcludes?.length ? o.priceExcludes : [],
      // Discounts (not persisted in model, reset)
      firstUserDiscount: false,
      firstUserDiscountType: "percentage",
      firstUserDiscountValue: "",
      firstUserDiscountFinalPrice: "",
      festivalOffers: false,
      festivalOffersType: "percentage",
      festivalOffersValue: "",
      festivalOffersFinalPrice: "",
      weeklyMonthlyOffers: false,
      weeklyMonthlyOffersType: "percentage",
      weeklyMonthlyOffersValue: "",
      weeklyMonthlyOffersFinalPrice: "",
      specialOffers: false,
      specialOffersType: "percentage",
      specialOffersValue: "",
      specialOffersFinalPrice: "",
    });

    setCoverUrl(o.photos?.coverUrl || "");
    setGalleryUrls(o.photos?.galleryUrls || []);
    setLoading(false);
  }, [offerQuery.data]);

  useEffect(() => {
    if (offerQuery.error) {
      toast.error("Failed to load offering");
      navigate("/offering");
    }
  }, [offerQuery.error, navigate]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const clearError = (field: string) =>
    setErrors((p) => {
      const n = { ...p };
      delete n[field];
      return n;
    });

  const set = (field: string, value: any) => {
    setFormData((p) => ({ ...p, [field]: value }));
    clearError(field);
  };

  const handleArrayChange = (field: string, index: number, value: string) =>
    setFormData((p) => ({
      ...p,
      [field]: (p as any)[field].map((item: string, i: number) => (i === index ? value : item)),
    }));

  const addArrayItem = (field: string) =>
    setFormData((p) => ({ ...p, [field]: [...(p as any)[field], ""] }));

  const removeArrayItem = (field: string, index: number) =>
    setFormData((p) => ({
      ...p,
      [field]: (p as any)[field].filter((_: any, i: number) => i !== index),
    }));

  const toggleFeature = (f: string) =>
    setFormData((p) => ({
      ...p,
      features: p.features.includes(f) ? p.features.filter((x) => x !== f) : [...p.features, f],
    }));

  // ─── Onboarding-step bridging ──────────────────────────────────────────────
  // The camper-van branch reuses the onboarding step components inline so the
  // edit page matches the create flow. These bridges adapt EditOfferings'
  // URL-based photo state and string-typed capacity to the shapes the step
  // components expect, plus expose the location data + map source they need.
  const locationData = useCountriesData();
  const mapQuery =
    `${formData.address || ""} ${formData.city || ""} ${formData.state || ""} ${formData.pincode || ""} India`.trim();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  // Used by the unique-stay + activity tabs' Location section so State/City
  // become searchable dropdowns matching the camper-van flow.
  const locationCountry = useMemo(
    () => locationData.find((c: any) => c.name === (formData.locality || "India")),
    [locationData, formData.locality],
  );
  const stateOptions = useMemo(
    () =>
      ((locationCountry as any)?.states ?? []).map((st: any) => ({
        label: st.name,
        value: st.name,
      })),
    [locationCountry],
  );
  const cityOptions = useMemo(() => {
    const st = (locationCountry as any)?.states?.find((s: any) => s.name === formData.state);
    return (st?.cities ?? []).map((ct: any) => ({ label: ct.name, value: ct.name }));
  }, [locationCountry, formData.state]);

  const [customFeatures, setCustomFeatures] = useState<{ name: string; icon: any }[]>([]);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");

  const handleAddCustomFeature = () => {
    const name = customFeatureInput.trim();
    if (!name) return;
    setCustomFeatures((prev) => [...prev, { name, icon: null }]);
    // Also fold the custom name into the persisted features array so save
    // round-trips it; on next load it'll just show as a regular pill.
    setFormData((p) => ({
      ...p,
      features: p.features.includes(name) ? p.features : [...p.features, name],
    }));
    setCustomFeatureInput("");
    setShowCustomFeaturesInput(false);
  };

  const handleRemoveCustomFeature = (idx: number) => {
    setCustomFeatures((prev) => {
      const removed = prev[idx]?.name;
      if (removed) {
        setFormData((p) => ({
          ...p,
          features: p.features.filter((f) => f !== removed),
        }));
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const adjustCapacity = (type: "seating" | "sleeping", direction: "increase" | "decrease") => {
    const field = type === "seating" ? "seatingCapacity" : "sleepingCapacity";
    setFormData((p) => {
      const current = Number((p as any)[field] || 0);
      const min = type === "seating" ? 1 : 0;
      const next =
        direction === "increase" ? Math.min(20, current + 1) : Math.max(min, current - 1);
      return { ...p, [field]: String(next) };
    });
  };

  // Single-file upload helper, lifted out of EditPhotoGrid so the camper-van
  // branch can hand FileList objects from DescriptionStep into the same path.
  const uploadFileToServer = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("files", file);
    const res = await fetch(`${API_BASE_URL}/api/vendorchats/upload`, {
      method: "POST",
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json();
    if (json.success && json.data?.length > 0) {
      const url = json.data[0].url;
      return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
    }
    throw new Error(json.message || "Upload failed");
  };

  const handleBridgeCoverUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const url = await uploadFileToServer(file);
      setCoverUrl(url);
      clearError("cover");
      clearError("coverImage");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
  };

  const handleBridgePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        try {
          const url = await uploadFileToServer(file);
          setGalleryUrls((prev) => [...prev, url]);
          clearError("gallery");
          clearError("photos");
        } catch (err: any) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  // Discount bridging — DiscountOffersStep takes a structured `offers` object
  // with toggle/change handlers, but our state stores them as flat fields per
  // legacy edit form. Map between the two shapes here. Discounts are still
  // not persisted on save (no fields in OfferDTO).
  const DISCOUNT_PREFIX: Record<
    "firstUser" | "festival" | "weekly" | "special",
    "firstUserDiscount" | "festivalOffers" | "weeklyMonthlyOffers" | "specialOffers"
  > = {
    firstUser: "firstUserDiscount",
    festival: "festivalOffers",
    weekly: "weeklyMonthlyOffers",
    special: "specialOffers",
  };

  const discountOffers: Record<"firstUser" | "festival" | "weekly" | "special", DiscountOffer> = {
    firstUser: {
      enabled: formData.firstUserDiscount,
      type: formData.firstUserDiscountType,
      value: formData.firstUserDiscountValue,
      finalPrice: formData.firstUserDiscountFinalPrice,
    },
    festival: {
      enabled: formData.festivalOffers,
      type: formData.festivalOffersType,
      value: formData.festivalOffersValue,
      finalPrice: formData.festivalOffersFinalPrice,
    },
    weekly: {
      enabled: formData.weeklyMonthlyOffers,
      type: formData.weeklyMonthlyOffersType,
      value: formData.weeklyMonthlyOffersValue,
      finalPrice: formData.weeklyMonthlyOffersFinalPrice,
    },
    special: {
      enabled: formData.specialOffers,
      type: formData.specialOffersType,
      value: formData.specialOffersValue,
      finalPrice: formData.specialOffersFinalPrice,
    },
  };

  const handleDiscountToggle = (key: "firstUser" | "festival" | "weekly" | "special") => {
    const field = DISCOUNT_PREFIX[key];
    setFormData((p) => ({ ...p, [field]: !(p as any)[field] }));
  };

  const handleDiscountOfferChange = (
    key: "firstUser" | "festival" | "weekly" | "special",
    field: keyof DiscountOffer,
    value: string,
  ) => {
    if (field === "enabled") return;
    const suffix = field === "type" ? "Type" : field === "value" ? "Value" : "FinalPrice";
    const stateField = `${DISCOUNT_PREFIX[key]}${suffix}`;
    setFormData((p) => ({ ...p, [stateField]: value }));
  };

  // Rules in onboarding's DescriptionStep are 0-indexed text entries with
  // dedicated add/update/remove handlers (no sentinel empty row). Edit seeds
  // rules with `[""]` so the existing form shows a blank row; bridge both.
  const handleAddRule = () => addArrayItem("rules");
  const handleUpdateRule = (index: number, value: string) =>
    handleArrayChange("rules", index, value);
  const handleRemoveRule = (index: number) => removeArrayItem("rules", index);

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
    if (galleryUrls.length < 5)
      e.gallery = `Upload at least 5 gallery photos (${galleryUrls.length}/5)`;
    if (!formData.state) e.state = "State is required";
    if (!formData.city) e.city = "City is required";
    if (activeTab === "camper-van") {
      if (!formData.perKmCharge && !formData.perDayCharge)
        e.perKmCharge = "At least one pricing is required";
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

      // Camper-van uses perKm/perDay charges + their own includes/excludes,
      // so we omit the unique-stay/activity regularPrice + priceIncludes/
      // priceExcludes fields to avoid stomping them with zeros/empties.
      const sharedPriceFields =
        activeTab === "camper-van"
          ? {}
          : {
              regularPrice: Number(formData.regularPrice || 0),
              priceIncludes: formData.priceIncludes.filter(Boolean),
              priceExcludes: formData.priceExcludes.filter(Boolean),
            };

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
        ...sharedPriceFields,
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
  const features = FEATURES[activeTab] || [];
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
    <DashboardLayout title="Edit Offering" contentClassName="flex-1 overflow-y-auto p-4 lg:p-6 pb-24">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            {/* ── Page header ── */}
            <div className="text-center space-y-2 pt-2">
              <div className="flex items-center justify-center gap-2.5 mb-3">
                <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: GRAY_400,
                  }}
                >
                  Edit Listing
                </span>
                <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
              </div>
              <h1
                style={{
                  fontSize: "clamp(22px, 3.5vw, 30px)",
                  fontWeight: 800,
                  color: BLACK,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                }}
              >
                Edit Offering
              </h1>
              <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
                Update details for your service offering.
              </p>
            </div>

            {/* ── Offering-type badge (read-only on edit; the offering's type
                is fixed at creation and a tab switcher here would share state
                across types and risk converting the offering on save). ── */}
            {(() => {
              const tab = TABS.find((t) => t.key === activeTab);
              if (!tab) return null;
              return (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    alignSelf: "flex-start",
                    padding: "8px 14px",
                    borderRadius: 99,
                    backgroundColor: `${TEAL}12`,
                    border: `1.5px solid ${TEAL}30`,
                    color: TEAL,
                    fontSize: 12.5,
                    fontWeight: 700,
                    letterSpacing: "0.01em",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </div>
              );
            })()}

            {activeTab === "camper-van" ? (
              <>
                {/* Camper-van edit now reuses the onboarding step components so
                    the create/edit flows share one UI. Discount section below
                    still renders for all tabs. */}
                <CaravanDescriptionStep
                  embedded
                  name={formData.name}
                  description={formData.description}
                  rules={formData.rules}
                  photos={galleryUrls}
                  coverImage={coverUrl ? [coverUrl] : []}
                  errors={{
                    ...errors,
                    coverImage: errors.cover,
                    photos: errors.gallery,
                  }}
                  onNameChange={(v) => set("name", v)}
                  onDescriptionChange={(v) => set("description", v)}
                  onAddRule={handleAddRule}
                  onRemoveRule={handleRemoveRule}
                  onUpdateRule={handleUpdateRule}
                  onPhotoUpload={handleBridgePhotoUpload}
                  onCoverUpload={handleBridgeCoverUpload}
                  onRemovePhoto={(i) =>
                    setGalleryUrls((p) => p.filter((_, idx) => idx !== i))
                  }
                  onRemoveCover={() => setCoverUrl("")}
                  clearError={clearError}
                />

                <CaravanCategoryStep
                  embedded
                  category={formData.category || null}
                  onSelect={(name) => set("category", name)}
                />

                <CaravanFeaturesStep
                  embedded
                  features={formData.features}
                  customFeatures={customFeatures}
                  showCustomFeaturesInput={showCustomFeaturesInput}
                  customFeatureInput={customFeatureInput}
                  onToggleFeature={toggleFeature}
                  onRemoveCustomFeature={handleRemoveCustomFeature}
                  onToggleCustomInput={() =>
                    setShowCustomFeaturesInput(!showCustomFeaturesInput)
                  }
                  onCustomFeatureInputChange={setCustomFeatureInput}
                  onAddCustomFeature={handleAddCustomFeature}
                />

                <CaravanCapacityAddressStep
                  embedded
                  seatingCapacity={Number(formData.seatingCapacity) || 1}
                  sleepingCapacity={Number(formData.sleepingCapacity) || 0}
                  address={formData.address}
                  locality={formData.locality || "India"}
                  state={formData.state}
                  city={formData.city}
                  pincode={formData.pincode}
                  locationData={locationData}
                  mapSrc={mapSrc}
                  errors={errors}
                  onAdjustCapacity={adjustCapacity}
                  onAddressChange={(v) => set("address", v)}
                  onLocalityChange={(v) =>
                    setFormData((p) => ({ ...p, locality: v, state: "", city: "" }))
                  }
                  onStateChange={(v) =>
                    setFormData((p) => ({ ...p, state: v, city: "" }))
                  }
                  onCityChange={(v) => set("city", v)}
                  onPincodeChange={(v) => set("pincode", v.replace(/\D/g, ""))}
                  clearError={clearError}
                />

                <CaravanPricingStep
                  embedded
                  perKmCharge={formData.perKmCharge}
                  perDayCharge={formData.perDayCharge}
                  perKmIncludes={formData.perKmIncludes}
                  perKmExcludes={formData.perKmExcludes}
                  perDayIncludes={formData.perDayIncludes}
                  perDayExcludes={formData.perDayExcludes}
                  errors={errors}
                  onPerKmChargeChange={(v) => set("perKmCharge", v)}
                  onPerDayChargeChange={(v) => set("perDayCharge", v)}
                  onAddPriceItem={(field) => addArrayItem(field)}
                  onUpdatePriceItem={(field, i, v) => handleArrayChange(field, i, v)}
                  onRemovePriceItem={(field, i) => removeArrayItem(field, i)}
                  clearError={clearError}
                />
              </>
            ) : (
              <>
            {/* ── Category (small section since DescriptionStep doesn't carry it) ── */}
            <SectionCard
              icon={<Tag size={16} color={TEAL} strokeWidth={2.5} />}
              title={activeTab === "activity" ? "Activity Type" : "Category"}
              subtitle="Pick the type that best describes your offering"
            >
              <Field
                label={activeTab === "activity" ? "Activity Type" : "Category"}
                required
                error={errors.category}
              >
                <StyledSelect
                  value={formData.category}
                  onChange={(v) => set("category", v)}
                  placeholder="Select"
                  error={!!errors.category}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </StyledSelect>
              </Field>
            </SectionCard>

            {/* ── Description + Photos via the same component the onboarding flow uses ── */}
            <CaravanDescriptionStep
              embedded
              nameLabel={activeTab === "activity" ? "Activity Name" : "Property Name"}
              namePlaceholder={
                activeTab === "activity" ? "e.g. River Rafting" : "e.g. Sunset Villa"
              }
              name={activeTab === "activity" ? formData.activityName : formData.name}
              description={formData.description}
              rules={formData.rules}
              photos={galleryUrls}
              coverImage={coverUrl ? [coverUrl] : []}
              errors={{
                ...errors,
                coverImage: errors.cover,
                photos: errors.gallery,
              }}
              onNameChange={(v) => set(activeTab === "activity" ? "activityName" : "name", v)}
              onDescriptionChange={(v) => set("description", v)}
              onAddRule={handleAddRule}
              onRemoveRule={handleRemoveRule}
              onUpdateRule={handleUpdateRule}
              onPhotoUpload={handleBridgePhotoUpload}
              onCoverUpload={handleBridgeCoverUpload}
              onRemovePhoto={(i) => setGalleryUrls((p) => p.filter((_, idx) => idx !== i))}
              onRemoveCover={() => setCoverUrl("")}
              clearError={clearError}
            />

            {/* ── Features ── */}
            <SectionCard
              icon={<Tag size={16} color={TEAL} strokeWidth={2.5} />}
              title="Features"
              subtitle="What your offering includes"
            >
              <div className="flex flex-wrap gap-2.5">
                {features.map((f) => (
                  <FeaturePill
                    key={f}
                    label={f}
                    selected={formData.features.includes(f)}
                    onClick={() => toggleFeature(f)}
                  />
                ))}
              </div>
            </SectionCard>

            {/* ── Location ── */}
            <SectionCard
              icon={<MapPin size={16} color={TEAL} strokeWidth={2.5} />}
              title="Location"
              subtitle="Where is your offering located?"
            >
              <Field label="Address">
                <StyledInput
                  value={formData.address}
                  onChange={(v) => set("address", v)}
                  placeholder="Street address"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="State" required error={errors.state}>
                  <SearchableSelect
                    value={formData.state}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, state: v, city: "" }))
                    }
                    options={stateOptions}
                    placeholder="Select State"
                    searchPlaceholder="Search states…"
                    emptyMessage="No states found"
                    error={!!errors.state}
                  />
                </Field>
                <Field label="City" required error={errors.city}>
                  <SearchableSelect
                    value={formData.city}
                    onChange={(v) => set("city", v)}
                    options={cityOptions}
                    placeholder={formData.state ? "Select City" : "Select a state first"}
                    searchPlaceholder="Search cities…"
                    emptyMessage="No cities found"
                    disabled={!formData.state}
                    error={!!errors.city}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pincode">
                  <StyledInput
                    value={formData.pincode}
                    onChange={(v) => set("pincode", v.replace(/\D/g, ""))}
                    placeholder="6-digit code"
                    maxLength={6}
                  />
                </Field>
                <Field label="Locality">
                  <StyledInput
                    value={formData.locality}
                    onChange={(v) => set("locality", v)}
                    placeholder="Locality / Country"
                  />
                </Field>
              </div>
            </SectionCard>

            {/* ── Pricing (tab-specific) ── */}
            <SectionCard
              icon={<IndianRupee size={16} color={TEAL} strokeWidth={2.5} />}
              title="Pricing"
              subtitle="Set your rates"
            >
              {activeTab === "camper-van" && (
                <CamperVanPricing formData={formData} set={set} errors={errors} {...arrayHelpers} />
              )}
              {activeTab === "unique-stay" && (
                <UniqueStayPricing
                  formData={formData}
                  set={set}
                  errors={errors}
                  {...arrayHelpers}
                />
              )}
              {activeTab === "activity" && (
                <ActivityPricing formData={formData} set={set} errors={errors} {...arrayHelpers} />
              )}
            </SectionCard>
              </>
            )}

            {/* ── Discounts ── */}
            <SectionCard
              icon={<Percent size={16} color={TEAL} strokeWidth={2.5} />}
              title="Discounts"
              subtitle="Optional promotional offers"
            >
              <DiscountOffersStep
                embedded
                offers={discountOffers}
                onToggle={handleDiscountToggle}
                onOfferChange={handleDiscountOfferChange}
                errors={errors}
                weeklyLabel="Weekly / Monthly Offers"
              />
            </SectionCard>

            {/* ── Submit error ── */}
            {errors.submit && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 16px",
                  borderRadius: 13,
                  backgroundColor: ERROR_BG,
                  border: "1.5px solid #fca5a5",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: ERROR }}>{errors.submit}</p>
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex justify-end gap-3 pt-2 pb-6">
              <button
                type="button"
                onClick={() => navigate(`/offering/${id}`)}
                style={{
                  height: 44,
                  padding: "0 24px",
                  borderRadius: 13,
                  border: `1.5px solid ${GRAY_200}`,
                  backgroundColor: "transparent",
                  fontSize: 14,
                  fontWeight: 600,
                  color: GRAY_500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  height: 44,
                  padding: "0 28px",
                  borderRadius: 13,
                  border: "none",
                  backgroundColor: TEAL,
                  fontSize: 14,
                  fontWeight: 700,
                  color: BLACK,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.5 : 1,
                  boxShadow: "0 4px 20px rgba(7,228,228,0.3)",
                }}
              >
                {isSubmitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
    </DashboardLayout>
  );
};

export default EditOfferings;
