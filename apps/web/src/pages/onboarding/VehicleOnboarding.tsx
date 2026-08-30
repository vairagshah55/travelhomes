import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Car, Clock, MoreHorizontal } from "lucide-react";
import { useCountriesData } from "@/hooks/useCountriesData";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useFeatures } from "@/hooks/useFeatures";
import { useAuth } from "../../contexts/AuthContext";
import { useUserDetails } from "@/hooks/useUserDetails";

// Shared components
import {
  OnboardingLayout,
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY_OPTION,
} from "@/components/onboarding/shared";
import type { CountryOption, DiscountOffer, OnboardingPhase } from "@/components/onboarding/shared";

// Vehicle-specific pieces
import { VehicleCardPreview } from "@/components/onboarding/vehicle";
import type { VehicleListField, VehicleDocField } from "@/components/onboarding/vehicle";
import {
  FormData,
  defaultVehicleFormData,
  headlineRate,
  pickActiveDiscount,
  deriveVehicleName,
  deriveVehicleDescription,
  deriveVehicleLocation,
} from "@/components/onboarding/vehicle/vehicleConfig";
import { submitVehicleOnboarding } from "@/components/onboarding/vehicle/submitVehicleOnboarding";
import { validateVehicleStep } from "@/components/onboarding/vehicle/validateVehicleStep";
import { loadVehicleDraft } from "@/components/onboarding/vehicle/loadVehicleDraft";
import { VehicleStepRenderer } from "@/components/onboarding/vehicle/VehicleStepRenderer";

/**
 * Progress-rail grouping for the 9 content steps (step 9 is the terms hand-off
 * and isn't counted). Mirrors VehicleStepRenderer's switch order:
 * 0 Details · 1 Class · 2 Specs · 3 Capacity | 4 Pricing · 5 Offers |
 * 6 Documents | 7 Business · 8 Personal. `steps` must sum to totalSteps - 1.
 */
const VEHICLE_PHASES: OnboardingPhase[] = [
  { label: "Your vehicle", steps: 3 },
  { label: "Pricing", steps: 2 },
  { label: "Documents", steps: 1 },
  { label: "About you", steps: 2 },
];

// 9 since the vehicle identity and photos steps merged — see VehicleStepRenderer.
const TOTAL_STEPS = 9;
const FORM_STORAGE_KEY = "vehicle_onboarding_form";
const STEP_STORAGE_KEY = "vehicle_onboarding_step";
/** CMS category/feature group this flow reads. */
const CMS_SERVICE = "Vehicle Rental";

const countries = COUNTRY_OPTIONS;

const VehicleOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUserType, isAuthenticated } = useAuth();

  // Lets a vendor re-enter the wizard for a still-pending submission — the
  // draft loader already hydrates formData from the pending doc, so once this
  // is true the normal wizard renders pre-filled instead of the "under review"
  // dead end. Resubmitting is safe: the backend supersedes the previous offer.
  const [bypassPendingGate, setBypassPendingGate] = useState(
    () => (location.state as any)?.autoEdit === true,
  );

  // Same admin gate as the other three flows: when the homepage section is
  // toggled off, the whole feature is unavailable — including this wizard,
  // which a vendor could otherwise reach by typing the URL.
  const { data: homepageSections } = useHomepageSections();
  useEffect(() => {
    if (homepageSections) {
      const section = (homepageSections as any[]).find(
        (s: any) => s.sectionKey === "vehicle-rental",
      );
      if (section && !section.isVisible) {
        toast.error("Vehicle rental onboarding is currently disabled.");
        navigate("/");
      }
    }
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [isAuthenticated, navigate, homepageSections]);

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem(STEP_STORAGE_KEY);
    const parsed = saved ? parseInt(saved, 10) : 0;
    // Clamped, because the flow shrank from ten steps to nine. A vendor who
    // left mid-flow has a step index in sessionStorage from the old numbering,
    // and a restored 9 would render no case at all — a blank page with a Next
    // button. NaN from a corrupt value lands on 0 for the same reason.
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.min(parsed, TOTAL_STEPS - 1);
  });
  const sliderRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem(STEP_STORAGE_KEY, String(currentStep));
  }, [currentStep]);

  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (saved) return { ...defaultVehicleFormData, ...JSON.parse(saved) };
    } catch {}
    return defaultVehicleFormData;
  });

  // Persist the draft (File objects are excluded — they can't be serialised).
  // Debounced, because the persisted photos are base64 data URLs of ~400KB-1MB
  // each: writing on every `formData` change means a multi-megabyte
  // JSON.stringify plus a synchronous sessionStorage write per keystroke.
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = formDataRef.current;
      const serialisable = {
        ...current,
        photos: current.photos.filter((p) => typeof p === "string"),
        coverImage: current.coverImage.filter((p) => typeof p === "string"),
        idPhotos: current.idPhotos.filter((p) => typeof p === "string"),
        rcPhotos: current.rcPhotos.filter((p) => typeof p === "string"),
        driverLicencePhotos: current.driverLicencePhotos.filter((p) => typeof p === "string"),
      };
      try {
        sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(serialisable));
      } catch {
        // Over quota — keep the typed fields rather than losing the whole draft.
        try {
          sessionStorage.setItem(
            FORM_STORAGE_KEY,
            JSON.stringify({
              ...serialisable,
              photos: [],
              coverImage: [],
              idPhotos: [],
              rcPhotos: [],
              driverLicencePhotos: [],
            }),
          );
        } catch {
          /* still no room — leave the previous snapshot in place */
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [formData]);

  const [selected, setSelected] = useState<CountryOption | null>(DEFAULT_COUNTRY_OPTION);
  const [open, setOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [idProofImage, setIdProofImage] = useState<string | null>(null);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [dynamicFeatures, setDynamicFeatures] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [crossTypePending, setCrossTypePending] = useState<{ type: string; doc: any } | null>(null);

  const [customFeatures, setCustomFeatures] = useState<{ name: string; icon: any }[]>([]);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");

  // Three addresses (vehicle, business, personal), each with its own country.
  // Only these countries' states/cities are fetched — see useCountriesData.
  const data = useCountriesData([
    formData.locality,
    formData.businessLocality,
    formData.personalLocality,
  ]);

  const { userDetails, loading: userDetailsLoading, updateUserDetails } = useUserDetails();

  // Vehicle Rental categories + amenities from CMS (cached, shared).
  const { data: vehicleFeatures, isLoading: vehicleFeaturesLoading } = useFeatures(CMS_SERVICE);
  useEffect(() => {
    if (!vehicleFeatures) return;
    const enabled = vehicleFeatures.filter((f: any) => f.status === "enable");
    setDynamicCategories(enabled.filter((f: any) => f.type === "category"));
    // `type` is absent on legacy rows, so treat "not a category" as a feature.
    setDynamicFeatures(enabled.filter((f: any) => f.type === "feature" || !f.type));
  }, [vehicleFeatures]);

  // Load the draft / approved-resubmit reset exactly once per mount, after the
  // userDetails query has settled. Re-running on every userDetails identity
  // change would replace formData while the user is typing — wiping input.
  const draftLoadedRef = useRef(false);
  useEffect(() => {
    if (draftLoadedRef.current) return;
    if (userDetailsLoading) return;
    draftLoadedRef.current = true;
    loadVehicleDraft({
      setFormData,
      setCurrentStep,
      setIdProofImage,
      setStatus,
      setRejectionReason,
      setIsStatusLoading,
      setCrossTypePending,
      userDetails,
      formStorageKey: FORM_STORAGE_KEY,
      stepStorageKey: STEP_STORAGE_KEY,
    });
  }, [userDetailsLoading, userDetails]);

  // Auto-seed discount final prices from the headline rate, once the offers step
  // is reached. Only fills fields still empty — never overrides a typed value.
  const baseRate = headlineRate(formData);
  useEffect(() => {
    if (currentStep !== 5) return;
    if (baseRate <= 0) return;

    setFormData((prev) => {
      const next = { ...prev };
      let changed = false;

      const calculateFinal = (type: string, value: string) => {
        const val = parseFloat(value) || 0;
        return type === "percentage"
          ? Math.max(0, baseRate - (baseRate * val) / 100).toFixed(0)
          : Math.max(0, baseRate - val).toFixed(0);
      };

      const slots: [keyof FormData, keyof FormData, keyof FormData, keyof FormData][] = [
        [
          "firstUserDiscount",
          "firstUserDiscountFinalPrice",
          "firstUserDiscountType",
          "firstUserDiscountValue",
        ],
        ["festivalOffers", "festivalOffersFinalPrice", "festivalOffersType", "festivalOffersValue"],
        [
          "weeklyMonthlyOffers",
          "weeklyMonthlyOffersFinalPrice",
          "weeklyMonthlyOffersType",
          "weeklyMonthlyOffersValue",
        ],
        ["specialOffers", "specialOffersFinalPrice", "specialOffersType", "specialOffersValue"],
      ];

      for (const [enabledKey, finalKey, typeKey, valueKey] of slots) {
        if (prev[enabledKey] && !prev[finalKey]) {
          (next as any)[finalKey] = calculateFinal(
            String(prev[typeKey]),
            String(prev[valueKey] ?? ""),
          );
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [
    currentStep,
    baseRate,
    formData.firstUserDiscount,
    formData.firstUserDiscountType,
    formData.firstUserDiscountValue,
    formData.festivalOffers,
    formData.festivalOffersType,
    formData.festivalOffersValue,
    formData.weeklyMonthlyOffers,
    formData.weeklyMonthlyOffersType,
    formData.weeklyMonthlyOffersValue,
    formData.specialOffers,
    formData.specialOffersType,
    formData.specialOffersValue,
  ]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/onboarding/service-selection");
    }
  };

  const handleNext = () => {
    const { errors: newErrors, toastError } = validateVehicleStep(currentStep, formData);
    if (toastError) {
      toast.error(toastError);
      if (Object.keys(newErrors).length > 0) setErrors(newErrors);
      return;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () =>
    submitVehicleOnboarding(formData, {
      setIsLoading,
      updateUserDetails,
      updateUserType,
      navigate,
      formStorageKey: FORM_STORAGE_KEY,
    });

  // ─── Step 0 handlers ──────────────────────────────────────────────────
  const addRule = () => setFormData((prev) => ({ ...prev, rules: [...prev.rules, ""] }));
  const removeRule = (index: number) =>
    setFormData((prev) => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  const updateRule = (index: number, value: string) =>
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) => (i === index ? value : rule)),
    }));

  /**
   * Gallery / ID photo picker. Snapshots the FileList and fires its toast before
   * touching state, for the same two reasons as handleDocUpload above.
   */
  const addFiles = (
    field: "photos" | "idPhotos" | "coverImage",
    files: FileList | null,
    limit: number,
  ) => {
    if (!files || files.length === 0) return;
    const picked = Array.from(files);

    const already = (formDataRef.current[field] as (string | File)[]) || [];
    const remainingSlots = limit - already.length;
    if (picked.length > remainingSlots) {
      toast.error("Upload limit exceeded!");
      return;
    }

    setFormData((prev) => {
      const currentFiles = prev[field] || [];
      const slots = limit - currentFiles.length;
      if (slots <= 0) return prev;
      return { ...prev, [field]: [...currentFiles, ...picked.slice(0, slots)] };
    });
  };

  const handleFileUpload = (field: "photos" | "idPhotos", files: FileList | null) =>
    addFiles(field, files, 15);

  const handleCoverFileUpload = (field: "coverImage", files: FileList | null) =>
    addFiles(field, files, 2);

  const removeFile = (field: "photos" | "idPhotos", index: number) =>
    setFormData((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  const removeCoverFile = (field: "coverImage", index: number) =>
    setFormData((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

  // ─── Step 2 handlers ──────────────────────────────────────────────────
  const toggleFeature = (feature: string) =>
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));

  const handleRemoveCustomFeature = (idx: number) => {
    const featureName = customFeatures[idx].name;
    setCustomFeatures((prev) => prev.filter((_, i) => i !== idx));
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== featureName),
    }));
  };

  const handleAddCustomFeature = () => {
    if (customFeatureInput.trim() && customFeatures.length < 20) {
      const newFeatureName = customFeatureInput.trim();
      // Compared case-INSENSITIVELY. A plain `includes` let "bluetooth" through
      // alongside "Bluetooth", so the same amenity shipped twice on one listing
      // and rendered as two chips a guest reads as two different things.
      if (formData.features.some((f) => f.toLowerCase() === newFeatureName.toLowerCase())) {
        toast.error("This feature already exists");
        return;
      }
      setCustomFeatures((prev) => [...prev, { name: newFeatureName, icon: MoreHorizontal }]);
      setFormData((prev) => ({ ...prev, features: [...prev.features, newFeatureName] }));
      setCustomFeatureInput("");
    }
  };

  // ─── Step 3 handlers ──────────────────────────────────────────────────
  const adjustCapacity = (type: "seating" | "luggage", direction: "increase" | "decrease") => {
    const field = type === "seating" ? "seatingCapacity" : "luggageCapacity";
    // Seating can't go below 1; luggage legitimately can be 0.
    const floor = type === "seating" ? 1 : 0;
    setFormData((prev) => ({
      ...prev,
      [field]: direction === "increase" ? prev[field] + 1 : Math.max(floor, prev[field] - 1),
    }));
  };

  /**
   * The single pickup point, stored at index 0 of the existing string[].
   *
   * Replaces add/update/remove now that the step takes one value. The
   * index-based updater could not back a single input on its own: it maps over
   * the array, and `pickupPoints` defaults to `[]`, so writing index 0 of an
   * empty array was a no-op and the field would not accept typing at all.
   * Emptying the input clears the array so `hasLine` still reports it missing.
   */
  const setPickupPoint = (value: string) =>
    setFormData((prev) => ({ ...prev, pickupPoints: value ? [value] : [] }));

  // ─── Step 4 handlers ──────────────────────────────────────────────────
  /**
   * Rental modes are mutually exclusive — a listing is self-drive OR chauffeur.
   *
   * Switching one ON switches the other OFF rather than refusing the click: a
   * toggle that silently does nothing reads as broken, and the vendor's intent
   * ("I want this one") is unambiguous. Switching one OFF leaves the other
   * alone, so both can be off — which validation then blocks, because a listing
   * with no rental mode is bookable by nobody.
   *
   * The other mode's rates are left in the form on purpose. A vendor who
   * toggles back and forth while deciding would otherwise have to retype them,
   * and they are inert on submit while their `…Enabled` flag is false.
   */
  const toggleRentalMode = (mode: "selfDrive" | "withDriver") => {
    setFormData((prev) => {
      const field = mode === "selfDrive" ? "selfDriveEnabled" : "withDriverEnabled";
      const other = mode === "selfDrive" ? "withDriverEnabled" : "selfDriveEnabled";
      const next = !prev[field];
      return { ...prev, [field]: next, ...(next ? { [other]: false } : {}) };
    });
  };

  const toggleTripDirection = (which: "oneWay" | "twoWay") => {
    const field = which === "oneWay" ? "withDriverOneWay" : "withDriverTwoWay";
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const setPricingField = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const addListItem = (field: VehicleListField) =>
    setFormData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  const updateListItem = (field: VehicleListField, index: number, value: string) =>
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  const removeListItem = (field: VehicleListField, index: number) =>
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));

  // ─── Step 6 handlers ──────────────────────────────────────────────────
  const setComplianceField = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const DOC_LIMIT = 4;
  const DOC_MAX_BYTES = 5 * 1024 * 1024;
  // Kept in step with the `accept` attribute on the document inputs — the input
  // used to allow `image/*`, so the picker cheerfully offered a WEBP or HEIC
  // scan and this list then rejected it.
  const DOC_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

  /**
   * Documents step upload.
   *
   * `Array.from(files)` happens HERE, synchronously, not inside the setFormData
   * updater. A FileList is a live view onto the input element, and the dropzone
   * resets `input.value = ""` right after calling this (so re-picking the same
   * file fires change again) — which empties the list. React invokes a state
   * updater during the re-render, i.e. after that reset, so reading the FileList
   * in there saw zero files and every upload silently no-oped.
   *
   * Validation and its toasts are out here too: a state updater has to be pure,
   * and under StrictMode it runs twice — which would have doubled every
   * rejection toast.
   */
  const handleDocUpload = (field: VehicleDocField, files: FileList | null) => {
    if (!files || files.length === 0) return;

    // 1. Snapshot the live FileList before anything can clear the input.
    const picked = Array.from(files);

    // 2. Is there room? Read the pre-click list off the ref, which tracks
    //    formData every render.
    const already = (formDataRef.current[field] as (string | File)[]) || [];
    const remaining = DOC_LIMIT - already.length;
    if (remaining <= 0) {
      toast.error(`You can upload up to ${DOC_LIMIT} documents here`);
      return;
    }

    // 3. Validate, reporting each rejection by name.
    const accepted = picked.filter((file) => {
      if (!DOC_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG, WEBP or PDF is allowed`);
        return false;
      }
      if (file.size > DOC_MAX_BYTES) {
        toast.error(`${file.name}: file must be under 5 MB`);
        return false;
      }
      return true;
    });
    if (accepted.length === 0) return;

    if (accepted.length > remaining) {
      toast.error(`Only ${remaining} more document${remaining === 1 ? "" : "s"} could be added`);
    }

    // 4. Commit. The updater re-derives the slot count from `prev` rather than
    //    trusting `remaining`, so two pickers firing in the same tick can't
    //    both write past the limit.
    setFormData((prev) => {
      const currentFiles = prev[field] || [];
      const slots = DOC_LIMIT - currentFiles.length;
      if (slots <= 0) return prev;
      return { ...prev, [field]: [...currentFiles, ...accepted.slice(0, slots)] };
    });
    clearError(field);
  };

  const removeDoc = (field: VehicleDocField, index: number) =>
    setFormData((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

  // ─── Step 8 handlers ──────────────────────────────────────────────────
  const handleUploadIDProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, or PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be under 5 MB.");
      return;
    }

    setIdProofImage(URL.createObjectURL(file));
    setFormData((prev) => ({ ...prev, idPhotos: [file] }));
    clearError("idPhotos");
  };

  // ─── Map sources ──────────────────────────────────────────────────────
  const mapQuery = `${formData.address || ""} ${formData.city || ""} ${formData.state || ""} ${formData.pincode || ""} India`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  const businessMapQuery = `${formData.businessCity || ""} ${formData.businessState || ""} ${formData.businessPincode || ""} India`;
  const mapSrcbusiness = `https://www.google.com/maps?q=${encodeURIComponent(businessMapQuery)}&output=embed`;

  // ─── Discount offers mapping for shared DiscountOffersStep ────────────
  const discountOffers = {
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

  const DISCOUNT_PREFIX: Record<string, string> = {
    firstUser: "firstUserDiscount",
    festival: "festivalOffers",
    weekly: "weeklyMonthlyOffers",
    special: "specialOffers",
  };

  const handleDiscountToggle = (key: string) => {
    const field = DISCOUNT_PREFIX[key];
    if (field) setFormData((prev) => ({ ...prev, [field]: !(prev as any)[field] }));
  };

  const handleDiscountOfferChange = (key: string, field: keyof DiscountOffer, value: string) => {
    const prefix = DISCOUNT_PREFIX[key];
    if (!prefix) return;
    const suffix = { type: "Type", value: "Value", finalPrice: "FinalPrice" }[field as string];
    if (!suffix) return;

    const formField = prefix + suffix;
    setFormData((prev) => ({ ...prev, [formField]: value }));
    if (errors[formField]) clearError(formField);
  };

  const discountErrors: Record<string, string> = {};
  if (errors.firstUserDiscountValue) discountErrors.firstUserValue = errors.firstUserDiscountValue;
  if (errors.firstUserDiscountFinalPrice)
    discountErrors.firstUserFinalPrice = errors.firstUserDiscountFinalPrice;
  if (errors.festivalOffersValue) discountErrors.festivalValue = errors.festivalOffersValue;
  if (errors.festivalOffersFinalPrice)
    discountErrors.festivalFinalPrice = errors.festivalOffersFinalPrice;
  if (errors.weeklyMonthlyOffersValue) discountErrors.weeklyValue = errors.weeklyMonthlyOffersValue;
  if (errors.weeklyMonthlyOffersFinalPrice)
    discountErrors.weeklyFinalPrice = errors.weeklyMonthlyOffersFinalPrice;
  if (errors.specialOffersValue) discountErrors.specialValue = errors.specialOffersValue;
  if (errors.specialOffersFinalPrice)
    discountErrors.specialFinalPrice = errors.specialOffersFinalPrice;

  // ─── Business details mapping for shared BusinessDetailsStep ──────────
  const handleBusinessFieldChange = (field: string, value: string) => {
    const fieldMap: Record<string, string> = {
      brandName: "brandName",
      companyName: "legalCompanyName",
      gstNumber: "gstNumber",
      businessEmail: "businessEmailId",
      businessPhone: "businessPhoneNumber",
      businessAddress: "businessAddress",
      pincode: "businessPincode",
    };
    const formField = fieldMap[field] || field;
    setFormData((prev) => ({ ...prev, [formField]: value }));

    const errorKeyMap: Record<string, string> = {
      brandName: "brandName",
      companyName: "legalCompanyName",
      businessAddress: "businessAddress",
      businessPhone: "businessPhoneNumber",
      pincode: "businessPincode",
    };
    const errorField = errorKeyMap[field];
    if (errorField && errors[errorField]) {
      setErrors((prev) => ({ ...prev, [errorField]: "" }));
    }
  };

  const businessErrors: Record<string, string> = {};
  if (errors.brandName) businessErrors.brandName = errors.brandName;
  if (errors.legalCompanyName) businessErrors.companyName = errors.legalCompanyName;
  if (errors.businessAddress) businessErrors.businessAddress = errors.businessAddress;
  if (errors.businessState) businessErrors.state = errors.businessState;
  if (errors.businessCity) businessErrors.city = errors.businessCity;
  if (errors.businessPincode) businessErrors.businessPincode = errors.businessPincode;
  if (errors.businessPhoneNumber) businessErrors.businessPhone = errors.businessPhoneNumber;

  // ─── Personal details mapping for shared PersonalDetailsStep ──────────
  const handlePersonalFieldChange = (field: string, value: string) => {
    const fieldMap: Record<string, string> = {
      firstName: "firstName",
      lastName: "lastName",
      pincode: "personalPincode",
      dateOfBirth: "dateOfBirth",
      maritalStatus: "maritalStatus",
      idProof: "idProof",
    };
    const formField = fieldMap[field] || field;
    setFormData((prev) => ({ ...prev, [formField]: value }));
    if (errors[formField]) clearError(formField);
  };

  const canProceed = currentStep === TOTAL_STEPS - 1 ? formData.termsAccepted : true;

  // These screens render outside OnboardingLayout, so they carry their own
  // data-onboarding scope to pick up the same palette as the wizard.
  if (isStatusLoading) {
    return (
      <div
        data-onboarding
        className="min-h-screen flex items-center justify-center bg-[color:var(--onb-page-bg,#efeeea)]"
      >
        <div className="flex flex-col items-center gap-3">
          <div
            role="status"
            aria-label="Loading"
            className="w-10 h-10 rounded-full border-2 border-th-brand border-t-transparent animate-spin"
          />
          <p className="text-sm text-th-warm-text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (crossTypePending) {
    const otherLabel =
      { activity: "activity", stay: "unique stay", caravan: "caravan" }[crossTypePending.type] ||
      "listing";
    return (
      <div
        data-onboarding
        className="min-h-screen flex items-center justify-center bg-[color:var(--onb-page-bg,#efeeea)] px-4"
      >
        <div className="bg-th-surface-0 rounded-[18px] border border-[color:var(--onb-card-border)] shadow-[var(--onb-card-shadow)] p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-[16px] bg-th-warn-bright-bg border border-th-warn-bright-border flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-th-warn-bright" strokeWidth={2} />
          </div>
          <h2 className="font-serif text-[23px] font-normal text-th-text-primary tracking-[-0.02em] mb-2">
            You already have a listing pending review
          </h2>
          <p className="text-[14px] leading-[1.6] text-[color:var(--onb-text-secondary,#657477)] mb-5">
            Your {otherLabel} listing is awaiting admin approval. You can add a vehicle rental
            listing once that's approved or rejected.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate(`/onboarding/${crossTypePending.type}`)}
              className="onb-btn-primary w-full rounded-full py-3.5 text-[14px]"
            >
              View {otherLabel} listing
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="onb-btn-secondary w-full rounded-full py-3.5 text-[14px]"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "pending" && !bypassPendingGate) {
    return (
      <div
        data-onboarding
        className="min-h-screen flex items-center justify-center bg-[color:var(--onb-page-bg,#efeeea)] px-4"
      >
        <div className="bg-th-surface-0 rounded-[18px] border border-[color:var(--onb-card-border)] shadow-[var(--onb-card-shadow)] p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-[16px] bg-th-warn-bright-bg border border-th-warn-bright-border flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-th-warn-bright" strokeWidth={2} />
          </div>
          <h2 className="font-serif text-[23px] font-normal text-th-text-primary tracking-[-0.02em] mb-2">
            Application under review
          </h2>
          <p className="text-[14px] leading-[1.6] text-[color:var(--onb-text-secondary,#657477)] mb-5">
            Your vehicle rental listing has been submitted and is being reviewed by our team. We'll
            notify you once it's approved.
          </p>
          {formData.name && (
            <div className="inline-flex items-center gap-2 bg-th-brand-soft border border-th-brand-border-soft rounded-full pl-3 pr-4 py-2 mb-6">
              <Car className="w-4 h-4 text-th-brand shrink-0" strokeWidth={2} />
              <span className="text-[13.5px] font-semibold text-th-text-primary">
                {formData.name}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setBypassPendingGate(true)}
              className="onb-btn-primary w-full rounded-full py-3.5 text-[14px]"
            >
              Edit Details
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="onb-btn-secondary w-full rounded-full py-3.5 text-[14px]"
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate("/onboarding/service-selection")}
              className="onb-btn-secondary w-full rounded-full py-3.5 text-[14px]"
            >
              Submit Another Service
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      phases={VEHICLE_PHASES}
      preview={
        // Steps 0-4 are the listing content a guest sees; the document and
        // account steps that follow don't change the card, so the preview panel
        // drops away rather than sitting there inert. (0-5 before the identity
        // and photos steps merged.)
        currentStep <= 4 ? (
          <VehicleCardPreview
            /* Derived, not `formData.name`/`.description` — those inputs were
               removed from step 0, so the card would sit on its "Your vehicle
               name" placeholder for the whole flow. Same helpers the submit
               payload uses, so the preview is what gets published. */
            name={deriveVehicleName(formData)}
            description={deriveVehicleDescription(formData)}
            coverImage={formData.coverImage}
            photos={formData.photos}
            city={deriveVehicleLocation(formData).city}
            state={deriveVehicleLocation(formData).state}
            brand={formData.brand}
            model={formData.model}
            seatingCapacity={formData.seatingCapacity}
            fuelType={formData.fuelType}
            transmission={formData.transmission}
            airConditioned={formData.airConditioned}
            headlineRate={baseRate}
            selfDriveEnabled={formData.selfDriveEnabled}
            withDriverEnabled={formData.withDriverEnabled}
            activeDiscount={pickActiveDiscount(formData)}
          />
        ) : undefined
      }
      isLoading={isLoading}
      canProceed={canProceed}
      termsAccepted={formData.termsAccepted}
      onBack={handleBack}
      onNext={handleNext}
    >
      {rejectionReason && currentStep === 0 && (
        <div className="w-full max-w-2xl mb-4 px-4 py-3.5 rounded-[12px] border-[1.5px] border-th-error-bright-soft bg-th-error-bright-bg">
          <p className="text-[12.5px] font-bold text-th-error-bright mb-1">
            Your previous submission was rejected
          </p>
          <p className="text-[12.5px] text-th-error-bright leading-[1.55]">{rejectionReason}</p>
        </div>
      )}

      <VehicleStepRenderer
        step={currentStep}
        api={{
          formData,
          setFormData,
          errors,
          setErrors,
          sliderRef,
          addRule,
          removeRule,
          updateRule,
          handleFileUpload,
          handleCoverFileUpload,
          removeFile,
          removeCoverFile,
          clearError,
          dynamicCategories,
          categoriesLoading: vehicleFeaturesLoading,
          dynamicFeatures,
          featuresLoading: vehicleFeaturesLoading,
          customFeatures,
          showCustomFeaturesInput,
          setShowCustomFeaturesInput,
          customFeatureInput,
          setCustomFeatureInput,
          toggleFeature,
          handleRemoveCustomFeature,
          handleAddCustomFeature,
          locationData: data,
          adjustCapacity,
          setPickupPoint,
          toggleRentalMode,
          toggleTripDirection,
          setPricingField,
          addListItem,
          updateListItem,
          removeListItem,
          discountOffers,
          handleDiscountToggle,
          handleDiscountOfferChange,
          discountErrors,
          setComplianceField,
          handleDocUpload,
          removeDoc,
          businessErrors,
          handleBusinessFieldChange,
          selected,
          setSelected,
          open,
          setOpen,
          countries,
          mapSrcbusiness,
          handlePersonalFieldChange,
          idProofImage,
          handleUploadIDProof,
          uploadError,
        }}
      />
    </OnboardingLayout>
  );
};

export default VehicleOnboarding;
