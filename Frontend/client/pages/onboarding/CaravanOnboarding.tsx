import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Country } from "country-state-city";
import { MoreHorizontal } from "lucide-react";
import { cmsPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { submitOnboardingData, getOnboardingData } from "@/lib/api";
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
} from "./components/shared";
import type { CountryOption, DiscountOffer } from "./components/shared";

// Caravan-specific step components
import {
  DescriptionStep,
  CategoryStep,
  FeaturesStep,
  CapacityAddressStep,
  PricingStep,
} from "./components/caravan";

const countries: CountryOption[] = Country.getAllCountries().map((c) => ({
  isoCode: c.isoCode,
  name: c.name,
  countryCode: c.isoCode,
  dialCode: c.phonecode,
}));

interface FormData {
  // Step 0 - Caravan Descriptions
  name: string;
  description: string;
  rules: string[];
  photos: (string | File)[];
  coverImage: (string | File)[];

  // Step 1 - Camper Van Category
  category: string | null;

  // Step 2 - Features
  features: string[];

  // Step 3 - Capacity and Address
  seatingCapacity: number;
  sleepingCapacity: number;
  address:string;
  locality: string;
  state: string;
  city: string;
  pincode: string;

  // Step 4 - Pricing
  perKmCharge: string;
  perDayCharge: string;
  perKmIncludes: string[];
  perKmExcludes: string[];
  perDayIncludes: string[];
  perDayExcludes: string[];
  priceIncludes: string[];
  priceExcludes: string[];

  // Step 5 - Types of Discount
  firstUserDiscount: boolean;
  firstUserDiscountType: "percentage" | "fixed";
  firstUserDiscountValue: string;
  firstUserDiscountFinalPrice: string;

  festivalOffers: boolean;
  festivalOffersType: "percentage" | "fixed";
  festivalOffersValue: string;
  festivalOffersFinalPrice: string;

  weeklyMonthlyOffers: boolean;
  weeklyMonthlyOffersType: "percentage" | "fixed";
  weeklyMonthlyOffersValue: string;
  weeklyMonthlyOffersFinalPrice: string;

  specialOffers: boolean;
  specialOffersType: "percentage" | "fixed";
  specialOffersValue: string;
  specialOffersFinalPrice: string;

  // Step 6 - Business Details
  brandName: string;
  legalCompanyName: string;
  gstNumber: string;
  businessEmailId: string;
  businessPhoneNumber: string;
  businessAddress:string;
  businessLocality: string;
  personalLocality: string;
  businessState: string;
  businessCity: string;
  businessPincode: string;

  // Step 7 - Personal Details
  firstName: string;
  lastName: string;
  personalState: string;
  personalCity: string;
  personalPincode: string;
  dateOfBirth: string;
  maritalStatus: string;
  idProof: string;
  idPhotos: (string | File)[];
  termsAccepted: boolean;
}

