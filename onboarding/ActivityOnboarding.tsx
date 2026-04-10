import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { cmsPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Minus,
  ChevronDown,
  X,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import LogoWebsite from "@/components/ui/LogoWebsite";
import Gallery from "../gallery";
import * as Flags from "country-flag-icons/react/3x2";
import { Country } from "country-state-city";
import { submitOnboardingData, getOnboardingData } from "@/lib/api";
import { onboardingService } from "@/lib/onboardingService";
import { FaUserTie } from "react-icons/fa6";
import { GiBinoculars, GiCampCookingPot, GiCruiser } from "react-icons/gi";

import { useUserDetails } from "@/hooks/useUserDetails";

interface ActivityType {
  id: string;
  name: string;
  icon: string;
}

type CountryOption = {
  isoCode: string;
  name: string;
  countryCode?: string;
  dialCode?: string;
};

const countries: CountryOption[] = Country.getAllCountries().map((c) => ({
  isoCode: c.isoCode,
  name: c.name,
  countryCode: c.isoCode,
  dialCode: c.phonecode,
}));

const ActivityOnboarding = () => {
  const navigate = useNavigate();
  const { updateUserType, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [data, setData] = useState([]);
  const [countriesData, setCountriesData] = useState<any[]>([]); // For country-state-city data
  const [photoCarouselScroll, setPhotoCarouselScroll] = useState(0);
  const photoCarouselRef = React.useRef<HTMLDivElement>(null);

  const { userDetails, updateUserDetails } = useUserDetails();

  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [status, setStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
const priceIncludeRef = useRef<HTMLInputElement>(null);
const priceExcludeRef = useRef<HTMLInputElement>(null);
const expectationRef = useRef<HTMLInputElement>(null);

  // Form data for all steps
  const [formData, setFormData] = useState({
    // Step 0: Selected activity types
    selectedActivities: [] as string[],

    // Step 1: Features
    features: [] as string[],

    // Step 2: Activity Details
    activityName: "",
    description: "",
    coverImage: null as File | string | null,
    photos: [] as (File | string)[],
    rulesAndRegulations: [] as string[],

    // Step 3: Pricing Details
    regularPrice: "",
    personCapacity: 1,
    timeDuration: "",
    locality: "India",
    state: "",
    city: "",
    pincode: "",
    priceDetails: [] as Array<{
      state: string;
      city: string;
      include: boolean;
      price?: string;
    }>,

    // Step 4: Inclusion & Exclusion
    priceIncludes: [ "" ] as string[],
    priceExcludes: [] as string[],
    expectations: [] as string[],

    // Step 5: Types of Discount
    firstUserDiscount: true,
    discountType: "",
    discountAmount: "",
    finalPrice: "",

    festivalOffers: false,
    festivalDiscountType: "",
    festivalDiscountAmount: "",
    festivalFinalPrice: "",

    weeklyOffers: false,
    weeklyDiscountType: "",
    weeklyDiscountAmount: "",
    weeklyFinalPrice: "",

    specialOffers: false,
    specialDiscountType: "",
    specialDiscountAmount: "",
    specialFinalPrice: "",

    // Step 6: Business Details
    brandName: "",
    legalCompanyName: "",
    gstNumber: "",
    businessEmail: "",
    businessPhone: "",
    businessLocality: "India",
    businessPincode: "",
    businessCity: "",
    businessState: "",

    // Step 7: Personal Details
    firstName: "",
    lastName: "",
    personalLocality: "India",
    personalPincode: "",
    personalCity: "",
    personalState: "",
    dateOfBirth: "",
    maritalStatus: "",
    idProof: "",
    idPhotos: [] as (File | string)[],
    // Step 8: Terms & Conditions
    termsAccepted: false,
  });

  // Features state
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");
  const [ruleInput, setRuleInput] = useState("");
  const [adminFeatures, setAdminFeatures] = useState<any[]>([]);

  // Load countries data (replace with your actual JSON path)
  // Populate country list on mount
  useEffect(() => {
    // Check if Activity section is enabled
    cmsPublicApi.listHomepageSections().then((sections) => {
      const activitySection = sections.find((s: any) => s.sectionKey === 'best-activity');
      if (activitySection && !activitySection.isVisible) {
        toast.error("Activity onboarding is currently disabled.");
        navigate("/");
      }
    }).catch(console.error);
    fetch("/countries_states_cities.json") // remove ../../.. for public/ path
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Failed to load countries:", err));

    // Fetch admin features
    cmsPublicApi.getFeatures("Activity").then(list => {
      setAdminFeatures(list.filter((f: any) => f.status === 'enable'));
    }).catch(console.error);

    // Fetch activity categories (types)
    cmsPublicApi.getFeatures("Activity", "category").then(list => {
      const types = list
        .filter((f: any) => f.status === 'enable')
        .map((f: any) => ({
          id: f.name, // Use name as ID for backward compatibility if names match old IDs, OR use f._id if we want to migrate to IDs. 
                      // The old code used IDs like "hiking", "zipline". The backend likely returns "Hiking", "Zip-lining".
                      // If we use ID, we must ensure formData stores ID.
                      // If I change ID to be f._id (MongoDB ID), then existing drafts with old string IDs will break?
                      // Wait, the user said "replace hardcoded array".
                      // If I use `f.name` (e.g. "Hiking") as ID, it might match closer to what users expect or readable.
                      // But usually IDs are better.
                      // Let's use `f.name` as ID for now because `activityFeatureMap` uses keys like "hiking". 
                      // Actually `activityFeatureMap` keys are lowercase "hiking".
                      // If I use dynamic categories, `activityFeatureMap` is useless unless I map them.
                      // I will use `f.name` as ID for simplicity in formData.
          name: f.name,
          icon: f.icon
        }));
      setActivityTypes(types);
    }).catch(console.error);

    // Check for existing data (resubmission)
    const loadExistingData = async () => {
      try {
        const data = await getOnboardingData();

        // Enforce single pending service - REMOVED per user request
        // if (data && data.doc && ['pending', 'draft', 'rejected'].includes(data.doc.status)) {
        //     if (data.type !== 'activity') {
        //       toast.info(`You have a pending ${data.type} application. Please complete it first.`);
        //       navigate(`/onboarding/${data.type}`);
        //       return;
        //     }
        // }

        if (data && data.type === 'activity' && data.doc && ['pending', 'draft', 'rejected'].includes(data.doc.status)) {
          const doc = data.doc;
          console.log('Loading existing activity data:', doc);
          
          console.log('--- DEBUG: Activity Data Fields ---');
          console.log('selectedActivities:', doc.selectedActivities);
          console.log('features:', doc.features);
          console.log('activityName:', doc.activityName);
          console.log('description:', doc.description);
          console.log('coverImage:', doc.coverImage);
          console.log('photos:', doc.photos);
          console.log('rulesAndRegulations:', doc.rulesAndRegulations);
          console.log('regularPrice:', doc.regularPrice);
          console.log('personCapacity:', doc.personCapacity);
          console.log('timeDuration:', doc.timeDuration);
          console.log('locality:', doc.locality);
          console.log('state:', doc.state);
          console.log('city:', doc.city);
          console.log('pincode:', doc.pincode);
          console.log('priceIncludes:', doc.priceIncludes);
          console.log('priceExcludes:', doc.priceExcludes);
          console.log('expectations:', doc.expectations);
          
          console.log('Discounts - First User:', { active: doc.firstUserDiscount, type: doc.discountType, amount: doc.discountAmount, final: doc.finalPrice });
          console.log('Discounts - Festival:', { active: doc.festivalOffers, type: doc.festivalDiscountType, amount: doc.festivalDiscountAmount, final: doc.festivalFinalPrice });
          console.log('Discounts - Weekly:', { active: doc.weeklyOffers, type: doc.weeklyDiscountType, amount: doc.weeklyDiscountAmount, final: doc.weeklyFinalPrice });
          console.log('Discounts - Special:', { active: doc.specialOffers, type: doc.specialDiscountType, amount: doc.specialDiscountAmount, final: doc.specialFinalPrice });
          
          console.log('Business Details:', {
            brandName: doc.brandName,
            legalCompanyName: doc.legalCompanyName,
            gstNumber: doc.gstNumber,
            businessEmail: doc.businessEmail,
            businessPhone: doc.businessPhone,
            businessLocality: doc.businessLocality,
            businessPincode: doc.businessPincode,
            businessCity: doc.businessCity,
            businessState: doc.businessState
          });
          
          console.log('Personal Details:', {
            firstName: doc.firstName,
            lastName: doc.lastName,
            personalLocality: doc.personalLocality,
            personalPincode: doc.personalPincode,
            personalCity: doc.personalCity,
            personalState: doc.personalState,
            dateOfBirth: doc.dateOfBirth,
            maritalStatus: doc.maritalStatus,
            idProof: doc.idProof,
            idPhotos: doc.idPhotos
          });
          console.log('-----------------------------------');
          
          setStatus(doc.status);
          setRejectionReason(doc.rejectionReason || "");

          // Map backend data to frontend formData
          setFormData(prev => ({
            ...prev,
            selectedActivities: doc.selectedActivities || [],
            features: doc.features || [],
            activityName: doc.activityName || "",
            description: doc.description || "",
            // Handle string photos (URLs)
            coverImage: doc.coverImage || null, 
            photos: doc.photos || [],
            rulesAndRegulations: doc.rulesAndRegulations || [],
            
            regularPrice: String(doc.regularPrice || ""),
            personCapacity: doc.personCapacity || 1,
            timeDuration: doc.timeDuration || "",
            locality: doc.locality || "India",
            state: doc.state || "",
            city: doc.city || "",
            pincode: doc.pincode || "",
            // priceDetails: doc.priceDetails || [], // Mapping might be complex if structure differs
            
            priceIncludes: doc.priceIncludes || [],
            priceExcludes: doc.priceExcludes || [],
            expectations: doc.expectations || [],
            
            firstUserDiscount: doc.firstUserDiscount ?? true,
            discountType: doc.discountType || "",
            discountAmount: String(doc.discountAmount || ""),
            finalPrice: String(doc.finalPrice || ""),
            
            festivalOffers: doc.festivalOffers ?? false,
            festivalDiscountType: doc.festivalDiscountType || "",
            festivalDiscountAmount: String(doc.festivalDiscountAmount || ""),
            festivalFinalPrice: String(doc.festivalFinalPrice || ""),
            
            weeklyOffers: doc.weeklyOffers ?? false,
            weeklyDiscountType: doc.weeklyDiscountType || "",
            weeklyDiscountAmount: String(doc.weeklyDiscountAmount || ""),
            weeklyFinalPrice: String(doc.weeklyFinalPrice || ""),
            
            specialOffers: doc.specialOffers ?? false,
            specialDiscountType: doc.specialDiscountType || "",
            specialDiscountAmount: String(doc.specialDiscountAmount || ""),
            specialFinalPrice: String(doc.specialFinalPrice || ""),
            
            brandName: doc.brandName || "",
            legalCompanyName: doc.legalCompanyName || "",
            gstNumber: doc.gstNumber || "",
            businessEmail: doc.businessEmail || "",
            businessPhone: doc.businessPhone || "",
            businessLocality: doc.businessLocality || "India",
            businessPincode: doc.businessPincode || "",
            businessCity: doc.businessCity || "",
            businessState: doc.businessState || "",
            
            firstName: doc.firstName || "",
            lastName: doc.lastName || "",
            personalLocality: doc.personalLocality || "India",
            personalPincode: doc.personalPincode || "",
            personalCity: doc.personalCity || "",
            personalState: doc.personalState || "",
            dateOfBirth: doc.dateOfBirth || "",
            maritalStatus: doc.maritalStatus || "",
            idProof: doc.idProof || "",
            idPhotos: doc.idPhotos || [],
            
            termsAccepted: false, // User must re-accept terms
          }));

          if (doc.idPhotos && doc.idPhotos.length > 0) {
             // If ActivityOnboarding uses a separate state for ID proof image preview, set it here.
             // Looking at the code, it uses formData.idPhotos directly in the render usually?
             // Let's check if there is a setIdProofImage state. ActivityOnboarding doesn't seem to have setIdProofImage state in the read output.
             // It uses formData.idPhotos. So this might not be needed if the UI uses formData.idPhotos.
             // But Stays and Caravan seemed to use a separate state for preview.
             // Let's re-read ActivityOnboarding variables.
          }
        } else if (userDetails) {
           console.log("Auto-filling from userDetails:", userDetails);
           
           console.log('--- DEBUG: User Details Auto-fill ---');
           console.log('Personal Details:', {
              firstName: userDetails.firstName,
              lastName: userDetails.lastName,
              personalLocality: userDetails.personalLocality,
              personalPincode: userDetails.personalPincode,
              personalCity: userDetails.city,
              personalState: userDetails.state,
              dateOfBirth: userDetails.dateOfBirth,
              maritalStatus: userDetails.maritalStatus,
              idProof: userDetails.idProof,
              idPhotos: userDetails.idPhotos
           });
           
           console.log('Business Details:', {
              brandName: userDetails.business?.brandName,
              legalCompanyName: userDetails.business?.legalCompanyName,
              gstNumber: userDetails.business?.gstNumber,
              businessEmail: userDetails.business?.email,
              businessPhone: userDetails.business?.phoneNumber,
              businessLocality: userDetails.business?.locality,
              businessPincode: userDetails.business?.pincode,
              businessCity: userDetails.business?.city,
              businessState: userDetails.business?.state
           });
           console.log('-------------------------------------');

           // Auto-fill from user details if no draft exists
           setFormData(prev => ({
              ...prev,
              firstName: userDetails.firstName || "",
              lastName: userDetails.lastName || "",
              personalLocality: userDetails.personalLocality || "India",
              personalPincode: userDetails.personalPincode || "",
              personalCity: userDetails.city || "",
              personalState: userDetails.state || "",
              dateOfBirth: userDetails.dateOfBirth ? new Date(userDetails.dateOfBirth).toISOString().split('T')[0] : "",
              maritalStatus: userDetails.maritalStatus || "",
              idProof: userDetails.idProof || "",
              idPhotos: userDetails.idPhotos || [],
              
              brandName: userDetails.business?.brandName || "",
              legalCompanyName: userDetails.business?.legalCompanyName || "",
              gstNumber: userDetails.business?.gstNumber || "",
              businessEmail: userDetails.business?.email || "",
              businessPhone: userDetails.business?.phoneNumber || "",
              businessLocality: userDetails.business?.locality || "India",
              businessPincode: userDetails.business?.pincode || "",
              businessCity: userDetails.business?.city || "",
              businessState: userDetails.business?.state || "",
           }));
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
        const basePrice = parseFloat(prev.regularPrice) || 0;
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
            const final = calculateFinal(prev.discountType, prev.discountAmount);
            if (prev.finalPrice !== final) {
                newData.finalPrice = final;
                changed = true;
            }
        }
        
        if (prev.festivalOffers) {
            const final = calculateFinal(prev.festivalDiscountType, prev.festivalDiscountAmount);
            if (prev.festivalFinalPrice !== final) {
                newData.festivalFinalPrice = final;
                changed = true;
            }
        }

        if (prev.weeklyOffers) {
            const final = calculateFinal(prev.weeklyDiscountType, prev.weeklyDiscountAmount);
            if (prev.weeklyFinalPrice !== final) {
                newData.weeklyFinalPrice = final;
                changed = true;
            }
        }

        if (prev.specialOffers) {
            const final = calculateFinal(prev.specialDiscountType, prev.specialDiscountAmount);
            if (prev.specialFinalPrice !== final) {
                newData.specialFinalPrice = final;
                changed = true;
            }
        }

        return changed ? newData : prev;
      });
    }
  }, [
      currentStep, 
      formData.regularPrice,
      formData.firstUserDiscount, 
      formData.discountType, 
      formData.discountAmount,
      formData.festivalOffers, 
      formData.festivalDiscountType, 
      formData.festivalDiscountAmount,
      formData.weeklyOffers, 
      formData.weeklyDiscountType, 
      formData.weeklyDiscountAmount,
      formData.specialOffers, 
      formData.specialDiscountType, 
      formData.specialDiscountAmount
  ]);

  // Navigation Handlers
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/onboarding/service-selection");
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const submitActivity = async () => {
    try {
      setIsLoading(true);

      // Basic validation
      if (!formData.activityName || !formData.activityName.trim()) {
        throw new Error("Activity name is required");
      }

      if (
        !formData.selectedActivities ||
        formData.selectedActivities.length === 0
      ) {
        throw new Error("Please select at least one activity type");
      }

      const regPrice = Number(formData.regularPrice);
      if (!formData.regularPrice || isNaN(regPrice) || regPrice <= 0) {
        throw new Error("Please enter a valid price");
      }

      // Convert selected photos to data URLs so server can map to Offer.photos
      const coverImageData = formData.coverImage
        ? (formData.coverImage instanceof File ? await fileToDataUrl(formData.coverImage) : formData.coverImage)
        : null;
      const photosData = await Promise.all(
        (formData.photos || []).map((f: any) => (f instanceof File ? fileToDataUrl(f) : f)),
      );
      const idPhotosData = await Promise.all(
        (formData.idPhotos || []).map((f: any) => (f instanceof File ? fileToDataUrl(f) : f)),
      );

      const clean = {
        ...formData,
        regularPrice: regPrice,
        personCapacity: Number(formData.personCapacity),
        finalPrice: Number(formData.finalPrice) || 0,
        coverImage: coverImageData,
        photos: photosData,
        idPhotos: idPhotosData,
      };

      const result = await submitOnboardingData("activity", clean);
      
      // Update user details for auto-fill in future
      await updateUserDetails({
        firstName: clean.firstName,
        lastName: clean.lastName,
        personalLocality: clean.personalLocality,
        personalPincode: clean.personalPincode,
        city: clean.personalCity,
        state: clean.personalState,
        dateOfBirth: clean.dateOfBirth,
        maritalStatus: clean.maritalStatus,
        idProof: clean.idProof,
        idPhotos: clean.idPhotos as string[],
        business: {
          brandName: clean.brandName,
          legalCompanyName: clean.legalCompanyName,
          gstNumber: clean.gstNumber,
          email: clean.businessEmail,
          phoneNumber: clean.businessPhone,
          locality: clean.businessLocality,
          pincode: clean.businessPincode,
          city: clean.businessCity,
          state: clean.businessState,
        }
      });

      updateUserType('vendor');
      toast.success("Activity onboarding saved successfully!");
      return result;
    } catch (e: any) {
      toast.error(e?.message || "Failed to save activity onboarding");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    setErrors({});
    let newErrors: { [key: string]: string } = {};
    let isValid = true;

    // Per-step validation
    if (currentStep === 0) {
      if (
        !formData.selectedActivities ||
        formData.selectedActivities.length === 0
      ) {
        toast.error("Please select at least one activity type");
        return;
      }
    } else if (currentStep === 1) {
      if (!formData.features || formData.features.length === 0) {
        toast.error("Please select at least one feature");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.activityName || !formData.activityName.trim()) {
        newErrors.activityName = "Activity name is required";
        isValid = false;
      }
      if (!formData.description || !formData.description.trim()) {
        newErrors.description = "Activity description is required";
        isValid = false;
      }
      if (!formData.coverImage) {
        newErrors.coverImage = "Cover image is required";
        isValid = false;
      }
      if (!formData.photos || formData.photos.length < 5) {
        newErrors.photos = "At least 5 photos are required";
        isValid = false;
      }
    } else if (currentStep === 3) {
      const regPrice = Number(formData.regularPrice);
      if (!formData.regularPrice || isNaN(regPrice) || regPrice <= 0) {
        newErrors.regularPrice = "Please enter a valid regular price";
        isValid = false;
      }
      if (!formData.locality || !formData.locality.trim()) {
        newErrors.locality = "Locality is required";
        isValid = false;
      }
      if (!formData.state) {
        newErrors.state = "State is required";
        isValid = false;
      }
      if (!formData.city) {
        newErrors.city = "City is required";
        isValid = false;
      }
      if (!formData.pincode) {
        newErrors.pincode = "Pincode is required";
        isValid = false;
      }
    } else if (currentStep === 4) {
      // Inclusion/Exclusion - optional
    } else if (currentStep === 5) {
      if (formData.firstUserDiscount) {
        if (!formData.discountType) {
          newErrors.discountType = "Discount type is required";
          isValid = false;
        }
        if (!formData.discountAmount) {
          newErrors.discountAmount = "Discount amount is required";
          isValid = false;
        }
        if (!formData.finalPrice) {
          newErrors.finalPrice = "Final price is required";
          isValid = false;
        }
      }
      if (formData.festivalOffers) {
        if (!formData.festivalDiscountType) {
          newErrors.festivalDiscountType = "Discount type is required";
          isValid = false;
        }
        if (!formData.festivalDiscountAmount) {
          newErrors.festivalDiscountAmount = "Discount amount is required";
          isValid = false;
        }
        if (!formData.festivalFinalPrice) {
          newErrors.festivalFinalPrice = "Final price is required";
          isValid = false;
        }
      }
      if (formData.weeklyOffers) {
        if (!formData.weeklyDiscountType) {
          newErrors.weeklyDiscountType = "Discount type is required";
          isValid = false;
        }
        if (!formData.weeklyDiscountAmount) {
          newErrors.weeklyDiscountAmount = "Discount amount is required";
          isValid = false;
        }
        if (!formData.weeklyFinalPrice) {
          newErrors.weeklyFinalPrice = "Final price is required";
          isValid = false;
        }
      }
      if (formData.specialOffers) {
        if (!formData.specialDiscountType) {
          newErrors.specialDiscountType = "Discount type is required";
          isValid = false;
        }
        if (!formData.specialDiscountAmount) {
          newErrors.specialDiscountAmount = "Discount amount is required";
          isValid = false;
        }
        if (!formData.specialFinalPrice) {
          newErrors.specialFinalPrice = "Final price is required";
          isValid = false;
        }
      }
    } else if (currentStep === 6) {
      if (!formData.brandName || !formData.brandName.trim()) {
        newErrors.brandName = "Brand name is required";
        isValid = false;
      }
      if (!formData.businessLocality || !formData.businessLocality.trim()) {
        newErrors.businessLocality = "Business locality is required";
        isValid = false;
      }
      if (!formData.legalCompanyName || !formData.legalCompanyName.trim()) {
        newErrors.legalCompanyName = "Legal Company name is required";
        isValid = false;
      }
      if (!formData.businessPhone || !formData.businessPhone.trim()) {
        newErrors.businessPhone = "Business Phone is required";
        isValid = false;
      }
      if (!formData.businessCity) {
        newErrors.businessCity = "Business City is required";
        isValid = false;
      }
      if (!formData.businessState) {
        newErrors.businessState = "Business State is required";
        isValid = false;
      }
      if (!formData.businessPincode) {
        newErrors.businessPincode = "Business Pincode is required";
        isValid = false;
      }
    } else if (currentStep === 7) {
      if (!formData.firstName || !formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
        isValid = false;
      }
      if (!formData.lastName || !formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
        isValid = false;
      }
      if (!formData.personalLocality || !formData.personalLocality.trim()) {
        newErrors.personalLocality = "Personal locality is required";
        isValid = false;
      }
      if (!formData.personalCity) {
        newErrors.personalCity = "Personal City is required";
        isValid = false;
      }
      if (!formData.personalState) {
        newErrors.personalState = "Personal State is required";
        isValid = false;
      }
      if (!formData.personalPincode) {
        newErrors.personalPincode = "Personal Pincode is required";
        isValid = false;
      }
      if (!formData.idPhotos || formData.idPhotos.length === 0) {
        newErrors.idPhotos = "ID Photos are required";
        isValid = false;
      }
    } else if (currentStep === 8) {
      if (!formData.termsAccepted) {
        toast.error("You must accept the Terms & Conditions to proceed.");
        return;
      }
      // Save then navigate only if we received an ID
      try {
        const saved = await submitActivity();
        if (saved?.id) {
          onboardingService.setActivityId(saved.id);
          sessionStorage.setItem('onboardingId', saved.id);
          sessionStorage.setItem('onboardingType', 'activity');
          sessionStorage.setItem('id', saved.id);
          navigate("/onboarding/selfie-verification");
          return;
        } else {
          toast.error("Could not save onboarding. Please try again.");
          return;
        }
      } catch (e) {
        toast.error("Could not save onboarding. Please try again.");
        return;
      }
    }

    if (!isValid) {
      setErrors(newErrors);
      toast.error("Please fill all required fields correctly");
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  // Update formData helper
  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for the field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Toggle activity selection and keep formData selectedActivities in sync
  const toggleActivityType = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedActivities: prev.selectedActivities.includes(id)
        ? prev.selectedActivities.filter((actId) => actId !== id)
        : [...prev.selectedActivities, id],
    }));
  };

  // Add and remove list items (inclusions, exclusions, expectations)
const addListItem = (
  key: "priceIncludes" | "priceExcludes" | "expectations",
  value: string
) => {
  if (!value.trim()) return;

  setFormData((prev) => ({
    ...prev,
    [key]: [...prev[key], value.trim()],
  }));
};


const removeListItem = (
  key: "priceIncludes" | "priceExcludes" | "expectations",
  index: number
) => {
  setFormData((prev) => ({
    ...prev,
    [key]: prev[key].filter((_, i) => i !== index),
  }));
};


  const toggleFeature = (featureId: string) => {
    if (featureId === "others") {
      setShowCustomFeaturesInput(!showCustomFeaturesInput);
    } else {
      setFormData((prev) => ({
        ...prev,
        features: prev.features.includes(featureId)
          ? prev.features.filter((f) => f !== featureId)
          : [...prev.features, featureId],
      }));
    }
  };

  // File upload handlers
  const handleCoverImageUpload = (files: FileList | null) => {
    if (!files) return;
    const file = files[0];
    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      coverImage: file,
    }));
    // Clear error
    if (errors.coverImage) {
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.coverImage;
            return newErrors;
        });
    }
  };

  const handleFileUpload = (
    field: "photos" | "idPhotos",
    files: FileList | null,
  ) => {
    if (!files) return;

    setFormData((prev) => {
      const currentFiles = prev[field] || [];
      const maxPhotos = field === "photos" ? 15 : 5;
      const remainingSlots = maxPhotos - currentFiles.length;
      if (files.length > remainingSlots) {
        toast.error(
          `Upload limit exceeded! Maximum ${maxPhotos} ${field === "photos" ? "photos" : "files"} allowed.`,
        );
        return prev;
      }
      const newFiles = Array.from(files).slice(0, remainingSlots);
      const updatedFiles = [...currentFiles, ...newFiles];
      
      // Clear errors if requirements met
      if (field === "photos" && updatedFiles.length >= 5 && errors.photos) {
          setErrors((prevErr) => {
              const newErrors = { ...prevErr };
              delete newErrors.photos;
              return newErrors;
          });
      }
      if (field === "idPhotos" && updatedFiles.length > 0 && errors.idPhotos) {
          setErrors((prevErr) => {
              const newErrors = { ...prevErr };
              delete newErrors.idPhotos;
              return newErrors;
          });
      }
      
      return {
        ...prev,
        [field]: updatedFiles,
      };
    });
  };

  const removeFile = (
    field: "photos" | "idPhotos" | "coverImage",
    index?: number,
  ) => {
    setFormData((prev) => {
      if (field === "coverImage") {
        return {
          ...prev,
          coverImage: null,
        };
      }
      return {
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      };
    });
  };

  const scrollPhotoCarousel = (direction: "left" | "right") => {
    if (photoCarouselRef.current) {
      const scrollAmount = 140;
      const newScroll =
        photoCarouselRef.current.scrollLeft +
        (direction === "right" ? scrollAmount : -scrollAmount);
      photoCarouselRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
      setPhotoCarouselScroll(newScroll);
    }
  };

  // Base activity features
  const baseActivityFeatures = [
    { label: "Guide", value: "guide", icon: FaUserTie },
    { label: "Equipment", value: "equipment", icon: GiCampCookingPot },
    { label: "Safety Gear", value: "safety_gear", icon: GiBinoculars },
    { label: "Transportation", value: "transportation", icon: GiCruiser },
    { label: "Meals", value: "meals", icon: GiCampCookingPot },
    { label: "Photography", value: "photography", icon: GiBinoculars },
  ];

  const activityFeatureMap: { [key: string]: string[] } = {
    hiking: ["guide", "equipment", "meals", "photography"],
    zipline: ["guide", "equipment", "safety_gear", "transportation"],
    climbing: ["guide", "equipment", "safety_gear"],
    snorkeling: ["guide", "equipment", "safety_gear", "meals"],
    safari: ["guide", "transportation", "meals", "photography"],
    ballooning: ["guide", "transportation", "photography"],
    wildlife: ["guide", "transportation", "photography"],
    bungee: ["guide", "equipment", "safety_gear"],
    water: ["guide", "equipment", "safety_gear", "meals"],
    paragliding: ["guide", "equipment", "safety_gear", "photography"],
    cultural: ["guide", "photography", "meals"],
    camping: ["guide", "equipment", "meals", "transportation"],
    historical: ["guide", "photography", "transportation"],
    museum: ["guide", "photography"],
    birdwatching: ["guide", "photography", "meals"],
    whale: ["guide", "photography", "meals"],
    temple: ["guide", "photography"],
    walking: ["guide", "photography", "meals"],
    nationalparks: ["guide", "photography", "meals", "transportation"],
    jungle: ["guide", "equipment", "meals", "transportation", "photography"],
    yacht: ["guide", "meals", "photography"],
    amusement: ["transportation", "meals"],
    stargazing: ["guide", "photography", "meals"],
  };

  const getActivityFeatures = () => {
    const features: typeof baseActivityFeatures = [...baseActivityFeatures];
    return features;
  };

  const activityFeatures = getActivityFeatures();

  // Disable Next if Terms not accepted on last step
  const canProceed = () => {
    if (currentStep === 8) return formData.termsAccepted;
    return true;
  };



  const businessMapQuery = `
  ${formData.businessCity || ""}
  ${formData.businessState || ""}
  ${formData.businessPincode || ""}
  India
`;

