import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tag,
  Tent,
  Loader2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { offersApi, OfferDTO } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCountriesData } from "@/hooks/useCountriesData";
import { useOfferingCatalog } from "@/hooks/useOfferingCatalog";
import { PiVanBold } from "react-icons/pi";
import { GiBinoculars } from "react-icons/gi";
import {
  TEAL,
  BLACK,
  GRAY_500,
  GRAY_400,
  GRAY_200,
  ERROR,
  ERROR_BG,
  SectionCard,
  Field,
  StyledInput,
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

// ─── Constants ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "camper-van", label: "Camper Van", icon: <PiVanBold size={16} /> },
  { key: "unique-stay", label: "Unique Stays", icon: <Tent size={16} /> },
  { key: "activity", label: "Activities", icon: <GiBinoculars size={16} /> },
];

// Categories + features for unique-stay & activity tabs are now CMS-driven
// via useOfferingCatalog() (see hooks/useOfferingCatalog.ts). Camper-van
// uses the onboarding step components' own hardcoded taxonomy directly.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Wizard step definitions for the edit page. No "Type" step because the
// service type is fixed at create time and can't be changed via edit. Mirrors
// the AddOfferings wizard so vendors get the same flow on both surfaces.
const STEPS = [
  { key: "category", label: "Category", short: "Category" },
  { key: "basics", label: "Basics & Photos", short: "Basics" },
  { key: "features", label: "Features", short: "Features" },
  { key: "location", label: "Location & Capacity", short: "Location" },
  { key: "pricing", label: "Pricing & Discounts", short: "Pricing" },
  { key: "review", label: "Review & Save", short: "Review" },
] as const;

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const EditOfferings = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("camper-van");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setUploading] = useState(false);
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
    seatingCapacity: "1",
    sleepingCapacity: "0",
    perKmCharge: "",
    perDayCharge: "",
    perKmIncludes: [] as string[],
    perKmExcludes: [] as string[],
    perDayIncludes: [] as string[],
    perDayExcludes: [] as string[],
    stayType: "entire",
    guestCapacity: 1,
    numberOfRooms: 0,
    numberOfBeds: 0,
    numberOfBathrooms: 0,
    rooms: [] as any[],
    entireStayRules: [] as string[],
    optionalRules: [] as string[],
    activityName: "",
    timeDuration: "",
    personCapacity: 1,
    expectations: [] as string[],
    priceDetails: [] as any[],
    regularPrice: "",
    priceIncludes: [] as string[],
    priceExcludes: [] as string[],
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

  const [coverUrl, setCoverUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const offerQuery = useQuery({
    queryKey: ["offer", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await offersApi.get(id!);
      return res.data as OfferDTO;
    },
  });

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
      seatingCapacity: String(o.seatingCapacity || "1"),
      sleepingCapacity: String(o.sleepingCapacity || "0"),
      perKmCharge: String(o.perKmCharge || ""),
      perDayCharge: String(o.perDayCharge || ""),
      perKmIncludes: o.perKmIncludes || [],
      perKmExcludes: o.perKmExcludes || [],
      perDayIncludes: o.perDayIncludes || [],
      perDayExcludes: o.perDayExcludes || [],
      stayType: o.stayType || "entire",
      guestCapacity: Number(o.guestCapacity || 1),
      numberOfRooms: Number(o.numberOfRooms || 0),
      numberOfBeds: Number(o.numberOfBeds || 0),
      numberOfBathrooms: Number(o.numberOfBathrooms || 0),
      rooms: [],
      entireStayRules: [],
      optionalRules: [],
      timeDuration: o.timeDuration || "",
      personCapacity: Number(o.personCapacity || 1),
      expectations: o.expectations || [],
      priceDetails: [],
      regularPrice: String(o.regularPrice || ""),
      priceIncludes: o.priceIncludes?.length ? o.priceIncludes : [],
      priceExcludes: o.priceExcludes?.length ? o.priceExcludes : [],
      // Seed discount slots from the persisted sub-doc (server-side
      // schema: Offer.discounts). Falls back to "off + percentage" defaults
      // when an offer has never had its discounts saved.
      firstUserDiscount: o.discounts?.firstUser?.enabled ?? false,
      firstUserDiscountType: o.discounts?.firstUser?.type ?? "percentage",
      firstUserDiscountValue: o.discounts?.firstUser?.value ?? "",
      firstUserDiscountFinalPrice: o.discounts?.firstUser?.finalPrice ?? "",
      festivalOffers: o.discounts?.festival?.enabled ?? false,
      festivalOffersType: o.discounts?.festival?.type ?? "percentage",
      festivalOffersValue: o.discounts?.festival?.value ?? "",
      festivalOffersFinalPrice: o.discounts?.festival?.finalPrice ?? "",
      weeklyMonthlyOffers: o.discounts?.weekly?.enabled ?? false,
      weeklyMonthlyOffersType: o.discounts?.weekly?.type ?? "percentage",
      weeklyMonthlyOffersValue: o.discounts?.weekly?.value ?? "",
      weeklyMonthlyOffersFinalPrice: o.discounts?.weekly?.finalPrice ?? "",
      specialOffers: o.discounts?.special?.enabled ?? false,
      specialOffersType: o.discounts?.special?.type ?? "percentage",
      specialOffersValue: o.discounts?.special?.value ?? "",
      specialOffersFinalPrice: o.discounts?.special?.finalPrice ?? "",
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

  const locationData = useCountriesData();
  const mapQuery =
    `${formData.address || ""} ${formData.city || ""} ${formData.state || ""} ${formData.pincode || ""} India`.trim();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

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

      const sharedPriceFields =
        activeTab === "camper-van"
          ? {}
          : {
              regularPrice: Number(formData.regularPrice || 0),
              priceIncludes: formData.priceIncludes.filter(Boolean),
              priceExcludes: formData.priceExcludes.filter(Boolean),
            };

      // Discount sub-doc — UI was already wired (see DiscountOffersStep);
      // now we actually persist it on save so vendors don't lose their config
      // on every edit. Only the four canonical slots are written, matching
      // the schema on Offer.discounts.
      const discounts = {
        firstUser: {
          enabled: !!formData.firstUserDiscount,
          type: formData.firstUserDiscountType as "percentage" | "fixed",
          value: formData.firstUserDiscountValue || "",
          finalPrice: formData.firstUserDiscountFinalPrice || "",
        },
        festival: {
          enabled: !!formData.festivalOffers,
          type: formData.festivalOffersType as "percentage" | "fixed",
          value: formData.festivalOffersValue || "",
          finalPrice: formData.festivalOffersFinalPrice || "",
        },
        weekly: {
          enabled: !!formData.weeklyMonthlyOffers,
          type: formData.weeklyMonthlyOffersType as "percentage" | "fixed",
          value: formData.weeklyMonthlyOffersValue || "",
          finalPrice: formData.weeklyMonthlyOffersFinalPrice || "",
        },
        special: {
          enabled: !!formData.specialOffers,
          type: formData.specialOffersType as "percentage" | "fixed",
          value: formData.specialOffersValue || "",
          finalPrice: formData.specialOffersFinalPrice || "",
        },
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
        discounts,
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

  const catalog = useOfferingCatalog();
  const baseCategories = catalog.categories[activeTab] || [];
  const baseFeatures = catalog.features[activeTab] || [];

  // Defensive merge: if the offering being edited has a category or features
  // saved with a name that's NOT in the current CMS list (e.g. legacy taxonomy
  // like "Villa" / "WiFi" that pre-dates the CMS-driven flow), keep those
  // names visible in the dropdown / pill grid so re-saving doesn't blank
  // them out. New CMS-listed values take precedence; legacy ones get
  // appended after.
  const categories = useMemo(() => {
    if (!formData.category) return baseCategories;
    if (baseCategories.includes(formData.category)) return baseCategories;
    return [...baseCategories, formData.category];
  }, [baseCategories, formData.category]);

  const features = useMemo(() => {
    const set = new Set(baseFeatures);
    const extras = (formData.features || []).filter((f) => f && !set.has(f));
    return extras.length ? [...baseFeatures, ...extras] : baseFeatures;
  }, [baseFeatures, formData.features]);

  const arrayHelpers = { handleArrayChange, addArrayItem, removeArrayItem };

  // ─── Per-step validation (gates the wizard's Continue button) ─────────
  const stepCanAdvance = useMemo(() => {
    const name = activeTab === "activity" ? formData.activityName : formData.name;
    switch (step) {
      case 0: // Category
        return !!formData.category;
      case 1: // Basics + photos
        return (
          !!name?.trim() && !!formData.description?.trim() && !!coverUrl && galleryUrls.length >= 5
        );
      case 2: // Features — optional
        return true;
      case 3: // Location & capacity
        return !!formData.state && !!formData.city;
      case 4: // Pricing
        if (activeTab === "camper-van") {
          return !!formData.perKmCharge || !!formData.perDayCharge;
        }
        if (activeTab === "activity") {
          return !!formData.regularPrice && !!formData.timeDuration;
        }
        return !!formData.regularPrice;
      case 5: // Review
        return true;
      default:
        return true;
    }
  }, [step, activeTab, formData, coverUrl, galleryUrls]);

  const isLastStep = step === STEPS.length - 1;
  const onNext = () => {
    if (isLastStep) handleSubmit();
    else setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const onPrev = () => setStep((s) => Math.max(0, s - 1));

  const currentTab = TABS.find((t) => t.key === activeTab);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 size={32} className="animate-spin text-teal-400" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      title="Edit Offering"
      contentClassName="flex-1 overflow-y-auto p-4 lg:p-6 pb-24"
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-5 pb-20">
        {/* ── Header: title + locked type badge + close ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  backgroundColor: `${TEAL}14`,
                  border: `1.5px solid ${TEAL}30`,
                  color: TEAL,
                }}
              >
                {currentTab?.icon}
                {currentTab?.label}
              </span>
            </div>
            <h1
              style={{
                fontSize: "clamp(22px, 3.4vw, 28px)",
                fontWeight: 800,
                color: BLACK,
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              Edit Offering
            </h1>
            <p style={{ fontSize: 13.5, color: GRAY_500, marginTop: 4 }}>
              {STEPS[step].label} · Step {step + 1} of {STEPS.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/offering/${id}`)}
            aria-label="Close"
            style={{
              width: 36,
              height: 36,
              borderRadius: 99,
              backgroundColor: "#F7F8FA",
              border: `1.5px solid ${GRAY_200}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={16} color={GRAY_500} />
          </button>
        </div>

        {/* ── Progress chips ── */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={s.key}>
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: `1.5px solid ${active ? TEAL : done ? `${TEAL}50` : GRAY_200}`,
                    backgroundColor: active ? `${TEAL}14` : done ? `${TEAL}08` : "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    color: active ? TEAL : done ? TEAL : GRAY_400,
                    cursor: i < step ? "pointer" : "default",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: active ? TEAL : done ? TEAL : GRAY_200,
                      color: active || done ? "#fff" : GRAY_400,
                      fontSize: 9.5,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {done ? <Check size={10} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.short}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      flex: 1,
                      height: 2,
                      borderRadius: 99,
                      backgroundColor: done ? TEAL : GRAY_200,
                      minWidth: 8,
                      opacity: 0.6,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Step content card ── */}
        <div
          style={{
            backgroundColor: "#fff",
            border: `1.5px solid ${GRAY_200}`,
            borderRadius: 20,
            padding: "24px 22px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            minHeight: 360,
          }}
        >
          {/* STEP 0 — Category */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: GRAY_400,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {currentTab?.label}
                </p>
                <h2
                  className="font-serif"
                  style={{ fontSize: 22, fontWeight: 600, color: BLACK, marginTop: 4 }}
                >
                  {activeTab === "activity" ? "Activity type" : "Category"}
                </h2>
                <p style={{ fontSize: 13, color: GRAY_500, marginTop: 4 }}>
                  Pick the type that best describes this offering.
                </p>
              </div>
              {activeTab === "camper-van" ? (
                <CaravanCategoryStep
                  embedded
                  category={formData.category || null}
                  onSelect={(name) => set("category", name)}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(categories.length > 0 ? categories : ["Loading…"]).map((c) => {
                    const active = formData.category === c;
                    const disabled = c === "Loading…";
                    return (
                      <button
                        key={c}
                        type="button"
                        disabled={disabled}
                        onClick={() => set("category", c)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 13,
                          border: `1.5px solid ${active ? TEAL : GRAY_200}`,
                          backgroundColor: active ? `${TEAL}08` : "#fff",
                          color: active ? TEAL : disabled ? GRAY_400 : BLACK,
                          fontSize: 13,
                          fontWeight: active ? 700 : 500,
                          cursor: disabled ? "not-allowed" : "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                          boxShadow: active ? `0 0 0 3px ${TEAL}1a` : "none",
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 1 — Basics + Photos */}
          {step === 1 && (
            <CaravanDescriptionStep
              embedded
              nameLabel={
                activeTab === "activity"
                  ? "Activity Name"
                  : activeTab === "unique-stay"
                    ? "Property Name"
                    : "Caravan Name"
              }
              namePlaceholder={
                activeTab === "activity"
                  ? "e.g. River Rafting Day Trip"
                  : activeTab === "unique-stay"
                    ? "e.g. Sunset Villa"
                    : "e.g. Cozy Mountain Camper"
              }
              name={activeTab === "activity" ? formData.activityName : formData.name}
              description={formData.description}
              rules={formData.rules}
              photos={galleryUrls}
              coverImage={coverUrl ? [coverUrl] : []}
              errors={{ ...errors, coverImage: errors.cover, photos: errors.gallery }}
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
          )}

          {/* STEP 2 — Features */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: GRAY_400,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {currentTab?.label}
                </p>
                <h2
                  className="font-serif"
                  style={{ fontSize: 22, fontWeight: 600, color: BLACK, marginTop: 4 }}
                >
                  What does it include?
                </h2>
                <p style={{ fontSize: 13, color: GRAY_500, marginTop: 4 }}>
                  Tick everything that applies.
                </p>
              </div>
              {features.length === 0 ? (
                <p style={{ fontSize: 13, color: GRAY_400 }}>Loading features…</p>
              ) : (
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
              )}
              {formData.features.length > 0 && (
                <p style={{ fontSize: 11.5, color: GRAY_400, marginTop: 4 }}>
                  <Sparkles size={11} className="inline" /> {formData.features.length} feature
                  {formData.features.length === 1 ? "" : "s"} selected
                </p>
              )}
            </div>
          )}

          {/* STEP 3 — Location & Capacity */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              {activeTab === "camper-van" ? (
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
                  onStateChange={(v) => setFormData((p) => ({ ...p, state: v, city: "" }))}
                  onCityChange={(v) => set("city", v)}
                  onPincodeChange={(v) => set("pincode", v.replace(/\D/g, ""))}
                  clearError={clearError}
                />
              ) : (
                <>
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: GRAY_400,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {currentTab?.label}
                    </p>
                    <h2
                      className="font-serif"
                      style={{ fontSize: 22, fontWeight: 600, color: BLACK, marginTop: 4 }}
                    >
                      Where is it located?
                    </h2>
                  </div>
                  <Field label="Street Address">
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
                        onChange={(v) => setFormData((p) => ({ ...p, state: v, city: "" }))}
                        options={stateOptions}
                        placeholder="Select State"
                        searchPlaceholder="Search states…"
                        error={!!errors.state}
                      />
                    </Field>
                    <Field label="City" required error={errors.city}>
                      <SearchableSelect
                        value={formData.city}
                        onChange={(v) => set("city", v)}
                        options={cityOptions}
                        placeholder={formData.state ? "Select City" : "Pick a state first"}
                        searchPlaceholder="Search cities…"
                        disabled={!formData.state}
                        error={!!errors.city}
                      />
                    </Field>
                  </div>
                  <Field label="Pincode">
                    <StyledInput
                      value={formData.pincode}
                      onChange={(v) => set("pincode", v.replace(/\D/g, ""))}
                      placeholder="6-digit code"
                      maxLength={6}
                    />
                  </Field>
                </>
              )}
            </div>
          )}

          {/* STEP 4 — Pricing + Discount */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: GRAY_400,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {currentTab?.label}
                </p>
                <h2
                  className="font-serif"
                  style={{ fontSize: 22, fontWeight: 600, color: BLACK, marginTop: 4 }}
                >
                  Pricing & discounts
                </h2>
                <p style={{ fontSize: 13, color: GRAY_500, marginTop: 4 }}>
                  Discounts are optional — toggle any to enable.
                </p>
              </div>

              <SectionCard
                icon={<Tag size={16} color={TEAL} strokeWidth={2.5} />}
                title="Pricing"
                subtitle="What you'll charge"
              >
                {activeTab === "camper-van" && (
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
                  <ActivityPricing
                    formData={formData}
                    set={set}
                    errors={errors}
                    {...arrayHelpers}
                  />
                )}
              </SectionCard>

              <SectionCard
                icon={<Sparkles size={16} color={TEAL} strokeWidth={2.5} />}
                title="Discounts"
                subtitle="Optional — toggle any offer to enable"
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
            </div>
          )}

          {/* STEP 5 — Review */}
          {step === 5 && (
            <div className="flex flex-col gap-4">
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: GRAY_400,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Final check
                </p>
                <h2
                  className="font-serif"
                  style={{ fontSize: 22, fontWeight: 600, color: BLACK, marginTop: 4 }}
                >
                  Review changes
                </h2>
                <p style={{ fontSize: 13, color: GRAY_500, marginTop: 4 }}>
                  Confirm the details below, then save.
                </p>
              </div>

              {[
                {
                  label: "Category",
                  jumpTo: 0,
                  rows: [["Category", formData.category || "—"]] as [string, string][],
                },
                {
                  label: "Basics",
                  jumpTo: 1,
                  rows: [
                    ["Name", activeTab === "activity" ? formData.activityName : formData.name],
                    [
                      "Description",
                      (formData.description || "").slice(0, 120) +
                        (formData.description.length > 120 ? "…" : ""),
                    ],
                    ["Cover photo", coverUrl ? "✓ Set" : "Missing"],
                    ["Gallery", `${galleryUrls.length} photos`],
                  ] as [string, string][],
                },
                {
                  label: "Features",
                  jumpTo: 2,
                  rows: [
                    [
                      "Selected",
                      formData.features.length > 0 ? formData.features.join(", ") : "None",
                    ],
                  ] as [string, string][],
                },
                {
                  label: "Location & Capacity",
                  jumpTo: 3,
                  rows: [
                    [
                      "Where",
                      [formData.address, formData.city, formData.state, formData.pincode]
                        .filter(Boolean)
                        .join(", ") || "—",
                    ],
                    ...(activeTab === "camper-van"
                      ? ([
                          [
                            "Capacity",
                            `${formData.seatingCapacity} seating · ${formData.sleepingCapacity} sleeping`,
                          ],
                        ] as [string, string][])
                      : activeTab === "unique-stay"
                        ? ([["Guests", String(formData.guestCapacity)]] as [string, string][])
                        : ([
                            ["Persons", String(formData.personCapacity)],
                            ["Duration", formData.timeDuration || "—"],
                          ] as [string, string][])),
                  ] as [string, string][],
                },
                {
                  label: "Pricing",
                  jumpTo: 4,
                  rows: (() => {
                    if (activeTab === "camper-van") {
                      return [
                        ["Per Km", formData.perKmCharge ? `₹${formData.perKmCharge}` : "—"],
                        ["Per Day", formData.perDayCharge ? `₹${formData.perDayCharge}` : "—"],
                      ] as [string, string][];
                    }
                    return [
                      ["Regular price", formData.regularPrice ? `₹${formData.regularPrice}` : "—"],
                    ] as [string, string][];
                  })(),
                },
              ].map((section) => (
                <div
                  key={section.label}
                  style={{
                    border: `1.5px solid ${GRAY_200}`,
                    borderRadius: 14,
                    padding: "14px 16px",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: GRAY_400,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {section.label}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(section.jumpTo)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: TEAL,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {section.rows.map(([k, v]) => (
                      <div key={k} className="flex gap-3" style={{ fontSize: 13 }}>
                        <span
                          style={{
                            color: GRAY_400,
                            minWidth: 110,
                            flexShrink: 0,
                          }}
                        >
                          {k}
                        </span>
                        <span style={{ color: BLACK, fontWeight: 500 }}>{v || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {errors.submit && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    backgroundColor: ERROR_BG,
                    border: "1.5px solid #fca5a5",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" />
                    <path
                      d="M6 3.5v3M6 8.25v.25"
                      stroke={ERROR}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p style={{ fontSize: 13, fontWeight: 600, color: ERROR }}>{errors.submit}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer / nav ── */}
        <div
          className="flex items-center justify-between gap-3"
          style={{ position: "sticky", bottom: 0, padding: "12px 0" }}
        >
          <button
            type="button"
            onClick={step === 0 ? () => navigate(`/offering/${id}`) : onPrev}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 44,
              padding: "0 18px",
              borderRadius: 13,
              border: `1.5px solid ${GRAY_200}`,
              backgroundColor: "#fff",
              fontSize: 13,
              fontWeight: 700,
              color: GRAY_500,
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={16} /> {step === 0 ? "Cancel" : "Back"}
          </button>

          <p style={{ fontSize: 12, color: GRAY_400, fontWeight: 600 }}>
            Step {step + 1} of {STEPS.length}
          </p>

          <button
            type="button"
            onClick={onNext}
            disabled={!stepCanAdvance || isSubmitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 44,
              padding: "0 24px",
              borderRadius: 13,
              border: "none",
              backgroundColor: TEAL,
              fontSize: 13.5,
              fontWeight: 800,
              color: "#fff",
              cursor: !stepCanAdvance || isSubmitting ? "not-allowed" : "pointer",
              opacity: !stepCanAdvance || isSubmitting ? 0.5 : 1,
              boxShadow: "0 4px 16px rgba(15, 92, 138, 0.30)",
              transition: "all 0.15s",
            }}
          >
            {isLastStep ? (
              isSubmitting ? (
                "Saving…"
              ) : (
                <>
                  <Check size={16} strokeWidth={3} /> Save Changes
                </>
              )
            ) : (
              <>
                Continue <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditOfferings;
