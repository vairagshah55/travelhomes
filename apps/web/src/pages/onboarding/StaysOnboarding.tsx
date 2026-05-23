import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { cmsPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { Country } from "country-state-city";
import { submitOnboardingData, getOnboardingData, offersApi } from "@/lib/api";
import { onboardingService } from "@/lib/onboardingService";
import { useCountriesData } from "@/hooks/useCountriesData";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useFeatures } from "@/hooks/useFeatures";
import {
  Bath,
  Flame,
  Fan,
  User,
  Refrigerator,
  Wind,
  Tent,
  Utensils,
  Droplets,
  BedDouble,
  Table,
  Gamepad2,
  Gamepad,
  CupSoda,
  Microwave,
  CookingPot,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  Home,
} from "lucide-react";
import { useUserDetails } from "@/hooks/useUserDetails";

// Shared components
import {
  OnboardingLayout,
  BusinessDetailsStep,
  PersonalDetailsStep,
  TermsConditionsStep,
  DiscountOffersStep,
} from "./components/shared";
import type { CountryOption, DiscountOffer } from "./components/shared";

// Stays-specific step components
import {
  PropertyTypeStep,
  CategorySelectionStep,
  StayDetailsStep,
  FeaturesStep,
  UniqueStayCardPreview,
} from "./components/stays";

const countries: CountryOption[] = Country.getAllCountries().map((c) => ({
  isoCode: c.isoCode,
  name: c.name,
  countryCode: c.isoCode,
  dialCode: c.phonecode,
}));

// All 4 stay discount offers share the same discountPercentage + finalPrice.
// Pick the first enabled one that actually reduces the price.
const STAY_DISCOUNT_SLOTS: { key: string; label: string }[] = [
  { key: "firstUserDiscount", label: "Welcome offer" },
  { key: "festivalOffers", label: "Festival offer" },
  { key: "weeklyOffers", label: "Long stay offer" },
  { key: "specialOffers", label: "Special offer" },
];

function pickStayDiscount(
  regularPrice: string,
  finalPrice: string,
  offers: Record<string, boolean>,
): { originalPrice: number; finalPrice: number; label: string } | null {
  const original = Number(regularPrice);
  const discounted = Number(finalPrice);
  if (!Number.isFinite(original) || original <= 0) return null;
  if (!Number.isFinite(discounted) || discounted <= 0 || discounted >= original) return null;
  for (const slot of STAY_DISCOUNT_SLOTS) {
    if (offers[slot.key]) return { originalPrice: original, finalPrice: discounted, label: slot.label };
  }
  return null;
}

// Property categories based on property types
const propertyCategories: Record<string, { id: string; name: string; icon: string }[]> = {
  villa: [],
  cabin: [
    { id: "rustic", name: "Rustic Cabin", icon: "🏕️" },
    { id: "modern", name: "Modern Cabin", icon: "🏠" },
    { id: "glamping", name: "Glamping Cabin", icon: "✨" },
    { id: "lakefront", name: "Lakefront Cabin", icon: "🏞️" },
  ],
  castle: [
    { id: "medieval", name: "Medieval Castle", icon: "🏰" },
    { id: "contemporary", name: "Contemporary Castle", icon: "🏛️" },
    { id: "boutique", name: "Boutique Castle", icon: "💎" },
  ],
  cave: [
    { id: "natural", name: "Natural Cave", icon: "🕳️" },
    { id: "luxury", name: "Luxury Cave", icon: "💎" },
    { id: "adventure", name: "Adventure Cave", icon: "🧗" },
  ],
  farmhouse: [
    { id: "traditional", name: "Traditional Farmhouse", icon: "🏘️" },
    { id: "modern", name: "Modern Farmhouse", icon: "🏠" },
    { id: "organic", name: "Organic Farmhouse", icon: "🌱" },
  ],
  camping: [
    { id: "tent", name: "Tent Camping", icon: "⛺" },
    { id: "rv", name: "RV Camping", icon: "🚐" },
    { id: "glamping", name: "Glamping Site", icon: "🏕️" },
  ],
  hut: [
    { id: "traditional", name: "Traditional Hut", icon: "🏠" },
    { id: "beach", name: "Beach Hut", icon: "🏖️" },
    { id: "mountain", name: "Mountain Hut", icon: "🏔️" },
  ],
  heritage: [
    { id: "colonial", name: "Colonial Heritage", icon: "🏛️" },
    { id: "palace", name: "Heritage Palace", icon: "🏰" },
    { id: "manor", name: "Heritage Manor", icon: "🏡" },
  ],
  tiny: [
    { id: "modern", name: "Modern Tiny Home", icon: "🏠" },
    { id: "rustic", name: "Rustic Tiny Home", icon: "🏕️" },
    { id: "offgrid", name: "Off-Grid Tiny Home", icon: "🔋" },
  ],
  tent: [
    { id: "safari", name: "Safari Tent", icon: "🦁" },
    { id: "luxury", name: "Luxury Tent", icon: "💎" },
    { id: "adventure", name: "Adventure Tent", icon: "🧗" },
  ],
  village: [
    { id: "traditional", name: "Traditional Village", icon: "🏘️" },
    { id: "cultural", name: "Cultural Village", icon: "🎭" },
    { id: "homestay", name: "Homestay Village", icon: "🏠" },
  ],
  container: [
    { id: "modern", name: "Modern Container", icon: "🏗️" },
    { id: "shipping", name: "Shipping Container", icon: "🚢" },
    { id: "luxury", name: "Luxury Container", icon: "💎" },
  ],
  cruise: [
    { id: "luxury", name: "Luxury Cruise", icon: "🛳️" },
    { id: "adventure", name: "Adventure Cruise", icon: "🗺️" },
    { id: "family", name: "Family Cruise", icon: "👨‍👩‍👧‍👦" },
  ],
};