const mapSrcbusiness = `https://www.google.com/maps?q=${encodeURIComponent(
  businessMapQuery
)}&output=embed`;

  const renderImageSrc = (fileOrUrl: any) => {
    if (!fileOrUrl) return "";
    if (typeof fileOrUrl === "string") return getImageUrl(fileOrUrl);
    return URL.createObjectURL(fileOrUrl);
  };

  // Step components rendered conditionally
  return (
    <div className=" w-full  flex flex-col gap-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex h-16 w-full z-30 fixed items-center justify-start px-20 py-5">
        <LogoWebsite />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full flex gap-10 px-6 lg:px-20 pb-20 h-full mt-16">
     
        <div className="flex-1 flex flex-col justify-center mb-20 items-center">
          
          {status === 'rejected' && (
            <div className="w-full max-w-4xl mb-6 p-4 border border-red-200 bg-red-50 rounded-md">
              <h3 className="text-red-800 font-semibold mb-1">Service Rejected</h3>
              <p className="text-red-700 text-sm">
                Reason: {rejectionReason || 'No reason provided'}
              </p>
              <p className="text-red-600 text-xs mt-2">
                Please update the details and resubmit for approval.
              </p>
            </div>
          )}

          {/* Step 0: Activity Types */}
          {currentStep === 0 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
            <h1 className="text-3xl  font-bold text-black dark:text-white text-center">
              Types of Activity
            </h1>

            <div className="max-w-2xl mx-auto flex flex-wrap items-center gap-3 w-full">
              {activityTypes.map((activity) => {
                const isSelected = formData.selectedActivities.includes(activity.id);
                return (
                  <button
                    key={activity.id}
                    onClick={() => toggleActivityType(activity.id)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all ${
                      isSelected
                        ? "bg-gray-200 border-black text-black"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                    type="button"
                  >
                    <span className="text-lg w-[20px] h-[20px]">
                      <img 
                        src={getImageUrl(activity.icon)} 
                        alt={activity.name} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                           // Fallback if image fails or is empty
                           e.currentTarget.style.display = 'none';
                        }}
                      />
                    </span>
                    <span className="text-sm font-medium">{activity.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Features */}
        {currentStep === 1 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-black dark:text-white">
                Activity Features
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                {formData.selectedActivities.length > 0
                  ? `Select features for your ${formData.selectedActivities.length === 1 ? "activity" : "activities"}`
                  : "Select features for your activity"}
              </p>
            </div>

            <div className="max-w-4xl mx-auto flex flex-col gap-6 w-full">
              {/* All features section with custom features displayed first */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {formData.selectedActivities.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                        Select Features
                      </h3>
                      <span className="text-xs bg-gray-100 dark:bg-gray-400 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                        Based on your selection
                      </span>
                    </div>
                  ) : (
                    <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      All Features
                    </h3>
                  )}
                  {!showCustomFeaturesInput && customFeatures.length < 20 && (
                    <button
                      onClick={() => setShowCustomFeaturesInput(true)}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700"
                    >
                      + Add Custom Feature
                    </button>
                  )}
                </div>

                {/* Features display: custom features first, then standard features */}
                <div className="flex flex-wrap gap-3">
                  {/* Custom features */}
                  {customFeatures.map((customFeature, idx) => (
                    <button
                      key={`custom-${idx}`}
                      onClick={() => {
                        setCustomFeatures((prev) =>
                          prev.filter((_, i) => i !== idx),
                        );
                        setFormData((prev) => ({
                          ...prev,
                          features: prev.features.filter(
                            (f) => f !== customFeature,
                          ),
                        }));
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-[48px] border transition-all duration-200 ${
                        formData.features.includes(customFeature)
                          ? "border-[#131313] dark:border-white bg-white dark:bg-gray-800 ring-2 ring-gray-400"
                          : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#131313] dark:hover:border-white"
                      }`}
                    >
                      <div className="w-[22px] h-[22px]">
                        <MoreHorizontal size={16} className="text-gray-600" />
                      </div>
                      <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium">
                        {customFeature}
                      </span>
                      <X
                        size={14}
                        className="text-gray-600 hover:text-red-500"
                      />
                    </button>
                  ))}

                  {/* Standard features */}
                  {activityFeatures.map((feature, idx) => {
                    const isRecommended =
                      formData.selectedActivities.length > 0 &&
                      formData.selectedActivities.some((actId) =>
                        activityFeatureMap[actId]?.includes(feature.value),
                      );
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleFeature(feature.value)}
                        className={`flex items-center gap-3 px-4 py-2 rounded-[48px] border transition-all duration-200 ${
                          formData.features.includes(feature.value)
                            ? "border-[#131313] dark:border-white bg-white dark:bg-gray-800 ring-2 ring-gray-400"
                            : isRecommended
                              ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 hover:border-gray-500"
                              : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#131313] dark:hover:border-white"
                        }`}
                      >
                        <div className="w-[22px] h-[22px]">
                          <feature.icon
                            size={18}
                            className={`${isRecommended ? "text-gray-600" : "text-gray-600"}`}
                          />
                        </div>
                        <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium">
                          {feature.label}
                        </span>
                        {isRecommended && (
                          <span className="text-xs bg-gray-600 text-white px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Admin Features */}
                  {adminFeatures.map((feature, idx) => (
                    <button
                      key={feature.id || `admin-${idx}`}
                      onClick={() => toggleFeature(feature.name)}
                      className={`flex items-center gap-3 px-4 py-2 rounded-[48px] border transition-all duration-200 ${
                        formData.features.includes(feature.name)
                          ? "border-[#131313] dark:border-white bg-white dark:bg-gray-800 ring-2 ring-gray-400"
                          : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#131313] dark:hover:border-white"
                      }`}
                    >
                      <div className="w-[22px] h-[22px]">
                         <img src={getImageUrl(feature.icon)} alt="" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium">
                        {feature.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom features input */}
              {showCustomFeaturesInput && (
                <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customFeatureInput}
                      onChange={(e) => setCustomFeatureInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (
                          e.key === "Enter" &&
                          customFeatureInput.trim() &&
                          customFeatures.length < 20
                        ) {
                          const newFeature = customFeatureInput.trim();
                          setCustomFeatures((prev) => [...prev, newFeature]);
                          setFormData((prev) => ({
                            ...prev,
                            features: [...prev.features, newFeature],
                          }));
                          setCustomFeatureInput("");
                        }
                      }}
                      placeholder="Add custom feature..."
                      maxLength={50}
                      className="flex-1 h-[38px] px-3 py-3 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-plus-jakarta focus:outline-none focus:border-[#131313] dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (
                          customFeatureInput.trim() &&
                          customFeatures.length < 20
                        ) {
                          const newFeature = customFeatureInput.trim();
                          setCustomFeatures((prev) => [...prev, newFeature]);
                          setFormData((prev) => ({
                            ...prev,
                            features: [...prev.features, newFeature],
                          }));
                          setCustomFeatureInput("");
                        }
                      }}
                      disabled={
                        !customFeatureInput.trim() ||
                        customFeatures.length >= 20
                      }
                      className="px-4 py-2 bg-[#131313] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomFeaturesInput(false);
                        setCustomFeatureInput("");
                      }}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                  {/* <p className="text-xs text-gray-500">
                    {customFeatures.length}/20 custom features added
                  </p> */}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Activity Details */}
        {currentStep === 2 && (
          <div className="flex flex-col items-center gap-8 w-full h-full max-w-4xl">
            <h1 className="text-3xl font-bold text-black dark:text-white text-center">
              Activity Details
            </h1>

            <div className="max-w-4xl mx-auto w-full space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 pl-1">
                  <Label className="text-base text-[#334054]">Name</Label>
                </div>
                <div className={`border rounded-lg ${errors.activityName ? "border-red-500" : "border-gray-200"}`}>
                  <Input
                    value={formData.activityName}
                    onChange={(e) =>
                      updateFormData("activityName", e.target.value)
                    }
                    className="border-0 text-sm"
                    placeholder="Name of the Activity"
                    maxLength={50}
                  />
                </div>
                {errors.activityName && (
                  <p className="text-sm text-red-500 pl-1">{errors.activityName}</p>
                )}
                <div className="text-right text-sm text-[#334054]">
                  {formData.activityName.length}/50
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 pl-1">
                  <Label className="text-base text-[#334054]">
                    Descriptions
                  </Label>
                </div>
                <div className={`border rounded-lg ${errors.description ? "border-red-500" : "border-gray-200"}`}>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData("description", e.target.value)
                    }
                    className="w-full h-32 border-0 rounded-lg px-4 py-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="Write here..."
                    maxLength={200}
                  />
                </div>
                {errors.description && (
                  <p className="text-sm text-red-500 pl-1">{errors.description}</p>
                )}
                <div className="text-right text-sm text-[#334054]">
                  {formData.description.length}/200
                </div>
              </div>

              {/* Upload Photos */}
              <div className="space-y-4 w-full bg-white">
                <div className="flex items-center justify-between">
                  <Label className="text-base text-[#334054] flex flex-col">
                    Upload Cover Photo
                    <span className="text-[10px] text-gray-500">
                      Please upload a thumbnail image that highlights your
                      services and features.
                    </span>
                  </Label>
                  <div
                    className={`relative w-60 h-10 border rounded-lg flex items-center justify-center cursor-pointer ${formData.coverImage ? "bg-gray-50" : "hover:bg-gray-50"} ${errors.coverImage ? "border-red-500" : "border-gray-200"}`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCoverImageUpload(e.target.files)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={!!formData.coverImage}
                    />
                    <Plus className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-500 text-sm font-medium">
                      {formData.coverImage ? "1/1 Uploaded" : "Cover Photo"}
                    </span>
                  </div>
                </div>
                {errors.coverImage && (
                  <p className="text-sm text-red-500 pl-1">{errors.coverImage}</p>
                )}

                <div className="w-full relative h-64 max-w-xl border border-gray-200 rounded-xl overflow-hidden">
                  {formData.coverImage ? (
                    <img
                      src={renderImageSrc(formData.coverImage)}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      No image selected
                    </div>
                  )}

                  {formData.coverImage && (
                    <button
                      onClick={() => removeFile("coverImage")}
                      className="absolute top-2 right-2 w-7 h-7 bg-white shadow-md hover:bg-gray-100 rounded-full flex items-center justify-center transition"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-base text-[#334054] flex flex-col">
                    Upload Additional Photos
                    <span className="text-[10px] text-gray-500">
                      Please upload photos that best highlight your services and
                      features
                    </span>
                  </Label>
                  <span className="text-sm text-gray-500">
                    {formData.photos.length}/15 uploaded
                  </span>
                </div>

                <div className={`relative border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors py-8 px-4 text-center cursor-pointer ${errors.photos ? "border-red-500" : "border-gray-300"}`}>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload("photos", e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Plus className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <span className="text-gray-600 text-sm font-medium block">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-gray-400 text-xs block mt-1">
                    PNG, JPG, GIF up to 10MB
                  </span>
                </div>
                {errors.photos && (
                  <p className="text-sm text-red-500 pl-1">{errors.photos}</p>
                )}

                {/* Photo Grid */}
                {formData.photos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">
                      Gallery Photos{" "}
                      {formData.photos.length > 5 &&
                        `(${formData.photos.length} photos)`}
                    </p>
                    {formData.photos.length > 5 ? (
                      <div className="relative group">
                        <div
                          ref={photoCarouselRef}
                          className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
                          onScroll={(e) =>
                            setPhotoCarouselScroll(e.currentTarget.scrollLeft)
                          }
                        >
                          {formData.photos.map((photo, index) => (
                            <div
                              key={index}
                              className="relative w-32 h-32 flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden bg-gray-100 group/photo"
                            >
                              <img
                                src={renderImageSrc(photo)}
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => removeFile("photos", index)}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                type="button"
                                title="Remove photo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => scrollPhotoCarousel("left")}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          type="button"
                          title="Scroll left"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => scrollPhotoCarousel("right")}
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          type="button"
                          title="Scroll right"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {formData.photos.map((photo, index) => (
                          <div
                            key={index}
                            className="relative w-full aspect-square border border-gray-200 rounded-lg overflow-hidden bg-gray-100 group"
                          >
                            <img
                              src={renderImageSrc(photo)}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removeFile("photos", index)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              type="button"
                              title="Remove photo"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rules and Regulations */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base text-[#334054]">
                    Rules & Regulations
                    <span className="text-sm text-gray-500 ml-2">
                      (Optional)
                    </span>
                  </Label>
                </div>

                <div className="space-y-2">
                  {formData.rulesAndRegulations.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <span className="text-sm text-[#4B4B4B] dark:text-gray-300 flex-1 break-words">
                        {rule}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            rulesAndRegulations:
                              prev.rulesAndRegulations.filter(
                                (_, i) => i !== index,
                              ),
                          }));
                        }}
                        className="text-red-500 hover:text-red-700 font-bold px-2 flex-shrink-0 mt-0.5"
                        title="Remove rule"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a rule or regulation..."
                    maxLength={100}
                    value={ruleInput}
                    onChange={(e) => setRuleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const value = ruleInput.trim();
                        if (value) {
                          setFormData((prev) => ({
                            ...prev,
                            rulesAndRegulations: [
                              ...prev.rulesAndRegulations,
                              value,
                            ],
                          }));
                          setRuleInput("");
                        }
                      }
                    }}
                    className="flex-1 h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#121213] focus:outline-none focus:border-[#131313] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const value = ruleInput.trim();
                      if (value) {
                        setFormData((prev) => ({
                          ...prev,
                          rulesAndRegulations: [
                            ...prev.rulesAndRegulations,
                            value,
                          ],
                        }));
                        setRuleInput("");
                      }
                    }}
                    className="px-4 py-2 bg-[#131313] text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Pricing Details */}
        {currentStep === 3 && (
          <div className="flex flex-col items-center gap-4 w-full h-full">
            <h1 className="text-3xl font-bold text-black dark:text-white text-center">
              Pricing Details
            </h1>

            <div className="max-w-4xl mx-auto w-full space-y-6">
              {/* Regular Price */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pl-1">
                  <Label className="text-base text-[#334054]">
                    Regular Price (in Rupees)
                  </Label>
                </div>
                <Input
                  type="number"
                  value={formData.regularPrice}
                  onChange={(e) =>
                    updateFormData("regularPrice", e.target.value)
                  }
                  placeholder=" e.g., 1500"
                  className={`border ${errors.regularPrice ? "border-red-500" : "border-gray-200"}`}
                />
                {errors.regularPrice && (
                  <p className="text-sm text-red-500 pl-1">{errors.regularPrice}</p>
                )}
              </div>

              {/* Person Capacity */}
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="text-base font-semibold text-black">
                      Person Capacity
                    </div>
                    <div className="text-sm text-[#334054]">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        updateFormData(
                          "personCapacity",
                          Math.max(1, formData.personCapacity - 1),
                        )
                      }
                      className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="text-base text-[#334054] w-4 text-center">
                      {formData.personCapacity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateFormData(
                          "personCapacity",
                          formData.personCapacity + 1,
                        )
                      }
                      className="w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Duration */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pl-1">
                  <Label className="text-base text-[#334054]">
                    Time Duration
                  </Label>
                </div>
                <div className="relative border border-gray-200 rounded-lg">
                  <Input
                    value={formData.timeDuration}
                    onChange={(e) =>
                      updateFormData("timeDuration", e.target.value)
                    }
                    className="border-0 pr-10"
                    placeholder="1 hour"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Address with Country (India only) */}
                <div className="flex flex-col gap-5">
                 <div className="flex flex-col gap-2 pl-1">
  <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
    Address
  </label>

 <input
  type="text"
  placeholder="Enter your address"
  value={formData.address}
  onChange={(e) =>
    setFormData((prev) => ({
      ...prev,
      address: e.target.value,
    }))
  }
  className="w-full px-4 py-3 rounded-lg border border-[#EAECF0]"
/>

</div>
                    <div className="w-full flex flex-col gap-5">
                  <div className="w-full flex justify-between gap-5 items-center max-md:flex-wrap">
                    <div className="flex-1 relative">
                      <select
                        name="country"
                        value={formData.locality}
                        onChange={(e) => {
                          const countryVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            locality: countryVal,
                            state: "",
                            city: "", // reset city
                          }));
                        }}
                        className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="India">
                          India
                        </option>
                        {/* Render states from selected country */}
                        {/* {data.map((Country: any, idx: number) => (
                          <option key={idx} value={Country.name} >
                            {Country.name}
                          </option>
                        ))} */}
                       
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 relative">
                      <select
                        name="state"
                        value={formData.state}
                        onChange={(e) => {
                          const stateVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            state: stateVal,
                            city: "", // reset city
                          }));
                        }}
                        className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="" disabled>
                          Select State
                        </option>
                        {/* Render states from selected country */}
                        {data
                          .find((c) => c.name === formData.locality)
                          ?.states?.map((state: any, idx: number) => (
                            <option key={idx} value={state.name}>
                              {state.name}
                            </option>
                          ))}
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 relative">
                      <select
                        name="city"
                        value={formData.city}
                        onChange={(e) => {
                          const cityVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            city: cityVal,
                          }));
                        }}
                        className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="" disabled>
                          Select City
                        </option>
                        {data
                          .find((country) => country.name === formData.locality)
                          ?.states.find((state) => state.name === formData.state)
                          ?.cities.map((city: any, idx: number) => (
                            <option key={idx} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                 <input
  type="text"
  value={formData.pincode}
  onChange={(e) =>
    setFormData((prev) => ({
      ...prev,
      pincode: e.target.value.replace(/\D/g, ""), // only numbers
    }))
  }
  maxLength={6}
  inputMode="numeric"
  placeholder="Pincode"
  className="flex-1 h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
/>

                  </div>
                </div>
                </div>


            
            </div>
          </div>
        )}

        {/* Step 4: Inclusion & Exclusion */}
        {currentStep === 4 && (
          <div className="flex flex-col items-center gap-8 w-full ">
            <h1 className="text-3xl font-bold text-black dark:text-white text-center">
              Inclusion & Exclusion
            </h1>

            <div className="max-w-4xl mx-auto w-full space-y-8">
              {/* Price Includes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pl-1">
                  <Label className="text-base text-[#334054]">
                    Above price includes
                  </Label>
                </div>

                <div className="space-y-2 pl-1">
                  {formData.priceIncludes.map((item, index) => (
                    <div
                      key={index}
                      className="text-base font-semibold text-[#3A3A3A] flex justify-between items-center"
                    >
                      <span>{item}</span>
                 <button
  type="button"
  onClick={() => removeListItem("priceIncludes", index)}
  className="text-red-500 font-bold px-2"
>
  ×
</button>

                    </div>
                  ))}
                </div>

               <Input
  ref={priceIncludeRef}
  placeholder="Text here.."
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addListItem("priceIncludes", priceIncludeRef.current?.value || "");
      if (priceIncludeRef.current) priceIncludeRef.current.value = "";
    }
  }}
/>

<button
  type="button"
  onClick={() => {
    addListItem("priceIncludes", priceIncludeRef.current?.value || "");
    if (priceIncludeRef.current) priceIncludeRef.current.value = "";
  }}
>
  <Plus className="w-3 h-3" />
  Add More
</button>

              </div>

              {/* Price Excludes */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pl-1">
                  <Label className="text-base text-[#334054]">
                    Above price excludes
                  </Label>
                </div>

                <div className="space-y-2">
                  {formData.priceExcludes.map((item, index) => (
                    <div
                      key={index}
                      className="text-base font-semibold text-[#3A3A3A] flex justify-between items-center"
                    >
                      <span>{item}</span>
                     <button
  type="button"
  onClick={() => removeListItem("priceIncludes", index)}
  className="text-red-500 font-bold px-2"
>
  ×
</button>

                    </div>
                  ))}
                </div>

                <Input
  ref={priceExcludeRef }
  placeholder="Text here.."
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addListItem("priceExcludes", priceExcludeRef .current?.value || "");
      if (priceExcludeRef .current) priceExcludeRef .current.value = "";
    }
  }}
/>

<button
  type="button"
  onClick={() => {
    addListItem("priceExcludes", priceExcludeRef .current?.value || "");
    if (priceExcludeRef .current) priceExcludeRef .current.value = "";
  }}
>
  <Plus className="w-3 h-3" />
  Add More
</button>

              </div>

              {/* Expectations */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pl-1">
                  <Label className="text-base text-[#334054]">
                    What expected from enjoyer
                  </Label>
                </div>

                <div className="space-y-2">
                  {formData.expectations.map((item, index) => (
                    <div
                      key={index}
                      className="text-base font-semibold text-[#3A3A3A] flex justify-between items-center"
                    >
                      <span>{item}</span>
                    <button
  type="button"
  onClick={() => removeListItem("priceIncludes", index)}
  className="text-red-500 font-bold px-2"
>
  ×
</button>

                    </div>
                  ))}
                </div>

              <Input
  ref={expectationRef }
  placeholder="Text here.."
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addListItem("expectations", expectationRef .current?.value || "");
      if (expectationRef .current) expectationRef .current.value = "";
    }
  }}
/>

<button
  type="button"
  onClick={() => {
    addListItem("expectations", expectationRef .current?.value || "");
    if (expectationRef .current) expectationRef .current.value = "";
  }}expectationRef 
>
  <Plus className="w-3 h-3" />
  Add More
</button>

              </div>
            </div>
          </div>
        )}

        {/* Step 5: Types of Discount */}
        {currentStep === 5 && (
          <div className="flex flex-col items-center gap-8 w-full">
            <h1 className="text-3xl font-bold text-black dark:text-white text-center">
              Types of Discount
            </h1>

            <div className="max-w-4xl mx-auto w-full space-y-4">
              {/* First 5 User Discount */}
              <div className="border border-gray-200 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#334054]">
                    First 5 User Discount
                  </span>
                  <label
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.firstUserDiscount ? "bg-gray-600" : "bg-gray-300"}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.firstUserDiscount}
                      onChange={(e) =>
                        updateFormData("firstUserDiscount", e.target.checked)
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.firstUserDiscount ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </label>
                </div>

                <hr
                  className="border-gray-200"
                  style={{ borderStyle: "dashed" }}
                />

                {formData.firstUserDiscount && (
                  <div className="grid grid-cols-3 gap-5">
                    <div className="space-y-3">
                      <Label className="text-base text-[#334054]">
                        Discount Type
                      </Label>
                      <div className={`relative border rounded-lg ${errors.discountType ? "border-red-500" : "border-gray-400"}`}>
                        <select
                          value={formData.discountType}
                          onChange={(e) =>
                            updateFormData("discountType", e.target.value)
                          }
                          className="w-full h-10 px-3 rounded-lg appearance-none bg-transparent text-gray-600 focus:outline-none"
                        >
                            <option value="Percentage">Percentage</option>
                            <option value="Fixed">Fixed Amount</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.discountType && <p className="text-xs text-red-500">{errors.discountType}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base text-[#334054]">
                        Discount Percentage
                      </Label>
                      <Input
                        type="number"
                        maxLength={formData.discountType === 'Percentage' ? 2 : 10}
                        value={formData.discountAmount}
                        onChange={(e) =>
                          updateFormData("discountAmount", e.target.value)
                        }
                        className={`border text-gray-600 ${errors.discountAmount ? "border-red-500" : "border-gray-400"}`}
                        placeholder={formData.discountType === 'Percentage' ? "10%" : "2000"}
                      />
                      {errors.discountAmount && <p className="text-xs text-red-500">{errors.discountAmount}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base text-[#334054]">
                        Final Price
                      </Label>
                      <Input
                        type="number"
                        value={formData.finalPrice}
                        onChange={(e) =>
                          updateFormData("finalPrice", e.target.value)
                        }
                        className={`border text-gray-600 ${errors.finalPrice ? "border-red-500" : "border-gray-400"}`}
                        placeholder="Enter Final Price"
                      />
                      {errors.finalPrice && <p className="text-xs text-red-500">{errors.finalPrice}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Festival Offers */}
              <div className="border border-gray-200 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#334054]">
                    Festival Offers
                  </span>
                  <label
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.festivalOffers ? "bg-gray-600" : "bg-gray-300"}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.festivalOffers}
                      onChange={(e) =>
                        updateFormData("festivalOffers", e.target.checked)
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.festivalOffers ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </label>
                </div>

                {formData.festivalOffers && (
                  <>
                    <hr
                      className="border-gray-200"
                      style={{ borderStyle: "dashed" }}
                    />
                    <div className="grid grid-cols-3 gap-5">
                      <div className="space-y-3">
                        <Label className="text-base text-[#334054]">
                          Discount Type
                        </Label>
                        <div className={`relative border rounded-lg ${errors.festivalDiscountType ? "border-red-500" : "border-gray-400"}`}>
                          <select
                            value={formData.festivalDiscountType}
                            onChange={(e) =>
                              updateFormData("festivalDiscountType", e.target.value)
                            }
                            className="w-full h-10 px-3 rounded-lg appearance-none bg-transparent text-gray-600 focus:outline-none"
                          >
                              <option value="Percentage">Percentage</option>
                              <option value="Fixed">Fixed Amount</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.festivalDiscountType && <p className="text-xs text-red-500">{errors.festivalDiscountType}</p>}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base text-[#334054]">
                          Discount Percentage
                        </Label>
                        <Input
                          type="number"
                          maxLength={formData.festivalDiscountType === 'Percentage' ? 2 : 10}
                          value={formData.festivalDiscountAmount}
                          onChange={(e) =>
                            updateFormData("festivalDiscountAmount", e.target.value)
                          }
                          className={`border text-gray-600 ${errors.festivalDiscountAmount ? "border-red-500" : "border-gray-400"}`}
                          placeholder={formData.festivalDiscountType === 'Percentage' ? "10%" : "2000"}
                        />
                        {errors.festivalDiscountAmount && <p className="text-xs text-red-500">{errors.festivalDiscountAmount}</p>}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base text-[#334054]">
                          Final Price
                        </Label>
                        <Input
                          type="number"
                          value={formData.festivalFinalPrice}
                          onChange={(e) =>
                            updateFormData("festivalFinalPrice", e.target.value)
                          }
                          className={`border text-gray-600 ${errors.festivalFinalPrice ? "border-red-500" : "border-gray-400"}`}
                          placeholder="₹ 2000"
                        />
                        {errors.festivalFinalPrice && <p className="text-xs text-red-500">{errors.festivalFinalPrice}</p>}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Weekly or Monthly Offers */}
              <div className="border border-gray-200 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#334054]">
                    Weekly or Monthly Offers
                  </span>
                  <label
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.weeklyOffers ? "bg-gray-600" : "bg-gray-300"}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.weeklyOffers}
                      onChange={(e) =>
                        updateFormData("weeklyOffers", e.target.checked)
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.weeklyOffers ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </label>
                </div>

                {formData.weeklyOffers && (
                  <>
                    <hr
                      className="border-gray-200"
                      style={{ borderStyle: "dashed" }}
                    />
                    <div className="grid grid-cols-3 gap-5">
                      <div className="space-y-3">
                        <Label className="text-base text-[#334054]">
                          Discount Type
                        </Label>
                        <div className={`relative border rounded-lg ${errors.weeklyDiscountType ? "border-red-500" : "border-gray-400"}`}>
                          <select
                            value={formData.weeklyDiscountType}
                            onChange={(e) =>
                              updateFormData("weeklyDiscountType", e.target.value)
                            }
                            className="w-full h-10 px-3 rounded-lg appearance-none bg-transparent text-gray-600 focus:outline-none"
                          >
                              <option value="Percentage">Percentage</option>
                              <option value="Fixed">Fixed Amount</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.weeklyDiscountType && <p className="text-xs text-red-500">{errors.weeklyDiscountType}</p>}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base text-[#334054]">
                          Discount Percentage
                        </Label>
                        <Input
                          type="number"
                          maxLength={formData.weeklyDiscountType === 'Percentage' ? 2 : 10}
                          value={formData.weeklyDiscountAmount}
                          onChange={(e) =>
                            updateFormData("weeklyDiscountAmount", e.target.value)
                          }
                          className={`border text-gray-600 ${errors.weeklyDiscountAmount ? "border-red-500" : "border-gray-400"}`}
                          placeholder={formData.weeklyDiscountType === 'Percentage' ? "10%" : "2000"}
                        />
                        {errors.weeklyDiscountAmount && <p className="text-xs text-red-500">{errors.weeklyDiscountAmount}</p>}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base text-[#334054]">
                          Final Price
                        </Label>
                        <Input
                          type="number"
                          value={formData.weeklyFinalPrice}
                          onChange={(e) =>
                            updateFormData("weeklyFinalPrice", e.target.value)
                          }
                          className={`border text-gray-600 ${errors.weeklyFinalPrice ? "border-red-500" : "border-gray-400"}`}
                          placeholder="₹ 2000"
                        />
                        {errors.weeklyFinalPrice && <p className="text-xs text-red-500">{errors.weeklyFinalPrice}</p>}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Special Offers */}
              <div className="border border-gray-200 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#334054]">
                    Special Offers
                  </span>
                  <label
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.specialOffers ? "bg-gray-600" : "bg-gray-300"}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.specialOffers}
                      onChange={(e) =>
                        updateFormData("specialOffers", e.target.checked)
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.specialOffers ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </label>
                </div>

                {formData.specialOffers && (
                  <>
                    <hr
                      className="border-gray-200"
                      style={{ borderStyle: "dashed" }}
                    />
                    <div className="grid grid-cols-3 gap-5">
                      <div className="space-y-3">
                        <Label className="text-base text-[#334054]">
                          Discount Type
                        </Label>
                        <div className={`relative border rounded-lg ${errors.specialDiscountType ? "border-red-500" : "border-gray-400"}`}>
                          <select
                            value={formData.specialDiscountType}
                            onChange={(e) =>
                              updateFormData("specialDiscountType", e.target.value)
                            }
                            className="w-full h-10 px-3 rounded-lg appearance-none bg-transparent text-gray-600 focus:outline-none"
                          >
                              <option value="Percentage">Percentage</option>
                              <option value="Fixed">Fixed Amount</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.specialDiscountType && <p className="text-xs text-red-500">{errors.specialDiscountType}</p>}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base text-[#334054]">
                          Discount Percentage
                        </Label>
                        <Input
                          type="number"
                          maxLength={formData.specialDiscountType === 'Percentage' ? 2 : 10}
                          value={formData.specialDiscountAmount}
                          onChange={(e) =>
                            updateFormData("specialDiscountAmount", e.target.value)
                          }
                          className={`border text-gray-600 ${errors.specialDiscountAmount ? "border-red-500" : "border-gray-400"}`}
                          placeholder={formData.specialDiscountType === 'Percentage' ? "10%" : "2000"}
                        />
                        {errors.specialDiscountAmount && <p className="text-xs text-red-500">{errors.specialDiscountAmount}</p>}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-base text-[#334054]">
                          Final Price
                        </Label>
                        <Input
                          type="number"
                          value={formData.specialFinalPrice}
                          onChange={(e) =>
                            updateFormData("specialFinalPrice", e.target.value)
                          }
                          className={`border text-gray-600 ${errors.specialFinalPrice ? "border-red-500" : "border-gray-400"}`}
                          placeholder="₹ 2000"
                        />
                        {errors.specialFinalPrice && <p className="text-xs text-red-500">{errors.specialFinalPrice}</p>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Business Details */}
        {currentStep === 6 && (
          <div className="flex flex-col items-center gap-8 w-full">
            <h1 className="text-3xl font-bold text-black dark:text-white text-center">
              Business Details
            </h1>

            <div className="max-w-4xl mx-auto w-full space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">
                    Brand Name
                  </Label>
                  <Input
                    value={formData.brandName}
                    onChange={(e) =>
                      updateFormData("brandName", e.target.value)
                    }
                    className={`border ${errors.brandName ? "border-red-500" : "border-gray-200"}`}
                    placeholder="Enter Your Brand Name"
                  />
                  {errors.brandName && <p className="text-xs text-red-500 pl-1">{errors.brandName}</p>}
                </div>
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">
                    Legal Company Name
                  </Label>
                  <Input
                    value={formData.legalCompanyName}
                    onChange={(e) =>
                      updateFormData("legalCompanyName", e.target.value)
                    }
                    className={`border ${errors.legalCompanyName ? "border-red-500" : "border-gray-200"}`}
                    placeholder="Enter Your Company Name"
                  />
                  {errors.legalCompanyName && <p className="text-xs text-red-500 pl-1">{errors.legalCompanyName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">
                    GST Number
                  </Label>
                  <Input
                    value={formData.gstNumber}
                    onChange={(e) =>
                      updateFormData("gstNumber", e.target.value)
                    }
                    className="border border-gray-200"
                    placeholder=" GST Number (Optional)"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">
                    Business Email ID
                  </Label>
                  <Input
                    value={formData.businessEmail}
                    onChange={(e) =>
                      updateFormData("businessEmail", e.target.value)
                    }
                    className="border border-gray-200"
                    placeholder="Enter Business Email ID (Optional)"
                  />
                </div>
              </div>

              <div className="w-1/2 space-y-3">
                <Label className="text-base text-[#334054] pl-1">
                  Business Phone number
                </Label>
                <div className="flex items-center gap-3">
                  <div className="border h-10 border-gray-200 rounded-lg px-3 py-3 flex items-center gap-1">
                    <span className="text-lg">🇮🇳</span>

                    <span className="text-base text-gray-400">+91</span>
                  </div>
                  <Input
                    value={formData.businessPhone}
                    onChange={(e) =>
                      updateFormData("businessPhone", e.target.value)
                    }
                    className={`border h-10 ${errors.businessPhone ? "border-red-500" : "border-gray-200"}`}
                    placeholder="6029 43934"
                    maxLength={10}
                  />
                </div>
                {errors.businessPhone && <p className="text-xs text-red-500 pl-1">{errors.businessPhone}</p>}
              </div>

              <div className="space-y-4">
                <Label className="text-base text-[#334054] pl-1">
                  Business Address
                </Label>
                <div className="space-y-5">
                  {/* City & State */}
                  <div className="grid grid-cols-2 gap-5">
                    {/* Country Select */}
                    <div className="relative">
                      <select
                        name="country"
                        value={formData.businessLocality}
                        onChange={(e) => {
                          updateFormData(
                            "businessLocality",
                            formData.businessLocality,
                          );
                          // Reset dependent fields on country change
                          updateFormData("businessState", "");
                          updateFormData("businessCity", "");
                        }}
                        className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-gray-100 dark:bg-gray-700 cursor-not-allowed appearance-none"
                      >
                        <option value="India" disabled>
                          India
                        </option>
                        {/* {data.map((country: any, idx: number) => (
      <option key={idx} value={country.name}>
        {country.name}
      </option>
    ))} */}
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    {/* State Select */}
                    <div className="relative">
                      <select
                        name="state"
                        value={formData.businessState}
                        onChange={(e) => {
                          const stateVal = e.target.value;
                          updateFormData("businessState", stateVal);
                          // Reset city when state changes
                          updateFormData("businessCity", "");
                        }}
                        disabled={!formData.businessLocality}
                        className={`w-full h-[50px] px-3  border rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none ${errors.businessState ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"}`}
                      >
                        <option value="" disabled>
                          Select State
                        </option>
                        {data
                          .find(
                            (c: any) => c.name === formData.businessLocality,
                          )
                          ?.states?.map((state: any, idx: number) => (
                            <option key={idx} value={state.name}>
                              {state.name}
                            </option>
                          ))}
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                       {errors.businessState && <p className="absolute -bottom-5 text-xs text-red-500">{errors.businessState}</p>}
                    </div>

                    {/* City Select */}
                    <div className="relative">
                      <select
                        name="city"
                        value={formData.businessCity}
                        onChange={(e) =>
                          updateFormData("businessCity", e.target.value)
                        }
                        disabled={!formData.businessState}
                        className={`w-full h-[50px] px-3 border rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none ${errors.businessCity ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"}`}
                      >
                        <option value="" disabled>
                          Select City
                        </option>
                        {data
                          .find(
                            (country: any) =>
                              country.name === formData.businessLocality,
                          )
                          ?.states.find(
                            (state: any) =>
                              state.name === formData.businessState,
                          )
                          ?.cities.map((city: any, idx: number) => (
                            <option key={idx} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {errors.businessCity && <p className="absolute -bottom-5 text-xs text-red-500">{errors.businessCity}</p>}
                    </div>
                    {/* Locality & Pincode */}
                    <div className="flex flex-col gap-1">
                      <Input
                        value={formData.businessPincode}
                        onChange={(e) =>
                          updateFormData("businessPincode", e.target.value)
                        }
                        className={`border w-56 ${errors.businessPincode ? "border-red-500" : "border-gray-200"}`}
                        placeholder="Pincode"
                        maxLength={6}
                      />
                      {errors.businessPincode && <p className="text-xs text-red-500">{errors.businessPincode}</p>}
                    </div>
                  </div>
                </div>
              </div>
                        {/* Map Integration */}
               <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
  <iframe
    src={mapSrcbusiness}
    width="100%"
    height="100%"
    style={{ border: 0 }}
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    title="Selected Location Map"
  />
</div>
            </div>
            
          </div>
        )}

        {/* Step 7: Personal Details */}
        {currentStep === 7 && (
          <div className="flex mt-10  flex-col items-center gap-10 ">
            <h1 className="text-3xl font-bold text-black dark:text-white text-center">
              Personal Details
            </h1>

            <div className=" mx-auto w-full space-y-5">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label className="text-base text-[#334054] pl-1">
                    First Name
                  </Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      updateFormData("firstName", e.target.value)
                    }
                    className={`border ${errors.firstName ? "border-red-500" : "border-gray-200"}`}
                    placeholder="Enter Your First Name"
                  />
                  {errors.firstName && <p className="text-xs text-red-500 pl-1">{errors.firstName}</p>}
                </div>
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">
                    Last Name
                  </Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => updateFormData("lastName", e.target.value)}
                    className={`border ${errors.lastName ? "border-red-500" : "border-gray-200"}`}
                    placeholder="Enter Your Last Name"
                  />
                  {errors.lastName && <p className="text-xs text-red-500 pl-1">{errors.lastName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">
                    Date of Birth
                  </Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      updateFormData("dateOfBirth", e.target.value)
                    }
                    className="border border-gray-200"
                    placeholder="04/02/2002"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">
                    Marital Status
                  </Label>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 w-full"
                    value={formData.maritalStatus}
                    onChange={(e) =>
                      updateFormData("maritalStatus", e.target.value)
                    }
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {/* ID Proof */}
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">
                    ID Proof
                  </Label>
                  <select
                    className="border border-gray-200 rounded-lg px-3 py-2 w-full"
                    value={formData.idProof}
                    onChange={(e) => updateFormData("idProof", e.target.value)}
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    <option value="aadhar">Aadhar Card</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                  </select>
                </div>

                {/* ID Photos */}
                <div className="flex flex-col gap-5">
                  <Label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                    ID Photos
                  </Label>
                  <div className={`w-[242px] h-[175px] flex flex-col items-center justify-center gap-4 bg-[#F9FAFB] dark:bg-gray-800 rounded-xl border ${errors.idPhotos ? "border-red-500" : "border-gray-200 dark:border-gray-600"} relative overflow-hidden`}>
                    {formData.idPhotos.length > 0 ? (
                      <img 
                        src={renderImageSrc(formData.idPhotos[0])} 
                        alt="ID Proof" 
                        className="w-full h-full object-cover absolute top-0 left-0"
                      />
                    ) : (
                      <>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1.125 9H16.875"
                            stroke="#98A2B3"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9 16.875L9 1.125"
                            stroke="#98A2B3"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-sm text-black font-['Plus_Jakarta_Sans'] z-1">
                          Upload Here
                        </span>
                      </>
                    )}
                    
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      multiple
                      onChange={(e) => handleFileUpload("idPhotos", e.target.files)}
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                        left: 0,
                        top: 0,
                        zIndex: 10,
                      }}
                    />
                  </div>
                  {errors.idPhotos && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.idPhotos}
                    </p>
                  )}
                  
                  {/* Thumbnails for all photos */}
                  {formData.idPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2 w-full max-w-lg">
                      {formData.idPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative w-16 h-16 border border-gray-300 rounded-lg overflow-hidden"
                        >
                          <img
                            src={renderImageSrc(photo)}
                            alt={`ID Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile("idPhotos", index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-red-500 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">
                    Country
                  </Label>
                  {/* Country Select */}
                  <div className="relative">
                    <select
                      name="country"
                      value={formData.personalLocality}
                      onChange={(e) => {
                        // const countryVal = e.target.value;
                        updateFormData("personalLocality", "India");
                        // Reset state and city when country changes
                        updateFormData("personalState", "");
                        updateFormData("personalCity", "");
                      }}
                      className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-gray-100 dark:bg-gray-700 cursor-not-allowed appearance-none"
                    >
                      <option value="India">India</option>
                      {/* {data.map((country: any, idx: number) => (
                      <option key={idx} value={country.name}>
                        {country.name}
                      </option>
                    ))} */}
                    </select>
                    <svg
                      className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                      viewBox="0 0 18 18"
                      fill="none"
                    >
                      <path
                        d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                        stroke="#292D32"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">State</Label>

                  {/* State Select */}
                  <div className="relative">
                    <select
                      name="state"
                      value={formData.personalState}
                      onChange={(e) => {
                        const stateVal = e.target.value;
                        updateFormData("personalState", stateVal);
                        // Reset city when state changes
                        updateFormData("personalCity", "");
                      }}
                      disabled={!formData.personalLocality}
                      className={`w-full h-[50px] px-3  border rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none ${errors.personalState ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"}`}
                    >
                      <option value="" disabled>
                        Select State
                      </option>
                      {data
                        .find((c: any) => c.name === formData.personalLocality)
                        ?.states?.map((state: any, idx: number) => (
                          <option key={idx} value={state.name}>
                            {state.name}
                          </option>
                        ))}
                    </select>
                    <svg
                      className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                      viewBox="0 0 18 18"
                      fill="none"
                    >
                      <path
                        d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                        stroke="#292D32"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {errors.personalState && <p className="absolute -bottom-5 text-xs text-red-500">{errors.personalState}</p>}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">City</Label>

                  {/* City Select */}
                  <div className="relative">
                    <select
                      name="city"
                      value={formData.personalCity}
                      onChange={(e) =>
                        updateFormData("personalCity", e.target.value)
                      }
                      disabled={!formData.personalState}
                      className={`w-full h-[50px] px-3  border rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none ${errors.personalCity ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"}`}
                    >
                      <option value="" disabled>
                        Select City
                      </option>
                      {data
                        .find(
                          (country: any) =>
                            country.name === formData.personalLocality,
                        )
                        ?.states.find(
                          (state: any) => state.name === formData.personalState,
                        )
                        ?.cities.map((city: any, idx: number) => (
                          <option key={idx} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                    </select>
                    <svg
                      className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                      viewBox="0 0 18 18"
                      fill="none"
                    >
                      <path
                        d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                        stroke="#292D32"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {errors.personalCity && <p className="absolute -bottom-5 text-xs text-red-500">{errors.personalCity}</p>}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-base text-[#334054] pl-1">
                    Pincode
                  </Label>
                  <Input
                    value={formData.personalPincode}
                    onChange={(e) =>
                      updateFormData("personalPincode", e.target.value)
                    }
                    className={`border ${errors.personalPincode ? "border-red-500" : "border-gray-200"}`}
                    placeholder="Pincode"
                    maxLength={6}
                  />
                  {errors.personalPincode && <p className="text-xs text-red-500 pl-1">{errors.personalPincode}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 8: Terms & Conditions */}
   {currentStep === 8 && (
  <div className=" flex flex-col md:flex-row gap-6 max-h-screen overflow-y-auto scrollbar-hide p-4">

    {/* Left Content */}
    <div className="flex-1 flex flex-col gap-4">
      <h1 className="text-[32px] md:text-[32px] text-base font-bold text-[#1C2939] dark:text-white">
        Terms & Conditions for Verification
      </h1>

      <p className="text-sm md:text-base text-[#485467] dark:text-gray-400 leading-[155%]">
        By proceeding with the verification process on{" "}
        <span className="font-bold text-[#1C2939] dark:text-white">
          Travel Homes
        </span>
        , you agree to the following terms and conditions:
      </p>

      {/* Terms */}
      <div className="space-y-2">
        <p className="text-sm md:text-base leading-[155%]">
          <span className="font-bold text-[#101828] dark:text-white">
            1. Accurate Information
          </span>
          <span className="text-[#334054] dark:text-gray-300">
            {" "}– Provide truthful details; false information may lead to account suspension.
          </span>
        </p>

        <p className="text-sm md:text-base leading-[155%]">
          <span className="font-bold text-[#101828] dark:text-white">
            2. Data Usage & Security
          </span>
          <span className="text-[#334054] dark:text-gray-300">
            {" "}– Your data is securely stored and used only for verification; third-party services may assist.
          </span>
        </p>

        <p className="text-sm md:text-base leading-[155%]">
          <span className="font-bold text-[#101828] dark:text-white">
            3. Verification Rights
          </span>
          <span className="text-[#334054] dark:text-gray-300">
            {" "}– Verification may be denied if information is invalid; terms may change.
          </span>
        </p>
      </div>

      {/* Checkbox & Button */}
      <div className="flex flex-col gap-6 mt-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="terms"
            checked={formData.termsAccepted}
            onCheckedChange={(checked) =>
              updateFormData("termsAccepted", Boolean(checked))
            }
          />
          <Label
            htmlFor="terms"
            className="text-sm font-medium text-[#1C2939] dark:text-gray-300"
          >
            I accept the terms and conditions
          </Label>
        </div>

        
      </div>
    </div>

    {/* Right Image */}
    <div className="flex justify-center items-center md:pb-4">
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/7e591c21d8b3bea0e51f3c5c2a65a03538099697?width=1000"
        alt="Verification Illustration"
        className="w-[280px] md:w-[500px] h-auto object-contain"
      />
    </div>
  </div>
)}

      </div>

      {/* Footer */}
      <div className="flex  w-full z-30 fixed items-center justify-center bottom-0 left-0 lg:px-20 py-4 lg:py-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg">
        <div className="w-4xl  flex gap-5 items-center justify-center w-full ">
          {currentStep === 8 ? (
            <div className="flex items-center gap-3 order-2">
            <button
          onClick={handleBack}
          className="text-[13px] flex items-center gap-2 px-8 py-2 rounded-[60px] border border-gray-300 dark:border-gray-600"
        >
          <span>Back</span>
        </button>
            <Button
          type="button"
          onClick={handleNext}
          disabled={isLoading || !formData.termsAccepted}
          className="w-fit px-8 py-[14px] rounded-full bg-[#131313] text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? "Loading..." : "Start Verification"}
        </Button>
        </div>) :
        (
          <>
          <div className="flex items-center max-md:flex-col gap-6 order-1">
            <span className="text-lg font-bold text-black">
              {currentStep + 1}/8 Completed
            </span>
            <div className="flex items-center gap-1.5 w-72">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${
                    i <= currentStep ? "bg-black" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 order-2">
            <button
          onClick={handleBack}
          className="text-[13px] flex items-center gap-2 px-8 py-2 rounded-[60px] border border-gray-300 dark:border-gray-600"
        >
          <span>Back</span>
        </button>

            <Button
              onClick={handleNext}
              className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800"
              type="button"
              disabled={isLoading || !canProceed()}
            >
              {isLoading
                ? "Loading..."
                : currentStep === 7
                  ? "Complete"
                  : "Next"}
            </Button>
          </div>
          </>
        )
        }
        </div>
      </div>
    </div>
    </div>
  );
};

export default ActivityOnboarding;
