import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, MapPin, Tag, Tent, Percent, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { offersApi, OfferDTO } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCountriesData } from "@/hooks/useCountriesData";
import { useOfferingCatalog } from "@/hooks/useOfferingCatalog";
import { PiVanBold } from "react-icons/pi";
import { GiBinoculars } from "react-icons/gi";
import { cn } from "@/lib/utils";
import {
  SectionCard,
  Field,
  StyledInput,
  StyledSelect,
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
          !!name?.trim() &&
          !!formData.description?.trim() &&
          !!coverUrl &&
          galleryUrls.length >= 5
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
    <DashboardLayout title="Edit Offering" contentClassName="flex-1 overflow-y-auto p-4 lg:p-6 pb-24">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* ── Page header ── */}
        <div className="text-center space-y-2 pt-2">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-6 h-[3px] rounded-full bg-th-brand" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-th-warm-text-muted">
              Edit Listing
            </span>
            <div className="w-6 h-[3px] rounded-full bg-th-brand" />
          </div>
          <h1
            className="font-extrabold text-th-text-primary tracking-[-0.03em] leading-[1.15]"
            style={{ fontSize: "clamp(22px, 3.5vw, 30px)" }}
          >
            Edit Offering
          </h1>
          <p className="text-[14px] text-th-warm-text-dark leading-[1.6]">
            Update details for your service offering.
          </p>
        </div>

        {/* ── Offering-type badge (read-only) ── */}
        {(() => {
          const tab = TABS.find((t) => t.key === activeTab);
          if (!tab) return null;
          return (
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-2 rounded-full bg-th-brand-soft border border-th-brand-border-soft text-th-brand text-[12.5px] font-bold tracking-[0.01em]">
              {tab.icon}
              {tab.label}
            </div>
          );
        })()}

        {activeTab === "camper-van" ? (
          <>
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
            {/* ── Category ── */}
            <SectionCard
              icon={<Tag size={16} className="text-th-brand" strokeWidth={2.5} />}
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
                  placeholder={catalog.isLoading ? "Loading…" : "Select"}
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

            {/* ── Description + Photos ── */}
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
              icon={<Tag size={16} className="text-th-brand" strokeWidth={2.5} />}
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
              icon={<MapPin size={16} className="text-th-brand" strokeWidth={2.5} />}
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
              icon={<IndianRupee size={16} className="text-th-brand" strokeWidth={2.5} />}
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
          icon={<Percent size={16} className="text-th-brand" strokeWidth={2.5} />}
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
          <div className="flex items-center gap-2 px-4 py-3 rounded-[13px] bg-th-error-bright-bg border border-th-error-bright-soft">
            <p className="text-[13px] font-semibold text-th-error-bright">{errors.submit}</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex justify-end gap-3 pt-2 pb-6">
          <button
            type="button"
            onClick={() => navigate(`/offering/${id}`)}
            className="h-11 px-6 rounded-[13px] border border-th-warm-border bg-transparent text-[14px] font-semibold text-th-warm-text-dark cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              "h-11 px-7 rounded-[13px] border-none bg-th-brand text-[14px] font-bold text-th-text-inverse shadow-[0_4px_20px_rgba(15,92,138,0.30)]",
              isSubmitting ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditOfferings;