const CaravanOnboarding = () => {
  const navigate = useNavigate();
  const { updateUserType, isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Check if Caravan section is enabled
    cmsPublicApi.listHomepageSections().then((sections) => {
      const section = sections.find((s: any) => s.sectionKey === 'camper-van');
      if (section && !section.isVisible) {
        toast.error("Caravan onboarding is currently disabled.");
        navigate("/");
      }
    }).catch(console.error);

    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const [currentStep, setCurrentStep] = useState(0);
  const sliderRef = useRef(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    rules: [],
    photos: [],
    coverImage:[],
    category: null,
    features: [],
    seatingCapacity: 1,
    sleepingCapacity: 0,
    address:'',
    locality: "India",
    state: "",
    city: "",
    pincode: "",
    perKmCharge: "",
    perDayCharge: "",
    perKmIncludes: [],
    perKmExcludes: [],
    perDayIncludes: [],
    perDayExcludes: [],
    priceIncludes: [],
    priceExcludes: [],
    // Step 5
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

    brandName: "",
    legalCompanyName: "",
    gstNumber: "",
    businessEmailId: "",
    businessPhoneNumber: "",
    businessAddress:"",
    businessLocality: "India",
    personalLocality: "India",
    businessState: "",
    businessCity: "",
    businessPincode: "",
    firstName: "",
    lastName: "",
    personalState: "",
    personalCity: "",
    personalPincode: "",
    dateOfBirth: "",
    maritalStatus: "",
    idProof: "",
    idPhotos: [],
    termsAccepted: false,
  });
  console.log("Form Data:", formData);
  const [selected, setSelected] = useState<CountryOption | null>(
    countries[100],
  );
  const [open, setOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 9;
  const completedSteps = currentStep;
  const [data, setData] = useState([]);
  const [idProofImage, setIdProofImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [dynamicFeatures, setDynamicFeatures] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");


  const { userDetails, updateUserDetails } = useUserDetails();

  // Populate country list on mount
  useEffect(() => {
    fetch("/countries_states_cities.json") // remove ../../.. for public/ path
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Failed to load countries:", err));

      // Fetch admin features
      cmsPublicApi.getFeatures("Camper Van").then(list => {
        const enabled = list.filter((f: any) => f.status === 'enable');
        setDynamicCategories(enabled.filter((f: any) => f.type === 'category'));
        setDynamicFeatures(enabled.filter((f: any) => f.type === 'feature' || !f.type));
      }).catch(console.error);

      // Check for existing data
      const loadExistingData = async () => {
        try {
          const data = await getOnboardingData();
          console.log("Fetched Onboarding Data:", data);

          if (data) {
            console.log("Data Type:", data.type);
            console.log("Has Doc:", !!data.doc);
            if (data.doc) {
              console.log("Doc Status:", data.doc.status);
              console.log("Full Doc Object:", data.doc);
            }
          }

          if (data && data.type === 'caravan' && data.doc && ['pending', 'draft', 'rejected'].includes(data.doc.status)) {
            const doc = data.doc;
            console.log('Loading existing caravan data into form:', doc);

            // Debug specific fields if they are missing
            console.log("Mapping fields - Name:", doc.name, "Category:", doc.category, "Photos:", doc.photos);

            console.log("Business Details (Draft):", {
              brandName: doc.brandName,
              legalCompanyName: doc.legalCompanyName,
              businessEmailId: doc.businessEmailId,
              businessPhoneNumber: doc.businessPhoneNumber,
              businessAddress: {
                locality: doc.businessLocality,
                state: doc.businessState,
                city: doc.businessCity,
                pincode: doc.businessPincode
              }
            });

            console.log("Personal Details (Draft):", {
              firstName: doc.firstName,
              lastName: doc.lastName,
              personalState: doc.personalState,
              personalCity: doc.personalCity,
              personalPincode: doc.personalPincode,
              dateOfBirth: doc.dateOfBirth,
              maritalStatus: doc.maritalStatus,
              idProof: doc.idProof
            });

            setFormData(prev => ({
              ...prev,
              name: doc.name || "",
              description: doc.description || "",
              rules: doc.rules || [],
              photos: Array.isArray(doc.photos) ? doc.photos : [],
              coverImage: Array.isArray(doc.coverImage) ? doc.coverImage : (typeof doc.coverImage === 'string' ? [doc.coverImage] : []),
              category: doc.category || null,
              features: doc.features || [],
              seatingCapacity: doc.seatingCapacity || 1,
              sleepingCapacity: doc.sleepingCapacity || 0,
              address: doc.address || "",
              locality: doc.locality || "India",
              state: doc.state || "",
              city: doc.city || "",
              pincode: doc.pincode || "",
              perKmCharge: String(doc.perKmCharge || ""),
              perDayCharge: String(doc.perDayCharge || ""),
              perKmIncludes: doc.perKmIncludes || [],
              perKmExcludes: doc.perKmExcludes || [],
              perDayIncludes: doc.perDayIncludes || [],
              perDayExcludes: doc.perDayExcludes || [],
              priceIncludes: doc.priceIncludes || [],
              priceExcludes: doc.priceExcludes || [],

              firstUserDiscount: doc.firstUserDiscount ?? false,
              firstUserDiscountType: doc.firstUserDiscountType || "percentage",
              firstUserDiscountValue: String(doc.firstUserDiscountValue || ""),
              firstUserDiscountFinalPrice: String(doc.firstUserDiscountFinalPrice || ""),

              festivalOffers: doc.festivalOffers ?? false,
              festivalOffersType: doc.festivalOffersType || "percentage",
              festivalOffersValue: String(doc.festivalOffersValue || ""),
              festivalOffersFinalPrice: String(doc.festivalOffersFinalPrice || ""),

              weeklyMonthlyOffers: doc.weeklyMonthlyOffers ?? false,
              weeklyMonthlyOffersType: doc.weeklyMonthlyOffersType || "percentage",
              weeklyMonthlyOffersValue: String(doc.weeklyMonthlyOffersValue || ""),
              weeklyMonthlyOffersFinalPrice: String(doc.weeklyMonthlyOffersFinalPrice || ""),

              specialOffers: doc.specialOffers ?? false,
              specialOffersType: doc.specialOffersType || "percentage",
              specialOffersValue: String(doc.specialOffersValue || ""),
              specialOffersFinalPrice: String(doc.specialOffersFinalPrice || ""),

              brandName: doc.brandName || "",
              legalCompanyName: doc.legalCompanyName || "",
              gstNumber: doc.gstNumber || "",
              businessEmailId: doc.businessEmailId || "",
              businessPhoneNumber: doc.businessPhoneNumber || "",
              businessLocality: doc.businessLocality || "India",
              personalLocality: doc.personalLocality || "India",
              businessState: doc.businessState || "",
              businessCity: doc.businessCity || "",
              businessPincode: doc.businessPincode || "",

              firstName: doc.firstName || "",
              lastName: doc.lastName || "",
              personalState: doc.personalState || "",
              personalCity: doc.personalCity || "",
              personalPincode: doc.personalPincode || "",
              dateOfBirth: doc.dateOfBirth || "",
              maritalStatus: doc.maritalStatus || "",
              idProof: doc.idProof || "",
              idPhotos: (Array.isArray(doc.idPhotos) && doc.idPhotos.length > 0)
                  ? doc.idPhotos
                  : [],

              termsAccepted: false,
            }));

            if (doc.idPhotos && doc.idPhotos.length > 0) {
              setIdProofImage(doc.idPhotos[0]);
            }
          } else if (userDetails && user?.userType !== 'vendor') {
             console.log("No valid draft found. Auto-filling from userDetails:", userDetails);

             console.log("Business Details (Auto-fill):", {
                brandName: userDetails.business?.brandName,
                legalCompanyName: userDetails.business?.legalCompanyName,
                businessEmailId: userDetails.business?.email,
                businessPhoneNumber: userDetails.business?.phoneNumber,
                businessAddress: {
                  locality: userDetails.business?.locality,
                  state: userDetails.business?.state,
                  city: userDetails.business?.city,
                  pincode: userDetails.business?.pincode
                }
             });

             console.log("Personal Details (Auto-fill):", {
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                personalState: userDetails.state,
                personalCity: userDetails.city,
                personalPincode: userDetails.personalPincode,
                dateOfBirth: userDetails.dateOfBirth,
                maritalStatus: userDetails.maritalStatus,
                idProof: userDetails.idProof
             });

             // Auto-fill from user details if no draft exists
             setFormData(prev => ({
                ...prev,
                firstName: userDetails.firstName || "",
                lastName: userDetails.lastName || "",
                personalState: userDetails.state || "",
                personalCity: userDetails.city || "",
                personalPincode: userDetails.personalPincode || "",
                personalLocality: userDetails.personalLocality || "India",
                dateOfBirth: userDetails.dateOfBirth ? new Date(userDetails.dateOfBirth).toISOString().split('T')[0] : "",
                maritalStatus: userDetails.maritalStatus || "",
                idProof: userDetails.idProof || "",
                idPhotos: userDetails.idPhotos || [],

                brandName: userDetails.business?.brandName || "",
                legalCompanyName: userDetails.business?.legalCompanyName || "",
                gstNumber: userDetails.business?.gstNumber || "",
                businessEmailId: userDetails.business?.email || "",
                businessPhoneNumber: userDetails.business?.phoneNumber || "",
                businessLocality: userDetails.business?.locality || "India",
                businessState: userDetails.business?.state || "",
                businessCity: userDetails.business?.city || "",
                businessPincode: userDetails.business?.pincode || "",
             }));
             if (userDetails.idPhotos && userDetails.idPhotos.length > 0) {
               setIdProofImage(userDetails.idPhotos[0]);
             }
          }
        } catch (err) {
          console.error("Failed to load existing onboarding data", err);
        }
      };
      loadExistingData();

  }, [userDetails]);

  // Auto-calculate final prices for discounts
  useEffect(() => {
    if (currentStep === 5) {
      setFormData(prev => {
        const basePrice = parseFloat(prev.perDayCharge) || parseFloat(prev.perKmCharge) || 0;
        let newData = { ...prev };
        let changed = false;

        const calculateFinal = (type: string, value: string) => {
           const val = parseFloat(value) || 0;
           if (type === 'percentage') {
               return Math.max(0, basePrice - (basePrice * val / 100)).toFixed(0);
           } else {
               return Math.max(0, basePrice - val).toFixed(0);
           }
        };

        if (prev.firstUserDiscount) {
            const final = calculateFinal(prev.firstUserDiscountType, prev.firstUserDiscountValue);
            if (prev.firstUserDiscountFinalPrice !== final) {
                newData.firstUserDiscountFinalPrice = final;
                changed = true;
            }
        }

        if (prev.festivalOffers) {
            const final = calculateFinal(prev.festivalOffersType, prev.festivalOffersValue);
            if (prev.festivalOffersFinalPrice !== final) {
                newData.festivalOffersFinalPrice = final;
                changed = true;
            }
        }

        if (prev.weeklyMonthlyOffers) {
            const final = calculateFinal(prev.weeklyMonthlyOffersType, prev.weeklyMonthlyOffersValue);
            if (prev.weeklyMonthlyOffersFinalPrice !== final) {
                newData.weeklyMonthlyOffersFinalPrice = final;
                changed = true;
            }
        }

        if (prev.specialOffers) {
            const final = calculateFinal(prev.specialOffersType, prev.specialOffersValue);
            if (prev.specialOffersFinalPrice !== final) {
                newData.specialOffersFinalPrice = final;
                changed = true;
            }
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
      formData.specialOffersValue
  ]);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/onboarding/service-selection");
    }
  };

  const handleNext = () => {
    // Per-step validation
    if (currentStep === 0) {
      const newErrors: Record<string, string> = {};
      let hasError = false;

      if (!formData.name || !formData.name.trim()) {
        newErrors.name = "Caravan name is required";
        hasError = true;
      }
      if (!formData.description || !formData.description.trim()) {
        newErrors.description = "Caravan description is required";
        hasError = true;
      }
      if (formData.photos.length < 5) {
        newErrors.photos = "Please upload at least 5 photos";
        hasError = true;
      }

      if (hasError) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    } else if (currentStep === 1) {
      if (!formData.category) {
        toast.error("Please select a caravan category");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.features || formData.features.length === 0) {
        toast.error("Please select at least one feature");
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.locality || !formData.locality.trim()) {
        toast.error("Locality is required");
        return;
      }
      if (!formData.address || !formData.address.trim()) {
        toast.error("Address is required");
        return;
      }
      if (!formData.state || !formData.state.trim()) {
        toast.error("State is required");
        return;
      }
      if (!formData.city || !formData.city.trim()) {
        toast.error("City is required");
        return;
      }
      if (!formData.pincode || !formData.pincode.trim()) {
        toast.error("Pincode is required");
        return;
      }
    } else if (currentStep === 4) {
      const newErrors: Record<string, string> = {};
      let hasError = false;

      const hasPerKm = formData.perKmCharge && !isNaN(Number(formData.perKmCharge)) && Number(formData.perKmCharge) > 0;
      const hasPerDay = formData.perDayCharge && !isNaN(Number(formData.perDayCharge)) && Number(formData.perDayCharge) > 0;

      if (!hasPerKm && !hasPerDay) {
        toast.error("At least one price (Per KM or Per Day) is required");
        return;
      }

      if (hasPerKm) {
        if (!formData.perKmIncludes || !formData.perKmIncludes.some((i) => i.trim())) {
          newErrors.perKmIncludes = "Please add at least one inclusion";
          hasError = true;
        }
        if (!formData.perKmExcludes || !formData.perKmExcludes.some((i) => i.trim())) {
          newErrors.perKmExcludes = "Please add at least one exclusion";
          hasError = true;
        }
      }

      if (hasPerDay) {
        if (!formData.perDayIncludes || !formData.perDayIncludes.some((i) => i.trim())) {
          newErrors.perDayIncludes = "Please add at least one inclusion";
          hasError = true;
        }
        if (!formData.perDayExcludes || !formData.perDayExcludes.some((i) => i.trim())) {
          newErrors.perDayExcludes = "Please add at least one exclusion";
          hasError = true;
        }
      }

      if (hasError) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    } else if (currentStep === 5) {
      const newErrors: Record<string, string> = {};
      let hasError = false;

      // Validate First User Discount
      if (formData.firstUserDiscount) {
        if (!formData.firstUserDiscountValue) {
          newErrors.firstUserDiscountValue = "Discount value is required";
          hasError = true;
        }
        if (!formData.firstUserDiscountFinalPrice) {
          newErrors.firstUserDiscountFinalPrice = "Final price is required";
          hasError = true;
        }
      }

      // Validate Festival Offers
      if (formData.festivalOffers) {
        if (!formData.festivalOffersValue) {
          newErrors.festivalOffersValue = "Discount value is required";
          hasError = true;
        }
        if (!formData.festivalOffersFinalPrice) {
          newErrors.festivalOffersFinalPrice = "Final price is required";
          hasError = true;
        }
      }

      // Validate Weekly/Monthly Offers
      if (formData.weeklyMonthlyOffers) {
        if (!formData.weeklyMonthlyOffersValue) {
          newErrors.weeklyMonthlyOffersValue = "Discount value is required";
          hasError = true;
        }
        if (!formData.weeklyMonthlyOffersFinalPrice) {
          newErrors.weeklyMonthlyOffersFinalPrice = "Final price is required";
          hasError = true;
        }
      }

      // Validate Special Offers
      if (formData.specialOffers) {
        if (!formData.specialOffersValue) {
          newErrors.specialOffersValue = "Discount value is required";
          hasError = true;
        }
        if (!formData.specialOffersFinalPrice) {
          newErrors.specialOffersFinalPrice = "Final price is required";
          hasError = true;
        }
      }

      if (hasError) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    } else if (currentStep === 6) {
      const newErrors: Record<string, string> = {};
      let hasError = false;

      if (!formData.brandName || !formData.brandName.trim()) {
        newErrors.brandName = "Brand name is required";
        hasError = true;
      }

      if (!formData.businessPhoneNumber || !formData.businessPhoneNumber.trim() || formData.businessPhoneNumber.length !== 10) {
        newErrors.businessPhoneNumber = "Valid business phone number is required";
        hasError = true;
      }

      if (hasError) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    } else if (currentStep === 7) {
      const newErrors: Record<string, string> = {};
      let hasError = false;

      if (!formData.firstName || !formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
        hasError = true;
      }
      if (!formData.lastName || !formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
        hasError = true;
      }
      if (!formData.personalLocality || !formData.personalLocality.trim()) {
        newErrors.personalLocality = "Country is required";
        hasError = true;
      }
      if (!formData.personalState || !formData.personalState.trim()) {
        newErrors.personalState = "State is required";
        hasError = true;
      }
      if (!formData.personalCity || !formData.personalCity.trim()) {
        newErrors.personalCity = "City is required";
        hasError = true;
      }
      if (!formData.personalPincode || !formData.personalPincode.trim()) {
        newErrors.personalPincode = "Pincode is required";
        hasError = true;
      }
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of Birth is required";
        hasError = true;
      }
      if (!formData.maritalStatus) {
        newErrors.maritalStatus = "Marital Status is required";
        hasError = true;
      }
      if (!formData.idProof) {
        newErrors.idProof = "ID Proof type is required";
        hasError = true;
      }
      if (!formData.idPhotos || formData.idPhotos.length === 0) {
        newErrors.idPhotos = "ID Proof photo is required";
        hasError = true;
      }

      if (hasError) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    } else if (currentStep === 8) {
      if (!formData.termsAccepted) {
        toast.error("You must accept the Terms & Conditions to proceed.");
        return;
      }
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      // Basic validation
      if (!formData.name || !formData.name.trim()) {
        throw new Error("Caravan name is required");
      }

      if (!formData.category) {
        throw new Error("Please select a caravan category");
      }

      const pdCharge = Number(formData.perDayCharge) || 0;
      const pkCharge = Number(formData.perKmCharge) || 0;
      if (pdCharge <= 0 && pkCharge <= 0) {
        throw new Error("At least one price (Per KM or Per Day) is required");
      }

      // Merge includes and excludes
      const mergedIncludes = [
        ...(formData.perKmIncludes || []),
        ...(formData.perDayIncludes || [])
      ].filter(i => i && i.trim());

      const mergedExcludes = [
        ...(formData.perKmExcludes || []),
        ...(formData.perDayExcludes || [])
      ].filter(i => i && i.trim());

      // Convert File objects to data URLs so server can persist Offer.photos
      const photosData: string[] = await Promise.all(
        ((formData.photos as any[]) || []).map((f: any) =>
          typeof f === "string" ? Promise.resolve(f) : fileToDataUrl(f),
        ),
      );
      const photosCoverImage: string[] = await Promise.all(
        ((formData.coverImage as any[]) || []).map((f: any) =>
          typeof f === "string" ? Promise.resolve(f) : fileToDataUrl(f),
        ),
      );
      const idPhotosData: string[] = await Promise.all(
        ((formData.idPhotos as any[]) || []).map((f: any) =>
          typeof f === "string" ? Promise.resolve(f) : fileToDataUrl(f),
        ),
      );

      const payload = {
        ...formData,
        perDayCharge: pdCharge,
        perKmCharge: pkCharge.toString(), // Ensure string if interface expects it, or keep number if updated. Interface says string.
        priceIncludes: mergedIncludes,
        priceExcludes: mergedExcludes,
        finalPrice: 0,
        seatingCapacity: Number(formData.seatingCapacity),
        sleepingCapacity: Number(formData.sleepingCapacity),
        photos: photosData,
        idPhotos: idPhotosData,
        coverImage: photosCoverImage,
      };

      console.log("Submitting caravan onboarding data...");

      const result = await submitOnboardingData("caravan", payload);

      if (result?.id) {
        // Update user profile with personal & business details
        await updateUserDetails({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumber: formData.businessPhoneNumber,
            country: (formData as any).personalCountry,
            state: formData.personalState,
            city: formData.personalCity,
            personalPincode: formData.personalPincode,
            personalLocality: formData.personalLocality,
            dateOfBirth: formData.dateOfBirth,
            maritalStatus: formData.maritalStatus,
            idProof: formData.idProof,
            idPhotos: idPhotosData,

            business: {
              brandName: formData.brandName,
              legalCompanyName: formData.legalCompanyName,
              gstNumber: formData.gstNumber,
              email: formData.businessEmailId,
              phoneNumber: formData.businessPhoneNumber,
              locality: formData.businessLocality,
              state: formData.businessState,
              city: formData.businessCity,
              pincode: formData.businessPincode,
            }
        });

        onboardingService.setCaravanId(result.id);
        sessionStorage.setItem('onboardingId', result.id);
        sessionStorage.setItem('onboardingType', 'caravan');
        sessionStorage.setItem('id', result.id);
        updateUserType('vendor');
        toast.success("Caravan onboarding saved successfully!");
        navigate("/onboarding/selfie-verification");
        return;
      } else {
        toast.error("Could not save onboarding. Please try again.");
      }
    } catch (e: any) {
      console.error("Error in handleComplete:", e);
      toast.error(e?.message || "Failed to save caravan onboarding");
    } finally {
      setIsLoading(false);
    }
  };

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

  const addPriceItem = (field: "perKmIncludes" | "perKmExcludes" | "perDayIncludes" | "perDayExcludes") => {
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

  const removePriceItem = (field: "perKmIncludes" | "perKmExcludes" | "perDayIncludes" | "perDayExcludes", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const adjustCapacity = (
    type: "seating" | "sleeping",
    direction: "increase" | "decrease",
  ) => {
    const field = type === "seating" ? "seatingCapacity" : "sleepingCapacity";
    setFormData((prev) => ({
      ...prev,
      [field]:
        direction === "increase"
          ? prev[field] + 1
          : Math.max(1, prev[field] - 1),
    }));
  };

  const handleFileUpload = (
    field: "photos" | "idPhotos",
    files: FileList | null,
  ) => {
    if (!files) return;

    setFormData((prev) => {
      const currentFiles = prev[field] || [];
      const remainingSlots = 15 - currentFiles.length;
      if (files.length > remainingSlots) {
        toast.error("Upload limit exceeded!");
        console.log("Upload limit exceeded!");
        return prev;
      }
      const newFiles = Array.from(files).slice(0, remainingSlots);
      const updatedFiles = [...currentFiles, ...newFiles];
      console.log("Upload limit remains");
      return {
        ...prev,
        [field]: updatedFiles,
      };
    });
  };
  const handleCoverFileUpload = (
    field: "coverImage",
    files: FileList | null,
  ) => {
    if (!files) return;

    setFormData((prev) => {
      const currentFiles = prev[field] || [];
      const remainingSlots = 2 - currentFiles.length;
      if (files.length > remainingSlots) {
        toast.error("Upload limit exceeded!");
        console.log("Upload limit exceeded!");
        return prev;
      }
      const newFiles = Array.from(files).slice(0, remainingSlots);
      const updatedFiles = [...currentFiles, ...newFiles];
      console.log("Upload limit remains");
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
  if (errors.firstUserDiscountFinalPrice) discountErrors.firstUserFinalPrice = errors.firstUserDiscountFinalPrice;
  if (errors.festivalOffersValue) discountErrors.festivalValue = errors.festivalOffersValue;
  if (errors.festivalOffersFinalPrice) discountErrors.festivalFinalPrice = errors.festivalOffersFinalPrice;
  if (errors.weeklyMonthlyOffersValue) discountErrors.weeklyValue = errors.weeklyMonthlyOffersValue;
  if (errors.weeklyMonthlyOffersFinalPrice) discountErrors.weeklyFinalPrice = errors.weeklyMonthlyOffersFinalPrice;
  if (errors.specialOffersValue) discountErrors.specialValue = errors.specialOffersValue;
  if (errors.specialOffersFinalPrice) discountErrors.specialFinalPrice = errors.specialOffersFinalPrice;

  // --- Business details mapping for shared BusinessDetailsStep ---
  const handleBusinessFieldChange = (field: string, value: string) => {
    const fieldMap: Record<string, string> = {
      brandName: "brandName",
      companyName: "legalCompanyName",
      gstNumber: "gstNumber",
      businessEmail: "businessEmailId",
      businessPhone: "businessPhoneNumber",
      pincode: "businessPincode",
    };
    const formField = fieldMap[field] || field;
    setFormData((prev) => ({ ...prev, [formField]: value }));

    // Map error keys back
    const errorKeyMap: Record<string, string> = {
      brandName: "brandName",
      businessPhone: "businessPhoneNumber",
    };
    const errorField = errorKeyMap[field];
    if (errorField && errors[errorField]) {
      setErrors((prev) => ({ ...prev, [errorField]: "" }));
    }
  };

  const businessErrors: Record<string, string> = {};
  if (errors.brandName) businessErrors.brandName = errors.brandName;
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
    setCustomFeatures(prev => prev.filter((_, i) => i !== idx));
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== featureName)
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
      setCustomFeatures(prev => [...prev, { name: newFeatureName, icon: MoreHorizontal }]);
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeatureName]
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
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <DescriptionStep
            name={formData.name}
            description={formData.description}
            rules={formData.rules}
            photos={formData.photos}
            coverImage={formData.coverImage}
            errors={errors}
            sliderRef={sliderRef}
            onNameChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
            onDescriptionChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
            onAddRule={addRule}
            onRemoveRule={removeRule}
            onUpdateRule={updateRule}
            onPhotoUpload={(files) => handleFileUpload("photos", files)}
            onCoverUpload={(files) => handleCoverFileUpload("coverImage", files)}
            onRemovePhoto={(index) => removeFile("photos", index)}
            onRemoveCover={(index) => removeCoverFile("coverImage", index)}
            clearError={clearError}
          />
        );
      case 1:
        return (
          <CategoryStep
            category={formData.category}
            dynamicCategories={dynamicCategories}
            onSelect={(categoryName) => setFormData((prev) => ({ ...prev, category: categoryName }))}
          />
        );
      case 2:
        return (
          <FeaturesStep
            features={formData.features}
            dynamicFeatures={dynamicFeatures}
            customFeatures={customFeatures}
            showCustomFeaturesInput={showCustomFeaturesInput}
            customFeatureInput={customFeatureInput}
            onToggleFeature={toggleFeature}
            onRemoveCustomFeature={handleRemoveCustomFeature}
            onToggleCustomInput={() => setShowCustomFeaturesInput(!showCustomFeaturesInput)}
            onCustomFeatureInputChange={setCustomFeatureInput}
            onAddCustomFeature={handleAddCustomFeature}
          />
        );
      case 3:
        return (
          <CapacityAddressStep
            seatingCapacity={formData.seatingCapacity}
            sleepingCapacity={formData.sleepingCapacity}
            address={formData.address}
            locality={formData.locality}
            state={formData.state}
            city={formData.city}
            pincode={formData.pincode}
            locationData={data}
            mapSrc={mapSrc}
            onAdjustCapacity={adjustCapacity}
            onAddressChange={(value) => setFormData((prev) => ({ ...prev, address: value }))}
            onLocalityChange={(value) => setFormData((prev) => ({ ...prev, locality: value, state: "", city: "" }))}
            onStateChange={(value) => setFormData((prev) => ({ ...prev, state: value, city: "" }))}
            onCityChange={(value) => setFormData((prev) => ({ ...prev, city: value }))}
            onPincodeChange={(value) => setFormData((prev) => ({ ...prev, pincode: value }))}
          />
        );
      case 4:
        return (
          <PricingStep
            perKmCharge={formData.perKmCharge}
            perDayCharge={formData.perDayCharge}
            perKmIncludes={formData.perKmIncludes}
            perKmExcludes={formData.perKmExcludes}
            perDayIncludes={formData.perDayIncludes}
            perDayExcludes={formData.perDayExcludes}
            errors={errors}
            onPerKmChargeChange={(value) => setFormData((prev) => ({ ...prev, perKmCharge: value }))}
            onPerDayChargeChange={(value) => setFormData((prev) => ({ ...prev, perDayCharge: value }))}
            onAddPriceItem={addPriceItem}
            onUpdatePriceItem={updatePriceItem}
            onRemovePriceItem={removePriceItem}
            clearError={clearError}
          />
        );
      case 5:
        return (
          <DiscountOffersStep
            offers={discountOffers}
            onToggle={handleDiscountToggle}
            onOfferChange={handleDiscountOfferChange}
            errors={discountErrors}
            weeklyLabel="Weekly-Monthly Offers"
          />
        );
      case 6:
        return (
          <BusinessDetailsStep
            values={{
              brandName: formData.brandName,
              companyName: formData.legalCompanyName,
              gstNumber: formData.gstNumber,
              businessEmail: formData.businessEmailId,
              businessPhone: formData.businessPhoneNumber,
              pincode: formData.businessPincode,
            }}
            errors={businessErrors}
            onChange={handleBusinessFieldChange}
            selectedCountry={selected}
            onCountrySelect={setSelected}
            countryDialogOpen={open}
            setCountryDialogOpen={setOpen}
            countries={countries}
            locationData={data}
            selectedState={formData.businessState}
            selectedCity={formData.businessCity}
            countryName={formData.businessLocality}
            onStateChange={(val) => setFormData((prev) => ({ ...prev, businessState: val, businessCity: "" }))}
            onCityChange={(val) => setFormData((prev) => ({ ...prev, businessCity: val }))}
            mapSrc={mapSrcbusiness}
          />
        );
      case 7:
        return (
          <PersonalDetailsStep
            values={{
              firstName: formData.firstName,
              lastName: formData.lastName,
              pincode: formData.personalPincode,
              dateOfBirth: formData.dateOfBirth,
              maritalStatus: formData.maritalStatus,
              idProof: formData.idProof,
            }}
            errors={errors}
            onChange={handlePersonalFieldChange}
            locationData={data}
            selectedState={formData.personalState}
            selectedCity={formData.personalCity}
            countryName={formData.personalLocality}
            onStateChange={(val) => {
              setFormData((prev) => ({ ...prev, personalState: val, personalCity: "" }));
              if (errors.personalState) {
                setErrors((prev) => ({ ...prev, personalState: "" }));
              }
            }}
            onCityChange={(val) => {
              setFormData((prev) => ({ ...prev, personalCity: val }));
              if (errors.personalCity) {
                setErrors((prev) => ({ ...prev, personalCity: "" }));
              }
            }}
            idProofImage={idProofImage}
            onIdProofUpload={handleUploadIDProof}
            uploadError={uploadError}
          />
        );
      case 8:
        return (
          <TermsConditionsStep
            termsAccepted={formData.termsAccepted}
            onTermsChange={(checked) => setFormData((prev) => ({ ...prev, termsAccepted: checked }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      isLoading={isLoading}
      canProceed={canProceed}
      termsAccepted={formData.termsAccepted}
      onBack={handleBack}
      onNext={handleNext}
    >
      {renderStepContent()}
    </OnboardingLayout>
  );
};

export default CaravanOnboarding;