// Dynamic features based on property types and categories
const getFeaturesForProperty = (propertyType: string, category: string, stayType: string) => {
  const baseFeatures: { label: string; value: string; icon: string | React.ComponentType<any> }[] =
    [];

  // Features for entire stay properties
  if (stayType === "entire") {
    const entireStayFeatures = [
      ...baseFeatures,
      { label: "Garden", value: "garden", icon: "🌳" },
      { label: "Parking", value: "parking", icon: "🚗" },
      { label: "Sports Facilities", value: "sports", icon: Gamepad },
      { label: "Swimming Pool", value: "pool", icon: "🏊" },
      { label: "BBQ Area", value: "bbq", icon: "🍖" },
      { label: "Fireplace", value: "fireplace", icon: Flame },
      { label: "Jacuzzi", value: "jacuzzi", icon: "🛁" },
      { label: "Gym", value: "gym", icon: "💪" },
      { label: "Spa", value: "spa", icon: "💆" },
    ];

    switch (propertyType) {
      case "villa":
        return [
          ...entireStayFeatures,
          { label: "Private Pool", value: "private_pool", icon: "🏊" },
          { label: "Ocean View", value: "ocean_view", icon: "🌊" },
          { label: "Tennis Court", value: "tennis", icon: "🎾" },
        ];
      case "cabin":
        return [
          ...entireStayFeatures,
          { label: "Wood Stove", value: "wood_stove", icon: Flame },
          { label: "Hiking Trails", value: "hiking", icon: "🥾" },
          { label: "Fishing Access", value: "fishing", icon: "🎣" },
        ];
      case "castle":
        return [
          ...entireStayFeatures,
          { label: "Castle Tower", value: "tower", icon: "🏰" },
          { label: "Moat", value: "moat", icon: "🏞️" },
          { label: "Dungeon", value: "dungeon", icon: "🕳️" },
        ];
      case "farmhouse":
        return [
          ...entireStayFeatures,
          { label: "Farm Animals", value: "animals", icon: "🐄" },
          { label: "Organic Garden", value: "organic_garden", icon: "🌱" },
          { label: "Barn", value: "barn", icon: "🏭" },
        ];
      case "heritage":
        return [
          ...entireStayFeatures,
          { label: "Historical Artifacts", value: "artifacts", icon: "🏛️" },
          { label: "Antique Furniture", value: "antiques", icon: "🪑" },
          { label: "Museum Access", value: "museum", icon: "🎨" },
        ];
      default:
        return entireStayFeatures;
    }
  }

  // Features for individual rooms
  else {
    const roomFeatures = [...baseFeatures];

    switch (propertyType) {
      case "tent":
        return [
          ...roomFeatures,
          { label: "Campfire Pit", value: "campfire", icon: Flame },
          { label: "Safari Bed", value: "safari_bed", icon: BedDouble },
          { label: "Mosquito Net", value: "mosquito_net", icon: "🦟" },
        ];
      case "treehouse":
        return [
          ...roomFeatures,
          { label: "Tree Views", value: "tree_views", icon: "🌳" },
          { label: "Rope Bridge", value: "rope_bridge", icon: "🌉" },
          { label: "Bird Watching", value: "birds", icon: "🐦" },
        ];
      case "container":
        return [
          ...roomFeatures,
          { label: "Industrial Design", value: "industrial", icon: "🏗️" },
          { label: "Modern Amenities", value: "modern", icon: "✨" },
          { label: "Eco-Friendly", value: "eco", icon: "🌱" },
        ];
      default:
        return roomFeatures;
    }
  }
};

interface Room {
  id: string;
  name: string;
  description: string;
  photos: string[];
  guestCapacity: number;
  beds: number;
  bathrooms: number;
  price: number;
}

