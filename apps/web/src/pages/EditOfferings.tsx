import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Images,
  IndianRupee,
  ListChecks,
  Lock,
  MapPin,
  ClipboardCheck,
  Sparkles,
  Tag,
  Tent,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
  BRAND_VARS,
  CONTROL,
  CONTROL_ERROR,
  Field,
  PANEL,
  Panel,
  PanelHead,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { offersApi, OfferDTO } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCountriesData } from "@/hooks/useCountriesData";
import { useOfferingCatalog } from "@/hooks/useOfferingCatalog";
import { PiVanBold } from "react-icons/pi";
import { GiBinoculars } from "react-icons/gi";
import { DiscountOffersStep } from "@/components/onboarding/shared";
import type { DiscountOffer } from "@/components/onboarding/shared";
import { SearchableSelect } from "@/components/onboarding/shared/primitives";
import {
  CamperVanPricing,
  UniqueStayPricing,
  ActivityPricing,
  ChoiceTile,
  FeatureChip,
  ReviewSection,
  SubPanel,
  WizardError,
  WizardFooter,
  WizardRail,
  type WizardStep,
} from "@/components/offering";
import {
  DescriptionStep as CaravanDescriptionStep,
  CategoryStep as CaravanCategoryStep,
  CapacityAddressStep as CaravanCapacityAddressStep,
  PricingStep as CaravanPricingStep,
} from "@/components/onboarding/caravan";

// ─── Constants ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "camper-van", label: "Camper Van", icon: <PiVanBold size={16} /> },
  { key: "unique-stay", label: "Unique Stays", icon: <Tent size={16} /> },
  { key: "activity", label: "Activities", icon: <GiBinoculars size={16} /> },
];

