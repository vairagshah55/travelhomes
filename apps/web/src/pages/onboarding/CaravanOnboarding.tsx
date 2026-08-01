import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Country } from "country-state-city";
import { MoreHorizontal, Clock, Home } from "lucide-react";
import { cmsPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { submitOnboardingData, getOnboardingData } from "@/lib/api";
import { useCountriesData } from "@/hooks/useCountriesData";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useFeatures } from "@/hooks/useFeatures";
import { onboardingService } from "@/lib/onboardingService";
import { useAuth } from "../../contexts/AuthContext";
import { useUserDetails } from "@/hooks/useUserDetails";

// Shared components
import {
  OnboardingLayout,
  BusinessDetailsStep,
  PersonalDetailsStep,
  TermsConditionsStep,
  DiscountOffersStep,
} from "@/components/onboarding/shared";
import type { CountryOption, DiscountOffer } from "@/components/onboarding/shared";

// Caravan-specific step components
import {
  DescriptionStep,
  CategoryStep,
  FeaturesStep,
  CapacityAddressStep,
  PricingStep,
  CaravanCardPreview,
} from "@/components/onboarding/caravan";
import {
  FormData,
  defaultCaravanFormData,
  pickActiveDiscount,
} from "@/components/onboarding/caravan/caravanConfig";
import { submitCaravanOnboarding } from "@/components/onboarding/caravan/submitCaravanOnboarding";
import { validateCaravanStep } from "@/components/onboarding/caravan/validateCaravanStep";
import { loadCaravanDraft } from "@/components/onboarding/caravan/loadCaravanDraft";
import { CaravanStepRenderer } from "@/components/onboarding/caravan/CaravanStepRenderer";

const countries: CountryOption[] = Country.getAllCountries().map((c) => ({
  isoCode: c.isoCode,
  name: c.name,
  countryCode: c.isoCode,
  dialCode: c.phonecode,
}));