const StaysOnboarding = () => {
  const navigate = useNavigate();
  const { updateUserType, isAuthenticated } = useAuth();

  const { data: homepageSections } = useHomepageSections();
  useEffect(() => {
    if (homepageSections) {
      const section = (homepageSections as any[]).find((s: any) => s.sectionKey === "unique-stays");
      if (section && !section.isVisible) {
        toast.error("Stays onboarding is currently disabled.");
        navigate("/");
      }
    }
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const STEP_STORAGE_KEY = "stay_onboarding_step";
  const FORM_STORAGE_KEY = "stay_onboarding_form";

  // ─── Restore cached form snapshot (sessionStorage) ─────────────────────────
  const _cached = (() => {
    try {
      const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Discard snapshots that contain NaN-sentinel values (corrupted by a
      // previous bug where Number() conversions weren't guarded).
      const numeric = ["guestCapacity", "numberOfRooms", "numberOfBeds", "numberOfBathrooms"];
      const isCorrupted = numeric.some((k) => parsed[k] !== undefined && !isFinite(Number(parsed[k])));
      if (isCorrupted) {
        sessionStorage.removeItem(FORM_STORAGE_KEY);
        sessionStorage.removeItem(STEP_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  })();

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem(STEP_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    sessionStorage.setItem(STEP_STORAGE_KEY, String(currentStep));
  }, [currentStep]);

  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [selectedProperties, setSelectedProperties] = useState<string[]>(
    _cached?.selectedProperties ?? [],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    _cached?.selectedCategories ?? [],
  );
  const [stayType, setStayType] = useState<"entire" | "individual">(_cached?.stayType ?? "entire");

  // Rules and regulations state
  const [entireStayRules, setEntireStayRules] = useState<string[]>(
    _cached?.entireStayRules ?? [""],
  );
  const [roomRules, setRoomRules] = useState<Record<string, string[]>>(_cached?.roomRules ?? {});
  const [optionalRules, setOptionalRules] = useState<string[]>(_cached?.optionalRules ?? [""]);
  // Use Number() + || fallback so NaN from stale sessionStorage is treated as 0,
  // not propagated into counter arithmetic (NaN + 1 = NaN, NaN > 1 = false → stuck).
  const [guestCapacity, setGuestCapacity] = useState(Number(_cached?.guestCapacity) || 0);
  const [numberOfRooms, setNumberOfRooms] = useState(Number(_cached?.numberOfRooms) || 1);
  const [numberOfBeds, setNumberOfBeds] = useState(Number(_cached?.numberOfBeds) || 0);
  const [numberOfBathrooms, setNumberOfBathrooms] = useState(Number(_cached?.numberOfBathrooms) || 0);
  const [regularPrice, setRegularPrice] = useState(_cached?.regularPrice ?? "");
  const [rooms, setRooms] = useState<Room[]>(
    _cached?.rooms ?? [
      {
        id: "1",
        name: "",
        description: "",
        photos: [],
        guestCapacity: 1,
        beds: 1,
        bathrooms: 1,
        price: 5934,
      },
    ],
  );
  const [expandedRoom, setExpandedRoom] = useState<string>("1");

  // Features state
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    _cached?.selectedFeatures ?? [],
  );
  const [customFeatures, setCustomFeatures] = useState<string[]>(_cached?.customFeatures ?? []);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");
  const [adminFeatures, setAdminFeatures] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<{ id: string; name: string; icon: string }[]>(
    [],
  );
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, any[]>>({});

  // Discount state
  const [firstUserDiscount, setFirstUserDiscount] = useState(_cached?.firstUserDiscount ?? true);
  const [discountType, setDiscountType] = useState(_cached?.discountType ?? "percentage");
  const [discountPercentage, setDiscountPercentage] = useState(_cached?.discountPercentage ?? "");
  const [finalPrice, setFinalPrice] = useState(_cached?.finalPrice ?? "");
  const [festivalOffers, setFestivalOffers] = useState(_cached?.festivalOffers ?? false);
  const [weeklyOffers, setWeeklyOffers] = useState(_cached?.weeklyOffers ?? false);
  const [specialOffers, setSpecialOffers] = useState(_cached?.specialOffers ?? false);

  // Business Details state
  const [brandName, setBrandName] = useState(_cached?.brandName ?? "");
  const [companyName, setCompanyName] = useState(_cached?.companyName ?? "");
  const [gstNumber, setGstNumber] = useState(_cached?.gstNumber ?? "");
  const [businessEmail, setBusinessEmail] = useState(_cached?.businessEmail ?? "");
  const [businessPhone, setBusinessPhone] = useState(_cached?.businessPhone ?? "");
  const [businessAddress, setBusinessAddress] = useState(_cached?.businessAddress ?? "");
  const [locality, setLocality] = useState(_cached?.locality ?? "India");
  const [state, setState] = useState(_cached?.state ?? "");
  const [city, setCity] = useState(_cached?.city ?? "");
  const [businessPincode, setBusinessPincode] = useState(_cached?.businessPincode ?? "");
  const [personalPincode, setPersonalPincode] = useState(_cached?.personalPincode ?? "");

  // Personal Details state
  const [firstName, setFirstName] = useState(_cached?.firstName ?? "");
  const [lastName, setLastName] = useState(_cached?.lastName ?? "");
  const [personalCountry, setPersonalCountry] = useState(_cached?.personalCountry ?? "India");
  const [personalState, setPersonalState] = useState(_cached?.personalState ?? "");
  const [personalCity, setPersonalCity] = useState(_cached?.personalCity ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(_cached?.dateOfBirth ?? "");
  const [maritalStatus, setMaritalStatus] = useState(_cached?.maritalStatus ?? "");
  const [idProof, setIdProof] = useState(_cached?.idProof ?? "");
  const [idProofImage, setIdProofImage] = useState<string | null>(_cached?.idProofImage ?? null);
  const [images, setImages] = useState<(string | null)[]>(_cached?.images ?? Array(5).fill(null));
  const [entireStayImages, setEntireStayImages] = useState<string[]>(
    _cached?.entireStayImages ?? [],
  );
  const [coverImage, setCoverImage] = useState<string | null>(_cached?.coverImage ?? null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selected, setSelected] = useState<CountryOption | null>(countries[100]);
  const [open, setOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // ─── Persist form data to sessionStorage ───────────────────────────────────
  useEffect(() => {
    try {
      const snapshot = {
        selectedProperties,
        selectedCategories,
        stayType,
        entireStayRules,
        roomRules,
        optionalRules,
        guestCapacity,
        numberOfRooms,
        numberOfBeds,
        numberOfBathrooms,
        regularPrice,
        rooms,
        selectedFeatures,
        customFeatures,
        firstUserDiscount,
        discountType,
        discountPercentage,
        finalPrice,
        festivalOffers,
        weeklyOffers,
        specialOffers,
        brandName,
        companyName,
        gstNumber,
        businessEmail,
        businessPhone,
        businessAddress,
        locality,
        state,
        city,
        businessPincode,
        personalPincode,
        firstName,
        lastName,
        personalCountry,
        personalState,
        personalCity,
        dateOfBirth,
        maritalStatus,
        idProof,
        idProofImage,
        images: images.filter(Boolean),
        entireStayImages,
        coverImage,
      };
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* quota exceeded — ignore */
    }
  }, [
    selectedProperties,
    selectedCategories,
    stayType,
    entireStayRules,
    roomRules,
    optionalRules,
    guestCapacity,
    numberOfRooms,
    numberOfBeds,
    numberOfBathrooms,
    regularPrice,
    rooms,
    selectedFeatures,
    customFeatures,
    firstUserDiscount,
    discountType,
    discountPercentage,
    finalPrice,
    festivalOffers,
    weeklyOffers,
    specialOffers,
    brandName,
    companyName,
    gstNumber,
    businessEmail,
    businessPhone,
    businessAddress,
    locality,
    state,
    city,
    businessPincode,
    personalPincode,
    firstName,
    lastName,
    personalCountry,
    personalState,
    personalCity,
    dateOfBirth,
    maritalStatus,
    idProof,
    idProofImage,
    images,
    entireStayImages,
    coverImage,
  ]);

  const { userDetails, updateUserDetails } = useUserDetails();
  // Prevent loadExistingData from running more than once.
  // React Query refetches userDetails in the background (window focus, etc.),
  // which re-triggers the effect and overwrites photos/form data the user just filled.
  const hasLoadedRef = useRef(false);

  const totalSteps = 8;
  const completedSteps = currentStep;
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [status, setStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  // True while the initial data check is in-flight so we don't flash the
  // full form before knowing the submission is already pending/approved.
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const [fileName, setFileName] = useState("");
  const data = useCountriesData();
  const [countryOption, setCoutryOption] = useState("India");
  const [countryOption2, setCoutryOption2] = useState("India");
  const [stateOption, setStateOption] = useState(_cached?.personalState ?? "");
  const [stateOption2, setStateOption2] = useState(_cached?.state ?? "");
  const [cityOption, setCityOptions] = useState(_cached?.personalCity ?? "");
  const [cityOption2, setCityOptions2] = useState(_cached?.city ?? "");

  useEffect(() => {
    setState(stateOption2);
  }, [stateOption2]);

  useEffect(() => {
    setCity(cityOption2);
  }, [cityOption2]);

  useEffect(() => {
    setLocality("India");
  }, []);

  useEffect(() => {
    setPersonalState(stateOption);
  }, [stateOption]);

  useEffect(() => {
    setPersonalCity(cityOption);
  }, [cityOption]);

  useEffect(() => {
    setPersonalCountry("India");
  }, []);

  // Top-level Unique Stay features + categories (shared cache).
  const { data: stayFeatures } = useFeatures("Unique Stay");
  const { data: stayCategories } = useFeatures("Unique Stay", "category");

  useEffect(() => {
    if (!stayFeatures) return;
    // Filter for features or items without type (legacy)
    setAdminFeatures(
      stayFeatures.filter((f: any) => f.status === "enable" && (!f.type || f.type === "feature")),
    );
  }, [stayFeatures]);

  useEffect(() => {
    if (!stayCategories) return;
    const types = stayCategories
      .filter((f: any) => f.status === "enable")
      .map((f: any) => ({
        id: f.name.toLowerCase(),
        realId: f.id || f._id,
        name: f.name,
        icon: f.icon,
      }));
    setPropertyTypes(types);

    // Fetch dynamic sub-categories for each property type. Keeping this
    // as an inline N+1 since each subcategory is keyed by a runtime
    // `type.realId`; useQueries() would also work but the cache benefit
    // is small (called once per page mount, dominated by the top two
    // queries above).
    types.forEach((type: any) => {
      if (type.realId) {
        cmsPublicApi
          .getFeatures(type.realId, "subcategory")
          .then((subs) => {
            if (subs && subs.length > 0) {
              setSubCategoriesMap((prev) => ({
                ...prev,
                [type.id]: subs.map((s: any) => ({
                  id: s.name.toLowerCase().replace(/\s+/g, "-"),
                  name: s.name,
                  icon: s.icon,
                })),
              }));
            }
          })
          .catch(() => {});
      }
    });
  }, [stayCategories]);

  // Check for existing data (resubmission flow)
  useEffect(() => {
    // Guard: only run once. Without this, every background React Query refetch of
    // userDetails re-invokes this effect and resets photos + form data the user filled.
    if (hasLoadedRef.current) return;

    const loadExistingData = async () => {
      try {
        const data = await getOnboardingData();

        if (
          data &&
          data.type === "stay" &&
          data.doc &&
          ["pending", "draft", "rejected", "approved"].includes(data.doc.status)
        ) {
          const doc = data.doc;
          hasLoadedRef.current = true;
          setIsStatusLoading(false);

          setStatus(doc.status);
          setRejectionReason(doc.rejectionReason || "");

          setSelectedProperties(doc.selectedProperties || []);
          setSelectedCategories(doc.selectedCategories || []);
          setStayType(doc.stayType || "entire");
          setGuestCapacity(Number(doc.guestCapacity) || 0);
          setNumberOfRooms(Number(doc.numberOfRooms) || 1);
          setNumberOfBeds(Number(doc.numberOfBeds) || 0);
          setNumberOfBathrooms(Number(doc.numberOfBathrooms) || 0);
          setRegularPrice(String(doc.regularPrice || ""));

          if (doc.rooms && doc.rooms.length > 0) {
            // Normalise room field names: the DB schema previously used
            // `capacity` and `bedCount` instead of the frontend's `guestCapacity`
            // and `beds`. Map both to the canonical frontend names so counters
            // and the effectiveGuestCapacity calculation always see real numbers.
            const normalizedRooms = doc.rooms.map((r: any) => ({
              id: r.id || String(Date.now() + Math.random()),
              name: r.name || "",
              description: r.description || "",
              guestCapacity: Number(r.guestCapacity || r.capacity || 1),
              beds: Number(r.beds || r.bedCount || 1),
              bathrooms: Number(r.bathrooms || 1),
              price: Number(r.price || 0),
              photos: r.photos || [],
            }));
            setRooms(normalizedRooms);
            setCoverImage(doc.coverImage || null);
            // Handle images
            if (doc.stayType === "entire") {
              const imgs = doc.images || [];
              setEntireStayImages(imgs);
            } else {
              const imgs = doc.rooms[0]?.photos || [];
              setImages([...imgs, ...Array(Math.max(0, 5 - imgs.length)).fill(null)]);
            }
          }

          setSelectedFeatures(doc.selectedFeatures || []);
          setEntireStayRules(doc.rules && doc.rules.length > 0 ? doc.rules : [""]);
          setRoomRules(doc.roomRules || {});
          setOptionalRules(
            doc.optionalRules && doc.optionalRules.length > 0 ? doc.optionalRules : [""],
          );

          setFirstUserDiscount(doc.firstUserDiscount ?? true);
          setDiscountType(doc.discountType || "percentage");
          setDiscountPercentage(String(doc.discountPercentage || ""));
          setFinalPrice(String(doc.finalPrice || ""));

          setFestivalOffers(doc.festivalOffers ?? false);
          setWeeklyOffers(doc.weeklyOffers ?? false);
          setSpecialOffers(doc.specialOffers ?? false);

          // Business + personal fields are NOT stored on the StayOnboarding
          // doc (Mongoose strict mode drops unknown keys). They live on Profile
          // via syncUserProfile. Fall back to userDetails so resumed drafts
          // aren't empty.
          setBrandName(doc.brandName || userDetails?.business?.brandName || "");
          setCompanyName(doc.companyName || userDetails?.business?.legalCompanyName || "");
          setGstNumber(doc.gstNumber || userDetails?.business?.gstNumber || "");
          setBusinessEmail(doc.businessEmail || userDetails?.business?.email || "");
          setBusinessPhone(doc.businessPhone || userDetails?.business?.phoneNumber || "");
          setBusinessAddress(doc.businessAddress || userDetails?.business?.address || "");
          setLocality(doc.locality || userDetails?.business?.locality || "India");
          setState(doc.state || userDetails?.business?.state || "");
          setStateOption2(doc.state || userDetails?.business?.state || "");
          setCity(doc.city || userDetails?.business?.city || "");
          setCityOptions2(doc.city || userDetails?.business?.city || "");
          setBusinessPincode(doc.businessPincode || doc.pincode || userDetails?.business?.pincode || "");
          setPersonalPincode(doc.personalPincode || userDetails?.personalPincode || "");

          setFirstName(doc.firstName || userDetails?.firstName || "");
          setLastName(doc.lastName || userDetails?.lastName || "");
          setPersonalCountry(doc.personalCountry || userDetails?.country || "India");
          setPersonalState(doc.personalState || userDetails?.state || "");
          setStateOption(doc.personalState || userDetails?.state || "");
          setPersonalCity(doc.personalCity || userDetails?.city || "");
          setCityOptions(doc.personalCity || userDetails?.city || "");
          setDateOfBirth(
            doc.dateOfBirth ||
            (userDetails?.dateOfBirth
              ? new Date(userDetails.dateOfBirth).toISOString().split("T")[0]
              : ""),
          );
          setMaritalStatus(doc.maritalStatus || userDetails?.maritalStatus || "");
          setIdProof(doc.idProof || userDetails?.idProof || "");

          const draftIdPhoto = doc.idPhotos?.[0] || userDetails?.idPhotos?.[0];
          if (draftIdPhoto) {
            setIdProofImage(draftIdPhoto);
          }

          setTermsAccepted(false);

          // Restore step: sessionStorage takes priority, otherwise compute from data
          const savedStep = sessionStorage.getItem(STEP_STORAGE_KEY);
          if (savedStep && parseInt(savedStep, 10) > 0) {
            setCurrentStep(parseInt(savedStep, 10));
          } else {
            // Compute the furthest completed step based on existing data
            let restoredStep = 0;
            if (doc.selectedProperties && doc.selectedProperties.length > 0) restoredStep = 1;
            if (doc.selectedCategories && doc.selectedCategories.length > 0) restoredStep = 2;
            if (
              doc.stayType === "entire"
                ? doc.guestCapacity > 0 && doc.regularPrice
                : doc.rooms && doc.rooms.length > 0 && doc.rooms[0]?.name
            )
              restoredStep = 3;
            if (doc.selectedFeatures && doc.selectedFeatures.length > 0) restoredStep = 4;
            // Steps 5-7 (discount, business, personal) — check if business name exists
            if (doc.brandName) restoredStep = Math.max(restoredStep, 5);
            if (doc.firstName) restoredStep = Math.max(restoredStep, 6);
            setCurrentStep(restoredStep);
          }
        } else if (userDetails) {
          // No draft found — auto-fill from saved profile.
          // Applies to both first-time users AND existing vendors submitting a
          // second service type (the !== "vendor" gate previously blocked them).
          hasLoadedRef.current = true;
          setIsStatusLoading(false);
          setFirstName(userDetails.firstName || "");
          setLastName(userDetails.lastName || "");
          setPersonalState(userDetails.state || "");
          setStateOption(userDetails.state || "");
          setPersonalCity(userDetails.city || "");
          setCityOptions(userDetails.city || "");
          setPersonalPincode(userDetails.personalPincode || "");

          setPersonalCountry(userDetails.country || "India");
          if (userDetails.dateOfBirth) {
            setDateOfBirth(new Date(userDetails.dateOfBirth).toISOString().split("T")[0]);
          }
          setMaritalStatus(userDetails.maritalStatus || "");
          setIdProof(userDetails.idProof || "");
          if (userDetails.idPhotos && userDetails.idPhotos.length > 0) {
            setIdProofImage(userDetails.idPhotos[0]);
          }

          setBrandName(userDetails.business?.brandName || "");
          setCompanyName(userDetails.business?.legalCompanyName || "");
          setGstNumber(userDetails.business?.gstNumber || "");
          setBusinessEmail(userDetails.business?.email || "");
          setBusinessPhone(userDetails.business?.phoneNumber || "");
          setBusinessAddress(userDetails.business?.address || "");
          setLocality(userDetails.business?.locality || "India");
          setState(userDetails.business?.state || "");
          setStateOption2(userDetails.business?.state || "");
          setCity(userDetails.business?.city || "");
          setCityOptions2(userDetails.business?.city || "");
          setBusinessPincode(userDetails.business?.pincode || "");
        }
      } catch (err) {
        hasLoadedRef.current = true;
        setIsStatusLoading(false);
      }
    };
    loadExistingData();
  }, [userDetails]);

  // Calculate final price based on regular price and discount
  useEffect(() => {
    if (currentStep === 4) {
      const price = parseFloat(regularPrice) || 0;
      const discount = parseFloat(discountPercentage) || 0;

      let calculatedPrice = 0;
      if (discountType === "percentage") {
        calculatedPrice = price - (price * discount) / 100;
      } else {
        calculatedPrice = price - discount;
      }

      calculatedPrice = Math.max(0, calculatedPrice);
      setFinalPrice(calculatedPrice.toFixed(0));
    }
  }, [regularPrice, discountPercentage, discountType, currentStep]);

  const handleBack = () => {
    setErrors({});
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/onboarding/service-selection");
    }
  };

  const getEffectiveCategories = (propertyId: string) => {
    // Prioritize dynamic categories from Admin
    const dynamic = subCategoriesMap[propertyId];
    if (dynamic && dynamic.length > 0) return dynamic;

    const hardcoded = propertyCategories[propertyId];
    if (hardcoded && hardcoded.length > 0) return hardcoded;

    const property = propertyTypes.find((p) => p.id === propertyId);
    return [
      {
        id: "default",
        name: property?.name || "Standard",
        icon: property?.icon || "🏠",
      },
    ];
  };

  const renderImageSrc = (src: string | null) => {
    if (!src) return "";
    if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("http")) return src;
    return getImageUrl(src);
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Please upload a valid image (JPEG/PNG)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setCoverImage(null);
  };

  const handleNext = () => {
    // Per-step validation
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!selectedProperties || selectedProperties.length === 0) {
        toast.error("Please select at least one property type");
        return;
      }
    } else if (currentStep === 1) {
      const hasCategories = selectedProperties.some((propId) => {
        const categories = getEffectiveCategories(propId);
        return categories && categories.length > 0;
      });

      if (hasCategories && (!selectedCategories || selectedCategories.length === 0)) {
        toast.error("Please select at least one category");
        return;
      }
    } else if (currentStep === 2) {
      if (stayType === "entire") {
        if (guestCapacity <= 0) newErrors.guestCapacity = "Guest capacity must be at least 1";
        if (numberOfRooms <= 0) newErrors.numberOfRooms = "Add at least 1 room";
        if (numberOfBeds <= 0) newErrors.numberOfBeds = "Add at least 1 bed";
        if (numberOfBathrooms <= 0) newErrors.numberOfBathrooms = "Add at least 1 bathroom";
        if (!regularPrice || Number(regularPrice) <= 0)
          newErrors.regularPrice = "Enter a valid price";
        const hasValidRule = entireStayRules.some((rule) => rule.trim() !== "");
        if (!hasValidRule) newErrors.entireStayRules = "Add at least one rule";
        if (!coverImage) newErrors.coverImage = "Cover photo is required";
        if (entireStayImages.length < 5)
          newErrors.entireStayImages = `Upload at least 5 images (${entireStayImages.length}/5)`;
      } else if (stayType === "individual") {
        if (!coverImage) newErrors.coverImage = "Cover photo is required";
        if (!rooms || rooms.length === 0) {
          newErrors.rooms = "Add at least one room";
        } else {
          for (let i = 0; i < rooms.length; i++) {
            const room = rooms[i];
            const validRoomImages = (room.photos || []).filter((p) => p);
            if (!room.name || !room.name.trim())
              newErrors[`room_${i}_name`] = "Room name is required";
            if (!room.description || !room.description.trim())
              newErrors[`room_${i}_description`] = "Description is required";
            if (validRoomImages.length < 5)
              newErrors[`room_${i}_photos`] =
                `Upload at least 5 images (${validRoomImages.length}/5)`;
            if (room.guestCapacity <= 0)
              newErrors[`room_${i}_guestCapacity`] = "Guest capacity must be at least 1";
            if (room.beds <= 0) newErrors[`room_${i}_beds`] = "Add at least 1 bed";
            if (room.bathrooms <= 0) newErrors[`room_${i}_bathrooms`] = "Add at least 1 bathroom";
            if (!room.price || room.price <= 0)
              newErrors[`room_${i}_price`] = "Enter a valid price";
          }
        }
      }
    } else if (currentStep === 3) {
      if (!selectedFeatures || selectedFeatures.length === 0) {
        newErrors.features = "Please select at least one feature";
      }
    } else if (currentStep === 4) {
      if (firstUserDiscount || festivalOffers || weeklyOffers || specialOffers) {
        if (!discountPercentage) newErrors.discountPercentage = "Discount Percentage is required";
        if (!finalPrice) newErrors.finalPrice = "Final Price is required";
      }
    } else if (currentStep === 5) {
      if (!brandName || !brandName.trim()) {
        newErrors.brandName = "Brand name is required";
      }
      if (!companyName || !companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
      if (!businessEmail || !businessEmail.trim()) {
        newErrors.businessEmail = "Business email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
        newErrors.businessEmail = "Please enter a valid email address";
      }
      if (!businessPhone || !businessPhone.trim()) {
        newErrors.businessPhone = "Business phone number is required";
      } else if (!/^\d{10}$/.test(businessPhone)) {
        newErrors.businessPhone = "Please enter a valid 10-digit phone number";
      }
      if (!businessAddress || !businessAddress.trim()) {
        newErrors.businessAddress = "Business address is required";
      }
      if (!locality || !locality.trim()) {
        newErrors.locality = "Business locality is required";
      }
      if (!state || !state.trim()) {
        newErrors.state = "Business state is required";
      }
      if (!city || !city.trim()) {
        newErrors.city = "Business city is required";
      }
      if (!businessPincode || !businessPincode.trim()) {
        newErrors.businessPincode = "Business pincode is required";
      } else if (!/^\d{6}$/.test(businessPincode.trim())) {
        newErrors.businessPincode = "Enter a valid 6-digit pincode";
      }
    } else if (currentStep === 6) {
      if (!firstName || !firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!lastName || !lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
      if (!personalState || !personalState.trim()) {
        newErrors.personalState = "Personal state is required";
      }
      if (!personalCity || !personalCity.trim()) {
        newErrors.personalCity = "Personal city is required";
      }
      if (!personalPincode || !personalPincode.trim()) {
        newErrors.personalPincode = "Pincode is required";
      } else if (!/^\d{6}$/.test(personalPincode.trim())) {
        newErrors.personalPincode = "Enter a valid 6-digit pincode";
      }
      if (!dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required";
      }
      if (!idProof) {
        newErrors.idProof = "ID proof type is required";
      }
      if (!idProofImage) {
        newErrors.idPhotos = "ID proof photo is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Surface the first error as a toast — inline errors are easy to miss if
      // the failing field is scrolled out of view.
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    setErrors({}); // Clear errors if validation passes

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === totalSteps - 1) {
      if (!termsAccepted) {
        toast.error("You must accept the Terms & Conditions to proceed.");
        return;
      }
      handleComplete();
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      const gallery: string[] = (images || []).filter(Boolean) as string[];
      const entireStayGallery: string[] = entireStayImages || [];
      const roomsWithPhotos = [...rooms];
      if (!roomsWithPhotos.length) {
        roomsWithPhotos.push({
          id: "1",
          name: "",
          description: "",
          photos: [],
          guestCapacity: 1,
          beds: 1,
          bathrooms: 1,
          price: Number(regularPrice) || 0,
        });
      }

      if (stayType === "entire") {
        roomsWithPhotos[0] = { ...roomsWithPhotos[0], photos: entireStayGallery };
      }

      // For individual stays, price and capacity live on each room — derive
      // top-level values so downstream (API, preview) always gets numbers > 0.
      const effectiveRegularPrice =
        stayType === "individual"
          ? roomsWithPhotos[0]?.price || 0
          : Number(regularPrice);
      // For individual stays sum per-room capacity; also accept the legacy
      // `capacity` field name that existed in an older RoomSchema. Fall back to
      // the top-level `guestCapacity` state (which IS persisted correctly in the
      // DB) so reloaded docs don't produce 0 if rooms were saved with old field names.
      const roomCapacitySum = stayType === "individual"
        ? roomsWithPhotos.reduce((sum, r) => sum + (Number(r.guestCapacity) || Number((r as any).capacity) || 0), 0)
        : 0;
      const effectiveGuestCapacity =
        stayType === "individual"
          ? (roomCapacitySum > 0 ? roomCapacitySum : Number(guestCapacity) || 0)
          : Number(guestCapacity);

      const payload = {
        selectedProperties,
        selectedCategories,
        stayType,
        coverImage,
        guestCapacity: effectiveGuestCapacity,
        numberOfRooms: Number(numberOfRooms),
        numberOfBeds: Number(numberOfBeds),
        numberOfBathrooms: Number(numberOfBathrooms),
        regularPrice: effectiveRegularPrice,
        rooms: roomsWithPhotos,
        selectedFeatures,
        entireStayRules: entireStayRules.filter((rule) => rule.trim() !== ""),
        roomRules,
        optionalRules: optionalRules.filter((rule) => rule.trim() !== ""),
        firstUserDiscount,
        discountType,
        discountPercentage: Number(discountPercentage),
        finalPrice: Number(finalPrice) || 0,
        festivalOffers,
        weeklyOffers,
        specialOffers,
        brandName,
        companyName,
        gstNumber,
        businessEmail,
        businessPhone,
        businessAddress,
        locality,
        state,
        city,
        pincode: businessPincode,
        businessPincode,
        personalPincode,
        firstName,
        lastName,
        personalCountry,
        personalState,
        personalCity,
        dateOfBirth,
        maritalStatus,
        idProof,
        idPhotos: idProofImage ? [idProofImage] : [],
      };

      // Basic validation
      if (!selectedProperties || selectedProperties.length === 0) {
        throw new Error("Please select at least one property type");
      }

      if (!effectiveRegularPrice || isNaN(effectiveRegularPrice) || effectiveRegularPrice <= 0) {
        throw new Error("Please enter a valid regular price");
      }

      if (!effectiveGuestCapacity || effectiveGuestCapacity <= 0) {
        throw new Error("Please enter a valid guest capacity");
      }

      const result = await submitOnboardingData("stay", payload);

      if (result?.id) {
        await updateUserDetails({
          firstName: firstName,
          lastName: lastName,
          phoneNumber: businessPhone,
          country: personalCountry,
          state: personalState,
          city: personalCity,
          personalLocality: personalCountry,
          personalPincode: personalPincode,
          dateOfBirth: dateOfBirth,
          maritalStatus: maritalStatus,
          idProof: idProof,
          idPhotos: idProofImage ? [idProofImage] : [],

          business: {
            brandName: brandName,
            legalCompanyName: companyName,
            gstNumber: gstNumber,
            email: businessEmail,
            phoneNumber: businessPhone,
            address: businessAddress,
            locality: locality,
            state: state,
            city: city,
            pincode: businessPincode,
          },
        });

        onboardingService.setStayId(result.id);
        sessionStorage.setItem("onboardingId", result.id);
        sessionStorage.setItem("onboardingType", "stay");
        sessionStorage.setItem("id", result.id);
        sessionStorage.removeItem(STEP_STORAGE_KEY);
        sessionStorage.removeItem(FORM_STORAGE_KEY);
        updateUserType("vendor");
        toast.success("Stay onboarding saved successfully!");
        navigate("/onboarding/selfie-verification");
        return;
      } else {
        toast.error("Could not save onboarding. Please try again.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  const sliderRef = useRef(null);

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties((prev) => {
      const isSelected = prev.includes(propertyId);
      if (isSelected) {
        return prev.filter((id) => id !== propertyId);
      } else {
        if (prev.length >= 5) {
          toast.error("Maximum 5 properties can be selected");
          return prev;
        }
        return [...prev, propertyId];
      }
    });
  };

  const canProceed = () => {
    if (currentStep === 0) return selectedProperties.length > 0;
    if (currentStep === 1) return selectedCategories.length > 0;
    if (currentStep === 2) return true;
    if (currentStep === 3) return true;
    if (currentStep === 4) return true;
    if (currentStep === 5) return true;
    if (currentStep === 6) return true;
    return true;
  };

  const toggleFeatureSelection = (featureId: string) => {
    if (featureId === "others") {
      setShowCustomFeaturesInput(!showCustomFeaturesInput);
    } else {
      setSelectedFeatures((prev) => {
        const isSelected = prev.includes(featureId);
        if (isSelected) {
          return prev.filter((id) => id !== featureId);
        } else {
          return [...prev, featureId];
        }
      });
    }
  };

  const incrementValue = (value: number, setter: (val: number) => void, max: number = 20) => {
    const safe = isFinite(value) ? value : 0;
    if (safe < max) setter(safe + 1);
  };

  const decrementValue = (value: number, setter: (val: number) => void, min: number = 1) => {
    const safe = isFinite(value) ? value : 0;
    if (safe > min) setter(safe - 1);
  };

  const addRoom = () => {
    const newRoom: Room = {
      id: (rooms.length + 1).toString(),
      name: "",
      description: "",
      photos: [],
      guestCapacity: 1,
      beds: 1,
      bathrooms: 1,
      price: 5934,
    };
    setRooms([...rooms, newRoom]);
    setNumberOfRooms(rooms.length + 1);
  };

  const removeRoom = () => {
    if (rooms.length > 1) {
      setRooms(rooms.slice(0, -1));
      setNumberOfRooms(rooms.length - 1);
    }
  };

  const updateRoom = (id: string, field: keyof Room, value: any) => {
    setRooms((prev) => prev.map((room) => (room.id === id ? { ...room, [field]: value } : room)));
  };

  const removeRoomImage = (roomId: string, index: number) => {
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id === roomId) {
          return {
            ...room,
            photos: (room.photos || []).filter((_, i) => i !== index),
          };
        }
        return room;
      }),
    );
  };

  const handleRoomImageUpload = (event: React.ChangeEvent<HTMLInputElement>, roomId: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    const readPromises = validFiles.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((base64Images) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id === roomId) {
            return {
              ...room,
              photos: [...(room.photos || []), ...base64Images],
            };
          }
          return room;
        }),
      );
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newImages = [...images];
      newImages[index] = reader.result as string;
      setImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const handleEntireStayImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newImages = [...entireStayImages];
      newImages[index] = reader.result as string;
      setEntireStayImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const removeEntireStayImage = (index: number) => {
    setEntireStayImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadIDProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError("");
    setFileName("");

    if (file) {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        setError("Only JPG, PNG, or PDF files are allowed.");
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxSize) {
        setError("File size must be under 5 MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setIdProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      setFileName(file.name);
    }
  };

  // Rules management functions
  const addEntireStayRule = () => {
    setEntireStayRules((prev) => [...prev, ""]);
  };

  const removeEntireStayRule = (index: number) => {
    setEntireStayRules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEntireStayRule = (index: number, value: string) => {
    setEntireStayRules((prev) => prev.map((rule, i) => (i === index ? value : rule)));
  };

  const addRoomRule = (roomId: string) => {
    setRoomRules((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] || [""]), ""],
    }));
  };

  const removeRoomRule = (roomId: string, index: number) => {
    setRoomRules((prev) => {
      const roomRulesList = prev[roomId] || [];
      return {
        ...prev,
        [roomId]: roomRulesList.filter((_, i) => i !== index),
      };
    });
  };

  const updateRoomRule = (roomId: string, index: number, value: string) => {
    setRoomRules((prev) => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map((rule, i) => (i === index ? value : rule)),
    }));
  };

  const addOptionalRule = () => {
    setOptionalRules((prev) => [...prev, ""]);
  };

  const removeOptionalRule = (index: number) => {
    setOptionalRules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOptionalRule = (index: number, value: string) => {
    setOptionalRules((prev) => prev.map((rule, i) => (i === index ? value : rule)));
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByIndex = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const firstChild = container.firstChild as HTMLElement;

    if (!firstChild) return;

    const itemWidth = firstChild.offsetWidth;
    const gap = 4;
    const scrollAmount = itemWidth + gap;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const activeChild = container.children[carouselIndex] as HTMLElement;

    if (activeChild) {
      activeChild.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [carouselIndex]);

  // Business map calculation
  const businessMapQuery = `
  ${cityOption2 || ""}
  ${stateOption2 || ""}
  ${businessPincode || ""}
  India
`;

  const mapSrcbusiness = `https://www.google.com/maps?q=${encodeURIComponent(
    businessMapQuery,
  )}&output=embed`;

  // Compute features data for FeaturesStep
  const primaryPropertyType = selectedProperties[0] || "";
  const featuresData = getFeaturesForProperty(primaryPropertyType, "", stayType);

  // Build discount offers object for DiscountOffersStep
  const discountOffers = {
    firstUser: {
      enabled: firstUserDiscount,
      type: discountType,
      value: discountPercentage,
      finalPrice: finalPrice,
    },
    festival: {
      enabled: festivalOffers,
      type: discountType,
      value: discountPercentage,
      finalPrice: finalPrice,
    },
    weekly: {
      enabled: weeklyOffers,
      type: discountType,
      value: discountPercentage,
      finalPrice: finalPrice,
    },
    special: {
      enabled: specialOffers,
      type: discountType,
      value: discountPercentage,
      finalPrice: finalPrice,
    },
  };

  const handleDiscountToggle = (key: "firstUser" | "festival" | "weekly" | "special") => {
    switch (key) {
      case "firstUser":
        setFirstUserDiscount(!firstUserDiscount);
        break;
      case "festival":
        setFestivalOffers(!festivalOffers);
        break;
      case "weekly":
        setWeeklyOffers(!weeklyOffers);
        break;
      case "special":
        setSpecialOffers(!specialOffers);
        break;
    }
  };

  const handleDiscountOfferChange = (
    _key: "firstUser" | "festival" | "weekly" | "special",
    field: keyof DiscountOffer,
    value: string,
  ) => {
    // All offers share the same discountType, discountPercentage, finalPrice
    switch (field) {
      case "type":
        setDiscountType(value);
        break;
      case "value":
        setDiscountPercentage(value);
        clearError("discountPercentage");
        break;
      case "finalPrice":
        setFinalPrice(value);
        clearError("finalPrice");
        break;
    }
  };

  // Business details onChange handler
  const handleBusinessChange = (field: string, value: string) => {
    switch (field) {
      case "brandName":
        setBrandName(value);
        clearError("brandName");
        break;
      case "companyName":
        setCompanyName(value);
        clearError("companyName");
        break;
      case "gstNumber":
        setGstNumber(value);
        break;
      case "businessEmail":
        setBusinessEmail(value);
        clearError("businessEmail");
        break;
      case "businessPhone":
        setBusinessPhone(value);
        clearError("businessPhone");
        break;
      case "businessAddress":
        setBusinessAddress(value);
        clearError("businessAddress");
        break;
      case "pincode":
        setBusinessPincode(value);
        clearError("businessPincode");
        break;
    }
  };

  const handleBusinessStateChange = (val: string) => {
    setStateOption2(val);
    setCityOptions2("");
    clearError("state");
  };

  const handleBusinessCityChange = (val: string) => {
    setCityOptions2(val);
    clearError("city");
  };

  // Personal details onChange handler
  const handlePersonalChange = (field: string, value: string) => {
    switch (field) {
      case "firstName":
        setFirstName(value);
        clearError("firstName");
        break;
      case "lastName":
        setLastName(value);
        clearError("lastName");
        break;
      case "pincode":
        setPersonalPincode(value);
        clearError("personalPincode");
        break;
      case "dateOfBirth":
        setDateOfBirth(value);
        clearError("dateOfBirth");
        break;
      case "maritalStatus":
        setMaritalStatus(value);
        clearError("maritalStatus");
        break;
      case "idProof":
        setIdProof(value);
        clearError("idProof");
        break;
    }
  };

  const handlePersonalStateChange = (val: string) => {
    setStateOption(val);
    setCityOptions("");
    clearError("personalState");
  };

  const handlePersonalCityChange = (val: string) => {
    setCityOptions(val);
    clearError("personalCity");
  };

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryKey) ? prev.filter((id) => id !== categoryKey) : [...prev, categoryKey],
    );
  };

  // ---------- Render ----------

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <PropertyTypeStep
            selectedProperties={selectedProperties}
            propertyTypes={propertyTypes}
            onToggle={togglePropertySelection}
            errors={errors}
          />
        );

      case 1:
        return (
          <CategorySelectionStep
            selectedProperties={selectedProperties}
            selectedCategories={selectedCategories}
            propertyTypes={propertyTypes}
            getEffectiveCategories={getEffectiveCategories}
            onCategoryToggle={handleCategoryToggle}
          />
        );

      case 2:
        return (
          <StayDetailsStep
            stayType={stayType}
            setStayType={(t) => { setStayType(t); setErrors({}); }}
            guestCapacity={guestCapacity}
            numberOfRooms={numberOfRooms}
            numberOfBeds={numberOfBeds}
            numberOfBathrooms={numberOfBathrooms}
            regularPrice={regularPrice}
            setRegularPrice={setRegularPrice}
            incrementValue={incrementValue}
            decrementValue={decrementValue}
            setGuestCapacity={setGuestCapacity}
            setNumberOfRooms={setNumberOfRooms}
            setNumberOfBeds={setNumberOfBeds}
            setNumberOfBathrooms={setNumberOfBathrooms}
            entireStayRules={entireStayRules}
            addEntireStayRule={addEntireStayRule}
            removeEntireStayRule={removeEntireStayRule}
            updateEntireStayRule={updateEntireStayRule}
            roomRules={roomRules}
            addRoomRule={addRoomRule}
            removeRoomRule={removeRoomRule}
            updateRoomRule={updateRoomRule}
            coverImage={coverImage}
            handleCoverImageUpload={handleCoverImageUpload}
            removeCoverImage={removeCoverImage}
            renderImageSrc={renderImageSrc}
            entireStayImages={entireStayImages}
            setEntireStayImages={setEntireStayImages}
            removeEntireStayImage={removeEntireStayImage}
            sliderRef={sliderRef}
            rooms={rooms}
            expandedRoom={expandedRoom}
            setExpandedRoom={setExpandedRoom}
            addRoom={addRoom}
            removeRoom={removeRoom}
            updateRoom={updateRoom}
            handleRoomImageUpload={handleRoomImageUpload}
            removeRoomImage={removeRoomImage}
            errors={errors}
            clearError={clearError}
          />
        );

      case 3:
        return (
          <FeaturesStep
            selectedFeatures={selectedFeatures}
            toggleFeatureSelection={toggleFeatureSelection}
            adminFeatures={adminFeatures}
            customFeatures={customFeatures}
            setCustomFeatures={setCustomFeatures}
            setSelectedFeatures={setSelectedFeatures}
            showCustomFeaturesInput={showCustomFeaturesInput}
            setShowCustomFeaturesInput={setShowCustomFeaturesInput}
            customFeatureInput={customFeatureInput}
            setCustomFeatureInput={setCustomFeatureInput}
            featuresData={featuresData}
            errors={errors}
          />
        );

      case 4:
        return (
          <DiscountOffersStep
            offers={discountOffers}
            onToggle={handleDiscountToggle}
            onOfferChange={handleDiscountOfferChange}
            errors={errors}
            weeklyLabel="Weekly or Monthly Offers"
          />
        );

      case 5:
        return (
          <BusinessDetailsStep
            values={{
              brandName,
              companyName,
              gstNumber,
              businessEmail,
              businessPhone,
              businessAddress,
              pincode: businessPincode,
            }}
            errors={errors}
            onChange={handleBusinessChange}
            selectedCountry={selected}
            onCountrySelect={setSelected}
            countryDialogOpen={open}
            setCountryDialogOpen={setOpen}
            countries={countries}
            locationData={data}
            selectedState={stateOption2}
            selectedCity={cityOption2}
            countryName={countryOption2}
            onStateChange={handleBusinessStateChange}
            onCityChange={handleBusinessCityChange}
            mapSrc={mapSrcbusiness}
          />
        );

      case 6:
        return (
          <PersonalDetailsStep
            values={{
              firstName,
              lastName,
              pincode: personalPincode,
              dateOfBirth,
              maritalStatus,
              idProof,
            }}
            errors={errors}
            onChange={handlePersonalChange}
            locationData={data}
            selectedState={stateOption}
            selectedCity={cityOption}
            countryName={countryOption}
            onStateChange={handlePersonalStateChange}
            onCityChange={handlePersonalCityChange}
            idProofImage={idProofImage}
            onIdProofUpload={handleUploadIDProof}
            uploadError={error}
          />
        );

      case 7:
        return (
          <TermsConditionsStep termsAccepted={termsAccepted} onTermsChange={setTermsAccepted} />
        );

      default:
        return null;
    }
  };

  const primaryPropertyName =
    propertyTypes.find((p) => p.id === selectedProperties[0])?.name ?? selectedProperties[0];

  const activeDiscount = pickStayDiscount(
    regularPrice,
    finalPrice,
    { firstUserDiscount, festivalOffers, weeklyOffers, specialOffers },
  );

  // ─── Loading spinner while we check existing submission status ───────────
  if (isStatusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#185FA5] border-t-transparent animate-spin" />
          <p className="text-sm text-[#888780]">Loading…</p>
        </div>
      </div>
    );
  }

  // ─── Read-only status screens — shown when submission already exists ──────
  // "pending" and "approved" should NOT show the editable form again; that
  // would send the user through verification a second time unnecessarily.
  // "rejected" falls through to the normal form so the vendor can re-edit.
  if (status === "pending" || status === "approved") {
    const isPending = status === "pending";
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgba(4,44,83,0.08)] border border-[#EBEBEB] p-8 flex flex-col items-center gap-6 text-center">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: isPending
                ? "rgba(234,179,8,0.1)"
                : "rgba(29,158,117,0.1)",
            }}
          >
            {isPending ? (
              <Clock className="w-8 h-8 text-yellow-500" />
            ) : (
              <CheckCircle2 className="w-8 h-8" style={{ color: "#1D9E75" }} />
            )}
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold" style={{ color: "#042C53" }}>
              {isPending ? "Submission Under Review" : "Listing Approved!"}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#888780" }}>
              {isPending
                ? "Your stay listing has been submitted and is currently being reviewed by our team. You'll be notified once a decision is made."
                : "Your stay listing has been approved and is now live for guests to discover and book."}
            </p>
          </div>

          {/* Property pill */}
          {primaryPropertyName && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: "rgba(24,95,165,0.07)",
                color: "#185FA5",
                border: "1px solid rgba(24,95,165,0.2)",
              }}
            >
              <Home className="w-4 h-4" />
              {stayType === "entire" ? `Entire ${primaryPropertyName}` : primaryPropertyName}
            </div>
          )}

          {/* CTA */}
          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#185FA5" }}
            >
              Go to Dashboard
            </button>
            {isPending && (
              <button
                onClick={() => navigate("/onboarding/service-selection")}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "transparent",
                  color: "#888780",
                  border: "1px solid #D3D1C7",
                }}
              >
                Submit Another Service
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      isLoading={isLoading}
      canProceed={canProceed()}
      termsAccepted={termsAccepted}
      onBack={handleBack}
      onNext={handleNext}
      preview={
        currentStep <= 4 ? (
          <UniqueStayCardPreview
            propertyType={primaryPropertyName}
            coverImage={coverImage}
            galleryCount={stayType === "entire" ? entireStayImages.length : (rooms[0]?.photos?.length ?? 0)}
            city={cityOption2 || city}
            state={stateOption2 || state}
            regularPrice={regularPrice}
            guestCapacity={guestCapacity}
            stayType={stayType}
            activeDiscount={activeDiscount}
          />
        ) : undefined
      }
    >
      {status === "rejected" && (
        <div className="w-full max-w-4xl p-4 border border-red-200 bg-red-50 rounded-md">
          <h3 className="text-red-800 font-semibold mb-1">Service Rejected</h3>
          <p className="text-red-700 text-sm">Reason: {rejectionReason || "No reason provided"}</p>
          <p className="text-red-600 text-xs mt-2">
            Please update the details and resubmit for approval.
          </p>
        </div>
      )}

      {renderStepContent()}
    </OnboardingLayout>
  );
};

export default StaysOnboarding;