// Categories for all three tabs are CMS-driven via useOfferingCatalog() (see
// hooks/useOfferingCatalog.ts) — camper-van vehicle types included, rendered by
// CaravanCategoryStep from the raw CMS rows. Camper-van *features* still come
// from the onboarding step component's own hardcoded list.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Wizard step definitions for the edit page. No "Type" step because the
// service type is fixed at create time and can't be changed via edit. Mirrors
// the AddOfferings wizard so vendors get the same flow on both surfaces.
const STEPS: WizardStep[] = [
  {
    key: "category",
    label: "Category",
    short: "Category",
    icon: Tag,
    title: "Category",
    blurb: "Pick the type that best describes this listing.",
  },
  {
    key: "basics",
    label: "Basics & photos",
    short: "Basics",
    icon: Images,
    title: "Basics and photos",
    blurb: "The name, description and photos guests see first.",
  },
  {
    key: "features",
    label: "Features",
    short: "Features",
    icon: ListChecks,
    title: "What does it include?",
    blurb: "Tick everything that applies — guests use these as filters.",
  },
  {
    key: "location",
    label: "Location & capacity",
    short: "Location",
    icon: MapPin,
    title: "Where is it, and how many fit?",
    blurb: "Guests see the city and state before they book.",
  },
  {
    key: "pricing",
    label: "Pricing & discounts",
    short: "Pricing",
    icon: IndianRupee,
    title: "Pricing and discounts",
    blurb: "Discounts are optional — toggle any to enable.",
  },
  {
    key: "review",
    label: "Review & save",
    short: "Review",
    icon: ClipboardCheck,
    title: "Review changes",
    blurb: "Confirm the details below, then save.",
  },
];

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

  // Only the selected country's states/cities are fetched (see useCountriesData).
  const locationData = useCountriesData(formData.locality || "India");
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
  const stepMeta = STEPS[step];
  const StepIcon = stepMeta.icon;
  const stepTitle = step === 0 && activeTab === "activity" ? "Activity type" : stepMeta.title;

  const listingName = activeTab === "activity" ? formData.activityName : formData.name;

  const reviewSections: { label: string; jumpTo: number; rows: [string, string | undefined][] }[] =
    [
      { label: "Category", jumpTo: 0, rows: [["Category", formData.category || "—"]] },
      {
        label: "Basics",
        jumpTo: 1,
        rows: [
          ["Name", listingName],
          [
            "Description",
            (formData.description || "").slice(0, 120) +
              (formData.description.length > 120 ? "…" : ""),
          ],
          ["Cover photo", coverUrl ? "Set" : "Missing"],
          ["Gallery", `${galleryUrls.length} photos`],
        ],
      },
      {
        label: "Features",
        jumpTo: 2,
        rows: [["Selected", formData.features.length > 0 ? formData.features.join(", ") : "None"]],
      },
      {
        label: "Location & capacity",
        jumpTo: 3,
        rows: [
          [
            "Where",
            [formData.address, formData.city, formData.state, formData.pincode]
              .filter(Boolean)
              .join(", ") || "—",
          ],
          ...((activeTab === "camper-van"
            ? [
                [
                  "Capacity",
                  `${formData.seatingCapacity} seating · ${formData.sleepingCapacity} sleeping`,
                ],
              ]
            : activeTab === "unique-stay"
              ? [["Guests", String(formData.guestCapacity)]]
              : [
                  ["Persons", String(formData.personCapacity)],
                  ["Duration", formData.timeDuration || "—"],
                ]) as [string, string][]),
        ],
      },
      {
        label: "Pricing",
        jumpTo: 4,
        rows:
          activeTab === "camper-van"
            ? [
                ["Per km", formData.perKmCharge ? `₹${formData.perKmCharge}` : "—"],
                ["Per day", formData.perDayCharge ? `₹${formData.perDayCharge}` : "—"],
              ]
            : [["Regular price", formData.regularPrice ? `₹${formData.regularPrice}` : "—"]],
      },
    ];

  /** Keeps the console chrome up while the offer loads, instead of a bare spinner page. */
  if (loading) {
    return (
      <DashboardLayout
        title="Edit Offering"
      >
        <div style={BRAND_VARS} className="max-w-6xl mx-auto pb-24 lg:pb-12">
          <div className="grid gap-5 lg:gap-7 lg:grid-cols-[254px_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className={cn(PANEL, "h-[132px] animate-pulse")} />
              <div className={cn(PANEL, "hidden lg:block h-[280px] animate-pulse")} />
            </div>
            <div className={cn(PANEL, "min-h-[420px] p-5 space-y-4")}>
              <div className="h-4 w-40 rounded bg-muted animate-pulse" />
              <div className="h-3 w-64 rounded bg-muted/70 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-[42px] rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      title="Edit Offering"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto pb-24 lg:pb-12">
        <div className="grid gap-5 lg:gap-7 lg:grid-cols-[254px_minmax(0,1fr)]">
          <WizardRail
            steps={STEPS}
            current={step}
            onJump={setStep}
            title={listingName || "Edit listing"}
            subtitle={currentTab?.label}
            exitLabel="Leave without saving"
            onExit={() => navigate(`/offering/${id}`)}
            pillId="editOfferingStepPill"
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0"
            >
              <Panel>
                <PanelHead
                  icon={StepIcon}
                  title={stepTitle}
                  blurb={stepMeta.blurb}
                  aside={
                    /* The service type is fixed at create time — say so rather
                       than letting a vendor hunt for a type switcher. */
                    <span className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-muted text-[11.5px] font-semibold text-muted-foreground">
                      <Lock size={11} strokeWidth={2.4} />
                      {currentTab?.label}
                    </span>
                  }
                />

                <div className="p-5">
                  {/* ============ STEP 0 — Category =============== */}
                  {step === 0 &&
                    (activeTab === "camper-van" ? (
                      <CaravanCategoryStep
                        embedded
                        category={formData.category || null}
                        dynamicCategories={catalog.camperVanCategories}
                        categoriesLoading={catalog.camperVanCategoriesLoading}
                        onSelect={(name) => set("category", name)}
                      />
                    ) : categories.length === 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-[42px] rounded-xl bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {categories.map((c) => (
                          <ChoiceTile
                            key={c}
                            label={c}
                            selected={formData.category === c}
                            onClick={() => set("category", c)}
                          />
                        ))}
                      </div>
                    ))}

                  {/* ============ STEP 1 — Basics + photos =============== */}
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
                      name={listingName}
                      description={formData.description}
                      rules={formData.rules}
                      photos={galleryUrls}
                      coverImage={coverUrl ? [coverUrl] : []}
                      errors={{ ...errors, coverImage: errors.cover, photos: errors.gallery }}
                      onNameChange={(v) =>
                        set(activeTab === "activity" ? "activityName" : "name", v)
                      }
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

                  {/* ============ STEP 2 — Features =============== */}
                  {step === 2 && (
                    <div className="space-y-4">
                      {features.length === 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="h-9 w-24 rounded-full bg-muted animate-pulse" />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
                          {features.map((f) => (
                            <FeatureChip
                              key={f}
                              label={f}
                              selected={formData.features.includes(f)}
                              onClick={() => toggleFeature(f)}
                            />
                          ))}
                        </div>
                      )}
                      {formData.features.length > 0 && (
                        <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-brand">
                          <Sparkles size={12} strokeWidth={2.3} />
                          {formData.features.length} feature
                          {formData.features.length === 1 ? "" : "s"} selected
                        </p>
                      )}
                    </div>
                  )}

                  {/* ============ STEP 3 — Location & capacity =============== */}
                  {step === 3 &&
                    (activeTab === "camper-van" ? (
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
                      <div className="space-y-4">
                        <Field label="Street address" htmlFor="edit-address">
                          <Input
                            id="edit-address"
                            value={formData.address}
                            onChange={(e) => set("address", e.target.value)}
                            placeholder="Street address"
                            className={cn("h-11", CONTROL)}
                          />
                        </Field>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="State" error={errors.state}>
                            <SearchableSelect
                              value={formData.state}
                              onChange={(v) => setFormData((p) => ({ ...p, state: v, city: "" }))}
                              options={stateOptions}
                              placeholder="Select state"
                              searchPlaceholder="Search states…"
                              error={!!errors.state}
                            />
                          </Field>
                          <Field label="City" error={errors.city}>
                            <SearchableSelect
                              value={formData.city}
                              onChange={(v) => set("city", v)}
                              options={cityOptions}
                              placeholder={formData.state ? "Select city" : "Pick a state first"}
                              searchPlaceholder="Search cities…"
                              disabled={!formData.state}
                              error={!!errors.city}
                            />
                          </Field>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Pincode" htmlFor="edit-pincode">
                            <Input
                              id="edit-pincode"
                              value={formData.pincode}
                              onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
                              placeholder="6-digit code"
                              maxLength={6}
                              inputMode="numeric"
                              className={cn("h-11", CONTROL)}
                            />
                          </Field>

                          {/* Parity with /offering/add — these were loaded and
                              saved but had no input on the edit page. */}
                          {activeTab === "unique-stay" && (
                            <Field label="Guest capacity" htmlFor="edit-guests">
                              <Input
                                id="edit-guests"
                                type="number"
                                min={1}
                                value={String(formData.guestCapacity)}
                                onChange={(e) => set("guestCapacity", Number(e.target.value) || 1)}
                                placeholder="1"
                                className={cn("h-11", CONTROL)}
                              />
                            </Field>
                          )}

                          {activeTab === "activity" && (
                            <Field label="Persons (max)" htmlFor="edit-persons">
                              <Input
                                id="edit-persons"
                                type="number"
                                min={1}
                                value={String(formData.personCapacity)}
                                onChange={(e) => set("personCapacity", Number(e.target.value) || 1)}
                                placeholder="1"
                                className={cn("h-11", CONTROL)}
                              />
                            </Field>
                          )}
                        </div>

                        {activeTab === "activity" && (
                          <Field
                            label="Duration"
                            htmlFor="edit-duration"
                            error={errors.timeDuration}
                          >
                            <Input
                              id="edit-duration"
                              value={formData.timeDuration}
                              onChange={(e) => set("timeDuration", e.target.value)}
                              placeholder="e.g. 2 Hours"
                              aria-invalid={!!errors.timeDuration}
                              className={cn("h-11", CONTROL, errors.timeDuration && CONTROL_ERROR)}
                            />
                          </Field>
                        )}
                      </div>
                    ))}

                  {/* ============ STEP 4 — Pricing + discounts =============== */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <SubPanel icon={Tag} title="Pricing" blurb="What you'll charge">
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
                      </SubPanel>

                      <SubPanel
                        icon={Sparkles}
                        title="Discounts"
                        blurb="Optional — toggle any offer to enable it"
                      >
                        <DiscountOffersStep
                          embedded
                          offers={discountOffers}
                          onToggle={handleDiscountToggle}
                          onOfferChange={handleDiscountOfferChange}
                          errors={errors}
                          weeklyLabel="Weekly / Monthly Offers"
                        />
                      </SubPanel>
                    </div>
                  )}

                  {/* ============ STEP 5 — Review =============== */}
                  {step === 5 && (
                    <div className="space-y-3">
                      {reviewSections.map((section) => (
                        <ReviewSection
                          key={section.label}
                          label={section.label}
                          rows={section.rows}
                          onEdit={() => setStep(section.jumpTo)}
                        />
                      ))}

                      {errors.submit && <WizardError message={errors.submit} />}
                    </div>
                  )}
                </div>

                <WizardFooter
                  step={step}
                  total={STEPS.length}
                  canAdvance={stepCanAdvance}
                  busy={isSubmitting}
                  isLastStep={isLastStep}
                  onBack={step === 0 ? () => navigate(`/offering/${id}`) : onPrev}
                  onNext={onNext}
                  backLabel={step === 0 ? "Cancel" : "Back"}
                  submitLabel="Save changes"
                  busyLabel="Saving…"
                />
              </Panel>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditOfferings;
