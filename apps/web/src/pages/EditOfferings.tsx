import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BedDouble,
  Clock,
  Car,
  Images,
  IndianRupee,
  ListChecks,
  Lock,
  MapPin,
  ClipboardCheck,
  Plus,
  Sparkles,
  Tag,
  Tent,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
  BRAND_VARS,
  BTN_ICON_SM,
  BTN_NEUTRAL,
  BTN_RAW,
  BTN_SM,
  CONTROL,
  CONTROL_ERROR,
  Field,
  PANEL,
  Panel,
  PanelHead,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { offersApi, OfferDTO, OfferRoom } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCountriesData } from "@/hooks/useCountriesData";
import { countryByName } from "@/data/countries";
import { useOfferingCatalog } from "@/hooks/useOfferingCatalog";
import { PiVanBold } from "react-icons/pi";
import { GiBinoculars } from "react-icons/gi";
import { STAY_AMENITY_NAMES } from "@/components/onboarding/stays/stayConfig";
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
  RoomsEditor,
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
import {
  VehicleClassStep,
  SpecsFeaturesStep,
  VehicleCapacityStep,
  VehiclePricingStep,
} from "@/components/onboarding/vehicle";
import type { VehicleListField } from "@/components/onboarding/vehicle/VehiclePricingStep";
import type {
  FuelPolicy,
  FuelType,
  TollsPolicy,
  Transmission,
  VehicleClass,
} from "@/components/onboarding/vehicle/vehicleConfig";
import {
  FUEL_POLICIES,
  TOLLS_POLICIES,
} from "@/components/onboarding/vehicle/vehicleConfig";

// ─── Constants ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "camper-van", label: "Camper Van", icon: <PiVanBold size={16} /> },
  { key: "unique-stay", label: "Unique Stays", icon: <Tent size={16} /> },
  { key: "activity", label: "Activities", icon: <GiBinoculars size={16} /> },
  // Vehicle rentals reach this page from the same Edit button as everything
  // else. Without an entry here they fell through to camper-van, which relabelled
  // the listing, offered per-km/per-day caravan pricing for a rate card the
  // vehicle doesn't have, and — because the payload sent `serviceType: activeTab`
  // — rewrote the saved serviceType to "camper-van" on the first save, dropping
  // the listing out of vehicle search entirely.
  { key: "vehicle-rental", label: "Vehicle Rental", icon: <Car size={16} /> },
];

/** Service types this wizard knows how to edit, matched on the stored value. */
const KNOWN_SERVICE_TYPES = TABS.map((t) => t.key);

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

/**
 * `0` means "not set" for every optional numeric on a listing, and the server
 * stores an unanswered rate as 0 rather than leaving it out. Rendering that as
 * the string "0" in a rate-card field reads as a real price of zero.
 */
const numField = (v: number | string | undefined | null) =>
  v === undefined || v === null || Number(v) === 0 ? "" : String(v);

/** The inverse: an empty rate field stays absent rather than becoming 0. */
const numOrUndefined = (v: string) => {
  const cleaned = String(v ?? "").replace(/[^0-9.]/g, "");
  const n = Number(cleaned);
  return cleaned === "" || !Number.isFinite(n) ? undefined : n;
};

/**
 * Rooms as the editor expects them.
 *
 * `Offer.rooms` is a Mixed array, so it holds whatever shape the wizard of the
 * day sent — including legacy documents that used `capacity` / `bedCount`
 * instead of `guestCapacity` / `beds`. loadStayDraft normalises the same two
 * names on the onboarding side; without this the counters here would show 1 for
 * a room that sleeps 4.
 */