const CaravanOnboarding = () => {
  const navigate = useNavigate();
  const { updateUserType, isAuthenticated } = useAuth();

  const { data: homepageSections } = useHomepageSections();
  useEffect(() => {
    if (homepageSections) {
      const section = (homepageSections as any[]).find((s: any) => s.sectionKey === "camper-van");
      if (section && !section.isVisible) {
        toast.error("Caravan onboarding is currently disabled.");
        navigate("/");
      }
    }
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [isAuthenticated, navigate, homepageSections]);

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem("caravan_onboarding_step");
    return saved ? parseInt(saved, 10) : 0;
  });
  const sliderRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem("caravan_onboarding_step", String(currentStep));
  }, [currentStep]);

  const FORM_STORAGE_KEY = "caravan_onboarding_form";

  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (saved) return { ...defaultCaravanFormData, ...JSON.parse(saved) };
    } catch {}
    return defaultCaravanFormData;
  });

  // Persist form data on every change (File objects are excluded — they can't be serialised)
  useEffect(() => {
    try {
      const serialisable = {
        ...formData,
        photos: formData.photos.filter((p) => typeof p === "string"),
        coverImage: formData.coverImage.filter((p) => typeof p === "string"),
        idPhotos: formData.idPhotos.filter((p) => typeof p === "string"),
      };
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(serialisable));
    } catch {}
  }, [formData]);

  const [selected, setSelected] = useState<CountryOption | null>(countries[100]);
  const [open, setOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 9;
  const completedSteps = currentStep;
  const data = useCountriesData();
  const [idProofImage, setIdProofImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [dynamicFeatures, setDynamicFeatures] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  const { userDetails, loading: userDetailsLoading, updateUserDetails } = useUserDetails();

  // Camper Van features (cached + shared with other consumers).
  const { data: camperVanFeatures } = useFeatures("Camper Van");
  useEffect(() => {
    if (!camperVanFeatures) return;
    const enabled = camperVanFeatures.filter((f: any) => f.status === "enable");
    setDynamicCategories(enabled.filter((f: any) => f.type === "category"));
    setDynamicFeatures(enabled.filter((f: any) => f.type === "feature" || !f.type));
  }, [camperVanFeatures]);

  // Load the draft / approved-resubmit reset exactly once per mount, after the
  // userDetails query has settled. Re-running on every userDetails identity
  // change would replace formData while the user is typing — wiping input.
  const draftLoadedRef = useRef(false);
  useEffect(() => {
    if (draftLoadedRef.current) return;
    if (userDetailsLoading) return;
    draftLoadedRef.current = true;
    loadCaravanDraft({
      setFormData,
      setCurrentStep,
      setIdProofImage,
      setStatus,
      setRejectionReason,
      setIsStatusLoading,
      userDetails,
      formStorageKey: FORM_STORAGE_KEY,
      stepStorageKey: "caravan_onboarding_step",
    });
  }, [userDetailsLoading, userDetails]);

  // Auto-calculate final prices for discounts
  useEffect(() => {
    if (currentStep === 5) {
      setFormData((prev) => {
        const basePrice = parseFloat(prev.perDayCharge) || parseFloat(prev.perKmCharge) || 0;
        const newData = { ...prev };
        let changed = false;

        // Only auto-seed when basePrice is known AND the field is still empty
        // (never override a value the user has manually entered)
        if (basePrice <= 0) return prev;

        const calculateFinal = (type: string, value: string) => {
          const val = parseFloat(value) || 0;
          if (type === "percentage") {
            return Math.max(0, basePrice - (basePrice * val) / 100).toFixed(0);
          } else {
            return Math.max(0, basePrice - val).toFixed(0);
          }
        };

        if (prev.firstUserDiscount && !prev.firstUserDiscountFinalPrice) {
          const final = calculateFinal(prev.firstUserDiscountType, prev.firstUserDiscountValue);
          newData.firstUserDiscountFinalPrice = final;
          changed = true;
        }

        if (prev.festivalOffers && !prev.festivalOffersFinalPrice) {
          const final = calculateFinal(prev.festivalOffersType, prev.festivalOffersValue);
          newData.festivalOffersFinalPrice = final;
          changed = true;
        }

        if (prev.weeklyMonthlyOffers && !prev.weeklyMonthlyOffersFinalPrice) {
          const final = calculateFinal(prev.weeklyMonthlyOffersType, prev.weeklyMonthlyOffersValue);
          newData.weeklyMonthlyOffersFinalPrice = final;
          changed = true;
        }

        if (prev.specialOffers && !prev.specialOffersFinalPrice) {
          const final = calculateFinal(prev.specialOffersType, prev.specialOffersValue);
          newData.specialOffersFinalPrice = final;
          changed = true;
        }

        return changed ? newData : prev;
      });
    }
  }, [
    currentStep,
    formData.perDayCharge,
    formData.perKmCharge,
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

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/onboarding/service-selection");
    }
  };

  const handleNext = () => {
    const { errors: newErrors, toastError } = validateCaravanStep(currentStep, formData);
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

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () =>
    submitCaravanOnboarding(formData, {
      setIsLoading,
      updateUserDetails,
      updateUserType,
      navigate,
      formStorageKey: FORM_STORAGE_KEY,
    });

  // --- Handler functions ---

  const addRule = () => {
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, ""],
    }));
  };
  const removeRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const updateRule = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) => (i === index ? value : rule)),
    }));
  };

  const addPriceItem = (
    field: "perKmIncludes" | "perKmExcludes" | "perDayIncludes" | "perDayExcludes",
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const updatePriceItem = (
    field: "perKmIncludes" | "perKmExcludes" | "perDayIncludes" | "perDayExcludes",
    index: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const removePriceItem = (
    field: "perKmIncludes" | "perKmExcludes" | "perDayIncludes" | "perDayExcludes",
    index: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const adjustCapacity = (type: "seating" | "sleeping", direction: "increase" | "decrease") => {
    const field = type === "seating" ? "seatingCapacity" : "sleepingCapacity";
    setFormData((prev) => ({
      ...prev,
      [field]: direction === "increase" ? prev[field] + 1 : Math.max(1, prev[field] - 1),
    }));
  };

  const handleFileUpload = (field: "photos" | "idPhotos", files: FileList | null) => {
    if (!files) return;

    setFormData((prev) => {
      const currentFiles = prev[field] || [];
      const remainingSlots = 15 - currentFiles.length;
      if (files.length > remainingSlots) {
        toast.error("Upload limit exceeded!");
        return prev;
      }
      const newFiles = Array.from(files).slice(0, remainingSlots);
      const updatedFiles = [...currentFiles, ...newFiles];
      return {
        ...prev,
        [field]: updatedFiles,
      };
    });
  };
  const handleCoverFileUpload = (field: "coverImage", files: FileList | null) => {
    if (!files) return;

    setFormData((prev) => {
      const currentFiles = prev[field] || [];
      const remainingSlots = 2 - currentFiles.length;
      if (files.length > remainingSlots) {
        toast.error("Upload limit exceeded!");
        return prev;
      }
      const newFiles = Array.from(files).slice(0, remainingSlots);
      const updatedFiles = [...currentFiles, ...newFiles];
      return {
        ...prev,
        [field]: updatedFiles,
      };
    });
  };

  const removeCoverFile = (field: "coverImage", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };
  const removeFile = (field: "photos" | "idPhotos", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleUploadIDProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError("");
    setFileName("");

    if (file) {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        setUploadError("Only JPG, PNG, or PDF files are allowed.");
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (file.size > maxSize) {
        setUploadError("File size must be under 5 MB.");
        return;
      }

      setFileName(file.name);
      setIdProofImage(URL.createObjectURL(file));

      setFormData((prev) => ({
        ...prev,
        idPhotos: [file],
      }));

      if (errors.idPhotos) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.idPhotos;
          return newErrors;
        });
      }
    }
  };

  const [customFeatures, setCustomFeatures] = useState<{ name: string; icon: any }[]>([]);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // --- Map sources ---
  const mapQuery = `${formData.address || ""} ${formData.city || ""} ${formData.state || ""} ${formData.pincode || ""} India`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  const businessMapQuery = `${formData.businessCity || ""} ${formData.businessState || ""} ${formData.businessPincode || ""} India`;
  const mapSrcbusiness = `https://www.google.com/maps?q=${encodeURIComponent(businessMapQuery)}&output=embed`;

  // --- Discount offers mapping for shared DiscountOffersStep ---
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

  const handleDiscountToggle = (key: string) => {
    const fieldMap: Record<string, string> = {
      firstUser: "firstUserDiscount",
      festival: "festivalOffers",
      weekly: "weeklyMonthlyOffers",
      special: "specialOffers",
    };
    const field = fieldMap[key];
    if (field) {
      setFormData((prev) => ({ ...prev, [field]: !(prev as any)[field] }));
    }
  };

  const handleDiscountOfferChange = (key: string, field: keyof DiscountOffer, value: string) => {
    const fieldPrefixMap: Record<string, string> = {
      firstUser: "firstUserDiscount",
      festival: "festivalOffers",
      weekly: "weeklyMonthlyOffers",
      special: "specialOffers",
    };
    const prefix = fieldPrefixMap[key];
    if (!prefix) return;

    const fieldSuffixMap: Record<string, string> = {
      type: "Type",
      value: "Value",
      finalPrice: "FinalPrice",
    };
    const suffix = fieldSuffixMap[field];
    if (!suffix) return;

    const formField = prefix + suffix;
    setFormData((prev) => ({ ...prev, [formField]: value }));

    // Clear corresponding error
    const errorKeyMap: Record<string, Record<string, string>> = {
      firstUser: { Value: "firstUserDiscountValue", FinalPrice: "firstUserDiscountFinalPrice" },
      festival: { Value: "festivalOffersValue", FinalPrice: "festivalOffersFinalPrice" },
      weekly: { Value: "weeklyMonthlyOffersValue", FinalPrice: "weeklyMonthlyOffersFinalPrice" },
      special: { Value: "specialOffersValue", FinalPrice: "specialOffersFinalPrice" },
    };
    const errorField = errorKeyMap[key]?.[suffix];
    if (errorField && errors[errorField]) {
      clearError(errorField);
    }
  };

  // --- Discount validation errors mapping for shared DiscountOffersStep ---
  const discountErrors: Record<string, string> = {};
  // Map caravan formData error keys to DiscountOffersStep error key format
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

  // --- Business details mapping for shared BusinessDetailsStep ---
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

    // Map error keys back
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

  // --- Personal details mapping for shared PersonalDetailsStep ---
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

    // Clear errors
    const errorKeyMap: Record<string, string> = {
      firstName: "firstName",
      lastName: "lastName",
      pincode: "personalPincode",
      dateOfBirth: "dateOfBirth",
      maritalStatus: "maritalStatus",
      idProof: "idProof",
    };
    const errorField = errorKeyMap[field];
    if (errorField && errors[errorField]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorField];
        return newErrors;
      });
    }
  };

  // --- Custom features handlers ---
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
      // Avoid duplicates
      if (formData.features.includes(newFeatureName)) {
        toast.error("This feature already exists");
        return;
      }
      setCustomFeatures((prev) => [...prev, { name: newFeatureName, icon: MoreHorizontal }]);
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeatureName],
      }));
      setCustomFeatureInput("");
    }
  };

  // --- canProceed helper for OnboardingLayout ---
  const canProceed = (() => {
    if (currentStep === 8) return formData.termsAccepted;
    return true;
  })();

  // --- Render step content ---

  if (isStatusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#117479] border-t-transparent animate-spin" />
          <p className="text-sm text-[#888780]">Loading…</p>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E4DC] p-8 max-w-md w-full text-center">
          <Clock className="w-12 h-12 text-[#F59E0B] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">Application Under Review</h2>
          <p className="text-sm text-[#888780] mb-4">
            Your camper van listing has been submitted and is being reviewed by our team. We'll
            notify you once it's approved.
          </p>
          {formData.name && (
            <div className="inline-flex items-center gap-2 bg-[#F7F8FA] rounded-full px-4 py-2 mb-6">
              <Home className="w-4 h-4 text-[#117479]" />
              <span className="text-sm font-medium text-[#1a1a1a]">{formData.name}</span>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-[#117479] text-white rounded-xl py-3 text-sm font-medium hover:bg-[#145189] transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/onboarding")}
              className="w-full border border-[#E8E4DC] text-[#1a1a1a] rounded-xl py-3 text-sm font-medium hover:bg-[#F7F8FA] transition-colors"
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
      totalSteps={totalSteps}
      preview={
        currentStep <= 5 ? (
          <CaravanCardPreview
            name={formData.name}
            description={formData.description}
            coverImage={formData.coverImage}
            photos={formData.photos}
            city={formData.city}
            state={formData.state}
            perDayCharge={formData.perDayCharge}
            perKmCharge={formData.perKmCharge}
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
      <CaravanStepRenderer
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
          dynamicFeatures,
          customFeatures,
          showCustomFeaturesInput,
          setShowCustomFeaturesInput,
          customFeatureInput,
          setCustomFeatureInput,
          toggleFeature,
          handleRemoveCustomFeature,
          handleAddCustomFeature,
          locationData: data,
          mapSrc,
          adjustCapacity,
          addPriceItem,
          updatePriceItem,
          removePriceItem,
          discountOffers,
          handleDiscountToggle,
          handleDiscountOfferChange,
          discountErrors,
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

export default CaravanOnboarding;