const normalizeRooms = (rooms: any): OfferRoom[] =>
  (Array.isArray(rooms) ? rooms : []).map((r: any, i: number) => ({
    id: String(r?.id ?? i + 1),
    name: r?.name ?? "",
    description: r?.description ?? "",
    guestCapacity: Number(r?.guestCapacity ?? r?.capacity ?? 1) || 1,
    beds: Number(r?.beds ?? r?.bedCount ?? 1) || 1,
    bathrooms: Number(r?.bathrooms ?? 0) || 0,
    price: Number(r?.price ?? 0) || 0,
    photos: Array.isArray(r?.photos) ? r.photos.filter(Boolean) : [],
  }));

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
    rooms: [] as OfferRoom[],
    optionalRules: [] as string[],
    activityName: "",
    timeDuration: "",
    personCapacity: 1,
    expectations: [] as string[],
    priceDetails: [] as any[],
    // ─── Vehicle rental ──────────────────────────────────────────────────
    vehicleClass: null as VehicleClass | null,
    brand: "",
    model: "",
    manufactureYear: "",
    registrationNumber: "",
    fuelType: "" as FuelType | "",
    transmission: "" as Transmission | "",
    airConditioned: false,
    luggageCapacity: 0,
    pickupPoints: [] as string[],
    selfDriveEnabled: false,
    selfDrivePerDay: "",
    selfDrivePerKm: "",
    freeKmPerDay: "",
    extraKmCharge: "",
    securityDeposit: "",
    minRentalHours: "",
    selfDriveIncludes: [] as string[],
    selfDriveExcludes: [] as string[],
    withDriverEnabled: false,
    withDriverPerKm: "",
    withDriverPerDay: "",
    driverAllowancePerDay: "",
    nightChargeAfter: "",
    outstationPerKm: "",
    withDriverOneWay: true,
    withDriverTwoWay: false,
    withDriverIncludes: [] as string[],
    withDriverExcludes: [] as string[],
    fuelPolicy: "" as FuelPolicy | "",
    tollsAndParking: "" as TollsPolicy | "",
    cancellationWindowHours: "",
    /* Stay arrival/departure, 24-hour "HH:mm" — the shape the Offer stores and
       `<input type="time">` emits. */
    checkInTime: "",
    checkOutTime: "",
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
  /**
   * The serviceType exactly as stored.
   *
   * The save payload used to send `serviceType: activeTab`, so any listing whose
   * type this wizard couldn't represent was silently converted to whatever tab
   * it had fallen back to. The stored value is the source of truth; the tab only
   * decides which fields to render.
   */
  const [serviceType, setServiceType] = useState("camper-van");
  /** How many rooms the listing had on load — see the note where it's set. */
  const loadedRoomCountRef = useRef(0);

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

    /* Trust the stored serviceType first. The old order looked at the category
       too, and since onboarding wrote the *service type* into `category`
       ("stay", "activity") those two agreed by accident — while a vehicle
       listing, whose category is a real name like "SUV", matched neither branch
       and landed on camper-van. */
    const st = (o.serviceType || "").toLowerCase();
    const cat = (o.category || "").toLowerCase();
    let tab = KNOWN_SERVICE_TYPES.includes(st) ? st : "";
    if (!tab) {
      if (cat.includes("stay")) tab = "unique-stay";
      else if (cat.includes("activity")) tab = "activity";
      else tab = "camper-van";
    }
    setActiveTab(tab);
    setServiceType(o.serviceType || tab);

    /* Whether the listing arrived WITH rooms decides whether an empty editor
       means "the vendor removed them" or "there was never anything here" —
       `rooms` is a Mixed array, so a document in some other shape normalises to
       [] and must not be written back as a deliberate deletion. */
    const loadedRooms = normalizeRooms(o.rooms);
    loadedRoomCountRef.current = loadedRooms.length;

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
      /* Was `rooms: []` / `optionalRules: []` / `priceDetails: []` — three
         fields the server persists and the vendor filled in during onboarding,
         thrown away on load. An individual-room stay opened with no rooms at
         all, so its real capacity and per-room prices were invisible here. */
      rooms: loadedRooms,
      optionalRules: o.optionalRules || [],
      timeDuration: o.timeDuration || "",
      personCapacity: Number(o.personCapacity || 1),
      expectations: o.expectations || [],
      priceDetails: o.priceDetails || [],
      // ─── Vehicle rental ──────────────────────────────────────────────────
      vehicleClass: (o.vehicleClass as VehicleClass) || null,
      brand: o.brand || "",
      model: o.model || "",
      manufactureYear: o.manufactureYear ? String(o.manufactureYear) : "",
      registrationNumber: o.registrationNumber || "",
      fuelType: (o.fuelType as FuelType) || "",
      transmission: (o.transmission as Transmission) || "",
      airConditioned: !!o.airConditioned,
      luggageCapacity: Number(o.luggageCapacity || 0),
      pickupPoints: o.pickupPoints || [],
      selfDriveEnabled: !!o.selfDriveEnabled,
      selfDrivePerDay: numField(o.selfDrivePerDay),
      selfDrivePerKm: numField(o.selfDrivePerKm),
      freeKmPerDay: numField(o.freeKmPerDay),
      extraKmCharge: numField(o.extraKmCharge),
      securityDeposit: numField(o.securityDeposit),
      minRentalHours: numField(o.minRentalHours),
      selfDriveIncludes: o.selfDriveIncludes || [],
      selfDriveExcludes: o.selfDriveExcludes || [],
      withDriverEnabled: !!o.withDriverEnabled,
      withDriverPerKm: numField(o.withDriverPerKm),
      withDriverPerDay: numField(o.withDriverPerDay),
      driverAllowancePerDay: numField(o.driverAllowancePerDay),
      nightChargeAfter: numField(o.nightChargeAfter),
      outstationPerKm: numField(o.outstationPerKm),
      // Exactly one direction is offered; default to one-way for rows saved
      // before the pair existed, matching the onboarding wizard.
      withDriverOneWay: o.withDriverTwoWay === true ? false : true,
      withDriverTwoWay: o.withDriverTwoWay === true,
      withDriverIncludes: o.withDriverIncludes || [],
      withDriverExcludes: o.withDriverExcludes || [],
      fuelPolicy: (o.fuelPolicy as FuelPolicy) || "",
      tollsAndParking: (o.tollsAndParking as TollsPolicy) || "",
      cancellationWindowHours: numField(o.cancellationWindowHours),
      checkInTime: o.checkInTime || "",
      checkOutTime: o.checkOutTime || "",
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

  // Case-insensitive on the way out too — untick "WiFi" and a "wifi" saved by
  // an older flow has to go with it, or the chip springs straight back.
  const toggleFeature = (f: string) =>
    setFormData((p) => {
      const key = f.toLowerCase();
      const has = p.features.some((x) => x.toLowerCase() === key);
      return {
        ...p,
        features: has ? p.features.filter((x) => x.toLowerCase() !== key) : [...p.features, f],
      };
    });

  /**
   * `locality` holds a COUNTRY name in this wizard (it's the field
   * /offering/add writes its country picker to). A listing whose locality holds
   * an actual locality — a neighbourhood, which is what the word means
   * everywhere else — matched no country, so `states` came back empty and the
   * State and City pickers rendered as blank required fields over values the
   * listing already had. Fall back to India for the lookup and leave the stored
   * locality alone.
   */
  const locationCountryName = useMemo(
    () => (countryByName(formData.locality) ? formData.locality : "India"),
    [formData.locality],
  );
  // Only the selected country's states/cities are fetched (see useCountriesData).
  const locationData = useCountriesData(locationCountryName);
  const mapQuery =
    `${formData.address || ""} ${formData.city || ""} ${formData.state || ""} ${formData.pincode || ""} India`.trim();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  const locationCountry = useMemo(
    () => locationData.find((c: any) => c.name === locationCountryName),
    [locationData, locationCountryName],
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
      features: p.features.some((f) => f.toLowerCase() === name.toLowerCase())
        ? p.features
        : [...p.features, name],
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

  /**
   * Vehicle capacity counters. Seating is stored as a string (the caravan step
   * that field was built for uses strings), luggage as a number — hence two
   * cases rather than one indexed write.
   */
  const adjustVehicleCapacity = (type: "seating" | "luggage", direction: "increase" | "decrease") =>
    setFormData((p) => {
      const step = direction === "increase" ? 1 : -1;
      if (type === "seating") {
        const next = Math.min(60, Math.max(1, (Number(p.seatingCapacity) || 1) + step));
        return { ...p, seatingCapacity: String(next) };
      }
      const next = Math.min(20, Math.max(0, (Number(p.luggageCapacity) || 0) + step));
      return { ...p, luggageCapacity: next };
    });

  /** One pickup point, stored as the array the Offer schema declares. */
  const setPickupPoint = (value: string) =>
    setFormData((p) => ({ ...p, pickupPoints: value.trim() ? [value] : [] }));

  const toggleRentalMode = (mode: "selfDrive" | "withDriver") =>
    setFormData((p) => ({
      ...p,
      ...(mode === "selfDrive"
        ? { selfDriveEnabled: !p.selfDriveEnabled }
        : { withDriverEnabled: !p.withDriverEnabled }),
    }));

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

  /** Uploads several files and resolves to the URLs that made it. */
  const uploadFiles = async (files: FileList | null): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        try {
          urls.push(await uploadFileToServer(file));
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    } finally {
      setUploading(false);
    }
    return urls;
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
    } else if (activeTab === "vehicle-rental") {
      // Same required set as the vehicle onboarding wizard, minus the compliance
      // dates: those are renewed through /api/offers/:id/compliance, which is
      // the one edit that must not send a listing back through admin review.
      if (!formData.vehicleClass) e.vehicleClass = "Vehicle class is required";
      if (!formData.brand.trim()) e.brand = "Brand is required";
      if (!formData.model.trim()) e.model = "Model is required";
      if (!formData.registrationNumber.trim())
        e.registrationNumber = "Registration number is required";
      if (!formData.selfDriveEnabled && !formData.withDriverEnabled)
        e.selfDriveEnabled = "Enable at least one rental mode";
      if (formData.selfDriveEnabled && !formData.selfDrivePerDay)
        e.selfDrivePerDay = "Self-drive day rate is required";
      if (formData.withDriverEnabled && !formData.withDriverPerKm)
        e.withDriverPerKm = "Chauffeur per-km rate is required";
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
        const rooms = formData.rooms.map((r, i) => ({
          ...r,
          id: String(r.id || i + 1),
          guestCapacity: Number(r.guestCapacity) || 1,
          beds: Number(r.beds) || 1,
          bathrooms: Number(r.bathrooms) || 0,
          price: Number(r.price) || 0,
        }));
        specificData = {
          guestCapacity: Number(formData.guestCapacity),
          numberOfRooms: Number(formData.numberOfRooms),
          numberOfBeds: Number(formData.numberOfBeds),
          numberOfBathrooms: Number(formData.numberOfBathrooms),
          stayType: formData.stayType,
          // Sent only when set, so an older listing that never had them is not
          // written with two empty strings.
          ...(formData.checkInTime ? { checkInTime: formData.checkInTime } : {}),
          ...(formData.checkOutTime ? { checkOutTime: formData.checkOutTime } : {}),
          // The per-room breakdown, which used to be loaded as [] and never
          // sent — so the wizard could neither show it nor change it. Omitted
          // entirely when there was nothing to edit and nothing was added, so
          // an unrelated save can't write an empty array over stored rooms.
          ...(rooms.length || loadedRoomCountRef.current ? { rooms } : {}),
          priceDetails: formData.priceDetails,
        };
      } else if (activeTab === "activity") {
        specificData = {
          personCapacity: Number(formData.personCapacity),
          timeDuration: formData.timeDuration,
          expectations: formData.expectations.filter(Boolean),
        };
      } else if (activeTab === "vehicle-rental") {
        specificData = {
          vehicleClass: formData.vehicleClass || undefined,
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          manufactureYear: formData.manufactureYear ? Number(formData.manufactureYear) : undefined,
          registrationNumber: formData.registrationNumber.trim().toUpperCase(),
          fuelType: formData.fuelType || undefined,
          transmission: formData.transmission || undefined,
          airConditioned: !!formData.airConditioned,
          seatingCapacity: Number(formData.seatingCapacity),
          luggageCapacity: Number(formData.luggageCapacity),
          pickupPoints: formData.pickupPoints.filter(Boolean),

          selfDriveEnabled: !!formData.selfDriveEnabled,
          selfDrivePerDay: numOrUndefined(formData.selfDrivePerDay),
          selfDrivePerKm: numOrUndefined(formData.selfDrivePerKm),
          freeKmPerDay: numOrUndefined(formData.freeKmPerDay),
          extraKmCharge: numOrUndefined(formData.extraKmCharge),
          securityDeposit: numOrUndefined(formData.securityDeposit),
          minRentalHours: numOrUndefined(formData.minRentalHours),
          selfDriveIncludes: formData.selfDriveIncludes.filter(Boolean),
          selfDriveExcludes: formData.selfDriveExcludes.filter(Boolean),

          withDriverEnabled: !!formData.withDriverEnabled,
          withDriverPerKm: numOrUndefined(formData.withDriverPerKm),
          withDriverPerDay: numOrUndefined(formData.withDriverPerDay),
          driverAllowancePerDay: numOrUndefined(formData.driverAllowancePerDay),
          nightChargeAfter: numOrUndefined(formData.nightChargeAfter),
          outstationPerKm: numOrUndefined(formData.outstationPerKm),
          withDriverOneWay: !!formData.withDriverOneWay,
          withDriverTwoWay: !!formData.withDriverTwoWay,
          withDriverIncludes: formData.withDriverIncludes.filter(Boolean),
          withDriverExcludes: formData.withDriverExcludes.filter(Boolean),

          cancellationWindowHours: numOrUndefined(formData.cancellationWindowHours),
          fuelPolicy: formData.fuelPolicy || undefined,
          tollsAndParking: formData.tollsAndParking || undefined,
        };
      }

      /* Vehicle rentals join camper-van in not having a single price field: the
         headline `regularPrice` is derived from whichever rate card is enabled
         (same rule as the onboarding sync) and priceIncludes/Excludes mirror
         that mode's lists. Sending the shared price fields would blank both. */
      const sharedPriceFields =
        activeTab === "camper-van"
          ? {}
          : activeTab === "vehicle-rental"
            ? {
                regularPrice:
                  numOrUndefined(formData.selfDriveEnabled ? formData.selfDrivePerDay : "") ??
                  numOrUndefined(formData.withDriverEnabled ? formData.withDriverPerKm : "") ??
                  Number(formData.regularPrice || 0),
                priceIncludes: formData.selfDriveEnabled
                  ? formData.selfDriveIncludes.filter(Boolean)
                  : formData.withDriverIncludes.filter(Boolean),
                priceExcludes: formData.selfDriveEnabled
                  ? formData.selfDriveExcludes.filter(Boolean)
                  : formData.withDriverExcludes.filter(Boolean),
              }
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
        optionalRules: formData.optionalRules.filter(Boolean),
        features: formData.features,
        address: formData.address,
        locality: formData.locality,
        pincode: formData.pincode,
        city: formData.city,
        state: formData.state,
        ...sharedPriceFields,
        photos: { coverUrl, galleryUrls },
        /* NOT `activeTab`. The tab is a rendering choice that falls back when a
           service type isn't represented here, and sending it converted those
           listings to the fallback type the first time a vendor saved. */
        serviceType,
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
  // Same unique-stay fallback as AddOfferings: an unseeded CMS otherwise leaves
  // the Features step empty, and the two wizards must offer the same list.
  const cmsFeatures = catalog.features[activeTab] || [];
  const baseFeatures =
    cmsFeatures.length || activeTab !== "unique-stay" ? cmsFeatures : STAY_AMENITY_NAMES;

  /**
   * The saved category, spelled the way the CMS spells it.
   *
   * Selection was an exact string compare, and the stored value routinely
   * differs from the CMS row only in case or padding — onboarding wrote
   * "villas" from a selection chip while the category row reads "Villas". The
   * grid then highlighted nothing, so a listing that HAS a category presented
   * as an unanswered required step. Matching case-insensitively and adopting the
   * CMS spelling also stops the same category existing under two names once the
   * vendor saves.
   */
  const canonicalCategory = useMemo(() => {
    const saved = (formData.category || "").trim();
    if (!saved) return "";
    const match = baseCategories.find((c) => c.toLowerCase() === saved.toLowerCase());
    return match ?? saved;
  }, [baseCategories, formData.category]);

  // Adopt the canonical spelling so the payload carries it too, not just the
  // highlight. Runs once per listing — after that the two agree.
  useEffect(() => {
    if (canonicalCategory && canonicalCategory !== formData.category) {
      setFormData((p) => ({ ...p, category: canonicalCategory }));
    }
  }, [canonicalCategory, formData.category]);

  // Defensive merge: if the offering being edited has a category or features
  // saved with a name that's NOT in the current CMS list (e.g. legacy taxonomy
  // like "Villa" / "WiFi" that pre-dates the CMS-driven flow), keep those
  // names visible in the dropdown / pill grid so re-saving doesn't blank
  // them out.
  const categories = useMemo(() => {
    if (!canonicalCategory) return baseCategories;
    if (baseCategories.includes(canonicalCategory)) return baseCategories;
    /* FIRST, not appended. A category the CMS no longer lists went to the end of
       a 40-tile grid, below the fold — indistinguishable from nothing being
       selected, which is the whole complaint. */
    return [canonicalCategory, ...baseCategories];
  }, [baseCategories, canonicalCategory]);

  const features = useMemo(() => {
    const set = new Set(baseFeatures.map((f) => f.toLowerCase()));
    const extras = (formData.features || []).filter((f) => f && !set.has(f.toLowerCase()));
    return extras.length ? [...baseFeatures, ...extras] : baseFeatures;
  }, [baseFeatures, formData.features]);

  /**
   * Feature chips are also compared case-insensitively, for the same reason as
   * the category above: "wifi" saved against a "WiFi" CMS row left the chip
   * looking untouched, and toggling it then stored the name twice.
   */
  const selectedFeatureKeys = useMemo(
    () => new Set((formData.features || []).map((f) => f.toLowerCase())),
    [formData.features],
  );

  const arrayHelpers = { handleArrayChange, addArrayItem, removeArrayItem };

  // ─── Per-step validation (gates the wizard's Continue button) ─────────
  const stepCanAdvance = useMemo(() => {
    const name = activeTab === "activity" ? formData.activityName : formData.name;
    switch (step) {
      case 0: // Category
        if (activeTab === "vehicle-rental") {
          // The vehicle step collects identity alongside the category.
          return (
            !!formData.category &&
            !!formData.vehicleClass &&
            !!formData.brand.trim() &&
            !!formData.model.trim() &&
            !!formData.registrationNumber.trim()
          );
        }
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
        if (activeTab === "vehicle-rental") {
          if (!formData.selfDriveEnabled && !formData.withDriverEnabled) return false;
          if (formData.selfDriveEnabled && !formData.selfDrivePerDay) return false;
          if (formData.withDriverEnabled && !formData.withDriverPerKm) return false;
          return true;
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
  // Step 0 asks a different question per service type: a category for stays,
  // an activity type, or a vehicle plus the identity that goes with it.
  const STEP_0_TITLE: Record<string, string> = {
    activity: "Activity type",
    "vehicle-rental": "Vehicle type and identity",
  };
  const stepTitle = (step === 0 && STEP_0_TITLE[activeTab]) || stepMeta.title;

  const listingName = activeTab === "activity" ? formData.activityName : formData.name;

  const reviewSections: { label: string; jumpTo: number; rows: [string, string | undefined][] }[] =
    [
      {
        label: "Category",
        jumpTo: 0,
        rows: [
          ["Category", formData.category || "—"],
          ...((activeTab === "vehicle-rental"
            ? [
                ["Class", formData.vehicleClass || "—"],
                [
                  "Vehicle",
                  [formData.brand, formData.model, formData.manufactureYear]
                    .filter(Boolean)
                    .join(" ") || "—",
                ],
                ["Registration", formData.registrationNumber || "—"],
              ]
            : []) as [string, string][]),
        ],
      },
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
              ? [
                  ["Guests", String(formData.guestCapacity)],
                  [
                    "Layout",
                    `${formData.numberOfRooms} rooms · ${formData.numberOfBeds} beds · ` +
                      `${formData.numberOfBathrooms} bathrooms`,
                  ],
                  [
                    "Rooms listed",
                    formData.rooms.length
                      ? `${formData.rooms.length} (${formData.stayType === "individual" ? "priced per room" : "whole property"})`
                      : "None",
                  ],
                ]
              : activeTab === "vehicle-rental"
                ? [
                    [
                      "Capacity",
                      `${formData.seatingCapacity} seats · ${formData.luggageCapacity} bags`,
                    ],
                    [
                      "Specs",
                      [formData.fuelType, formData.transmission].filter(Boolean).join(" · ") || "—",
                    ],
                    ["Pickup", formData.pickupPoints.filter(Boolean).join(", ") || "—"],
                  ]
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
            : activeTab === "vehicle-rental"
              ? [
                  [
                    "Self-drive",
                    formData.selfDriveEnabled
                      ? `₹${formData.selfDrivePerDay || 0} / day`
                      : "Not offered",
                  ],
                  [
                    "With driver",
                    formData.withDriverEnabled
                      ? `₹${formData.withDriverPerKm || 0} / km`
                      : "Not offered",
                  ],
                ]
              : [["Regular price", formData.regularPrice ? `₹${formData.regularPrice}` : "—"]],
      },
    ];

  /** Keeps the console chrome up while the offer loads, instead of a bare spinner page. */
  if (loading) {
    return (
      <DashboardLayout title="Edit Offering">
        <div style={BRAND_VARS} className="max-w-6xl mx-auto">
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
    <DashboardLayout title="Edit Offering">
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto">
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
                    ) : activeTab === "vehicle-rental" ? (
                      /* Class, category and identity together — the same step the
                         vehicle onboarding wizard uses, so the two surfaces ask
                         for the vehicle in one shape. */
                      <VehicleClassStep
                        embedded
                        vehicleClass={formData.vehicleClass}
                        category={formData.category || null}
                        brand={formData.brand}
                        model={formData.model}
                        manufactureYear={formData.manufactureYear}
                        registrationNumber={formData.registrationNumber}
                        dynamicCategories={catalog.vehicleCategories}
                        categoriesLoading={catalog.vehicleCategoriesLoading}
                        errors={errors}
                        onVehicleClassChange={(v) => set("vehicleClass", v)}
                        onCategoryChange={(v) => set("category", v)}
                        onBrandChange={(v) => set("brand", v)}
                        onModelChange={(v) => set("model", v)}
                        onManufactureYearChange={(v) => set("manufactureYear", v)}
                        onRegistrationNumberChange={(v) => set("registrationNumber", v)}
                        clearError={clearError}
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
                    <div className="space-y-4">
                      <CaravanDescriptionStep
                        embedded
                        nameLabel={
                          activeTab === "activity"
                            ? "Activity Name"
                            : activeTab === "unique-stay"
                              ? "Property Name"
                              : activeTab === "vehicle-rental"
                                ? "Vehicle Name"
                                : "Caravan Name"
                        }
                        namePlaceholder={
                          activeTab === "activity"
                            ? "e.g. River Rafting Day Trip"
                            : activeTab === "unique-stay"
                              ? "e.g. Sunset Villa"
                              : activeTab === "vehicle-rental"
                                ? "e.g. Toyota Innova Crysta"
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
                        onRemovePhoto={(i) =>
                          setGalleryUrls((p) => p.filter((_, idx) => idx !== i))
                        }
                        onRemoveCover={() => setCoverUrl("")}
                        clearError={clearError}
                      />

                      {/* Optional rules were saved by stay onboarding and had no
                        home on this page, so a vendor opening Edit saw the
                        house rules but not the optional ones — and saving wrote
                        an empty list back over them. */}
                      {activeTab === "unique-stay" && (
                        <SubPanel
                          icon={ListChecks}
                          title="Optional rules"
                          blurb="Shown to guests separately from the house rules above"
                        >
                          <div className="space-y-2.5">
                            {formData.optionalRules.length === 0 && (
                              <p className="text-[12.5px] text-muted-foreground">
                                None set for this listing.
                              </p>
                            )}
                            {formData.optionalRules.map((rule, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Input
                                  value={rule}
                                  onChange={(e) =>
                                    handleArrayChange("optionalRules", index, e.target.value)
                                  }
                                  placeholder="e.g. Quiet hours after 10pm"
                                  className={cn("h-11", CONTROL)}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem("optionalRules", index)}
                                  aria-label={`Remove optional rule ${index + 1}`}
                                  className={cn(
                                    BTN_RAW,
                                    BTN_ICON_SM,
                                    "shrink-0 rounded-lg text-muted-foreground",
                                    "hover:bg-muted hover:text-destructive transition-colors duration-150",
                                  )}
                                >
                                  <Trash2 size={14} strokeWidth={2.1} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addArrayItem("optionalRules")}
                              className={cn(BTN_RAW, BTN_NEUTRAL, BTN_SM, "gap-1.5")}
                            >
                              <Plus size={13} strokeWidth={2.4} aria-hidden />
                              Add optional rule
                            </button>
                          </div>
                        </SubPanel>
                      )}
                    </div>
                  )}

                  {/* ============ STEP 2 — Features =============== */}
                  {/* Fuel, transmission and AC are structured fields the guest
                      search filters on, so a vehicle gets the onboarding step
                      that collects them rather than the plain chip grid. */}
                  {step === 2 && activeTab === "vehicle-rental" && (
                    <SpecsFeaturesStep
                      embedded
                      fuelType={formData.fuelType}
                      transmission={formData.transmission}
                      airConditioned={formData.airConditioned}
                      features={formData.features}
                      dynamicFeatures={catalog.vehicleFeatures}
                      featuresLoading={catalog.vehicleFeaturesLoading}
                      customFeatures={customFeatures}
                      showCustomFeaturesInput={showCustomFeaturesInput}
                      customFeatureInput={customFeatureInput}
                      errors={errors}
                      onFuelTypeChange={(v) => set("fuelType", v)}
                      onTransmissionChange={(v) => set("transmission", v)}
                      onAirConditionedChange={(v) => set("airConditioned", v)}
                      onToggleFeature={toggleFeature}
                      onRemoveCustomFeature={handleRemoveCustomFeature}
                      onToggleCustomInput={() =>
                        setShowCustomFeaturesInput(!showCustomFeaturesInput)
                      }
                      onCustomFeatureInputChange={setCustomFeatureInput}
                      onAddCustomFeature={handleAddCustomFeature}
                      clearError={clearError}
                    />
                  )}

                  {step === 2 && activeTab !== "vehicle-rental" && (
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
                              selected={selectedFeatureKeys.has(f.toLowerCase())}
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
                        locality={locationCountryName}
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
                        {activeTab === "vehicle-rental" && (
                          <VehicleCapacityStep
                            embedded
                            vehicleClass={formData.vehicleClass}
                            seatingCapacity={Number(formData.seatingCapacity) || 1}
                            luggageCapacity={Number(formData.luggageCapacity) || 0}
                            pickupPoints={formData.pickupPoints}
                            errors={errors}
                            onAdjustCapacity={adjustVehicleCapacity}
                            onPickupPointChange={setPickupPoint}
                            clearError={clearError}
                          />
                        )}

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

                        {/* Rooms + the counts they roll up to. A stay saved as
                            "individual" keeps its real capacity and price per
                            room; this page used to load none of it. */}
                        {activeTab === "unique-stay" && (
                          <>
                            <SubPanel
                              icon={BedDouble}
                              title="Property totals"
                              blurb="What guests see summarised on the listing card"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Rooms" htmlFor="edit-rooms">
                                  <Input
                                    id="edit-rooms"
                                    type="number"
                                    min={0}
                                    value={String(formData.numberOfRooms)}
                                    onChange={(e) =>
                                      set("numberOfRooms", Number(e.target.value) || 0)
                                    }
                                    className={cn("h-11", CONTROL)}
                                  />
                                </Field>
                                <Field label="Beds" htmlFor="edit-beds">
                                  <Input
                                    id="edit-beds"
                                    type="number"
                                    min={0}
                                    value={String(formData.numberOfBeds)}
                                    onChange={(e) =>
                                      set("numberOfBeds", Number(e.target.value) || 0)
                                    }
                                    className={cn("h-11", CONTROL)}
                                  />
                                </Field>
                                <Field label="Bathrooms" htmlFor="edit-baths">
                                  <Input
                                    id="edit-baths"
                                    type="number"
                                    min={0}
                                    value={String(formData.numberOfBathrooms)}
                                    onChange={(e) =>
                                      set("numberOfBathrooms", Number(e.target.value) || 0)
                                    }
                                    className={cn("h-11", CONTROL)}
                                  />
                                </Field>
                              </div>
                            </SubPanel>

                            <SubPanel
                              icon={Clock}
                              title="Check-in & check-out"
                              blurb="Arrival and departure times shown to guests"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Check-in time" htmlFor="edit-check-in">
                                  <Input
                                    id="edit-check-in"
                                    type="time"
                                    value={formData.checkInTime}
                                    onChange={(e) => set("checkInTime", e.target.value)}
                                    className={cn("h-11", CONTROL)}
                                  />
                                </Field>
                                <Field label="Check-out time" htmlFor="edit-check-out">
                                  <Input
                                    id="edit-check-out"
                                    type="time"
                                    value={formData.checkOutTime}
                                    onChange={(e) => set("checkOutTime", e.target.value)}
                                    className={cn("h-11", CONTROL)}
                                  />
                                </Field>
                              </div>
                            </SubPanel>

                            <SubPanel
                              icon={BedDouble}
                              title="Rooms"
                              blurb={
                                formData.stayType === "individual"
                                  ? "Each room is booked and priced on its own"
                                  : "The whole property is booked at once"
                              }
                            >
                              <RoomsEditor
                                rooms={formData.rooms}
                                onChange={(rooms) => set("rooms", rooms)}
                                onUploadPhotos={uploadFiles}
                                perRoomPricing={formData.stayType === "individual"}
                              />
                            </SubPanel>
                          </>
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
                        {activeTab === "vehicle-rental" && (
                          <VehiclePricingStep
                            embedded
                            selfDriveEnabled={formData.selfDriveEnabled}
                            selfDrivePerDay={formData.selfDrivePerDay}
                            selfDrivePerKm={formData.selfDrivePerKm}
                            securityDeposit={formData.securityDeposit}
                            freeKmPerDay={formData.freeKmPerDay}
                            extraKmCharge={formData.extraKmCharge}
                            minRentalHours={formData.minRentalHours}
                            selfDriveIncludes={formData.selfDriveIncludes}
                            selfDriveExcludes={formData.selfDriveExcludes}
                            withDriverEnabled={formData.withDriverEnabled}
                            withDriverPerKm={formData.withDriverPerKm}
                            withDriverPerDay={formData.withDriverPerDay}
                            nightChargeAfter={formData.nightChargeAfter}
                            outstationPerKm={formData.outstationPerKm}
                            driverAllowancePerDay={formData.driverAllowancePerDay}
                            withDriverOneWay={formData.withDriverOneWay}
                            withDriverTwoWay={formData.withDriverTwoWay}
                            onSelectTripDirection={(which) =>
                              setFormData((p) => ({
                                ...p,
                                withDriverOneWay: which === "oneWay",
                                withDriverTwoWay: which === "twoWay",
                              }))
                            }
                            withDriverIncludes={formData.withDriverIncludes}
                            withDriverExcludes={formData.withDriverExcludes}
                            cancellationWindowHours={formData.cancellationWindowHours}
                            fuelPolicy={formData.fuelPolicy}
                            tollsAndParking={formData.tollsAndParking}
                            /* Editing an existing listing, unlike the wizard —
                               see showRunningCostPolicies. */
                            showRunningCostPolicies
                            errors={errors}
                            onToggleMode={toggleRentalMode}
                            onFieldChange={set}
                            onAddListItem={(field) => addArrayItem(field)}
                            onUpdateListItem={(field, i, v) => handleArrayChange(field, i, v)}
                            onRemoveListItem={(field, i) => removeArrayItem(field, i)}
                            clearError={clearError}
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
