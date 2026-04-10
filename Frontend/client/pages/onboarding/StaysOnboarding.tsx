import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { cmsPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { ArrowLeft, ChevronUp, ChevronDown, Plus, Minus, X } from "lucide-react";
import { toast } from "sonner";
import LogoWebsite from "@/components/ui/LogoWebsite";
import e from "express";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { Country } from "country-state-city";
import * as Flags from "country-flag-icons/react/3x2";
import { submitOnboardingData, getOnboardingData, offersApi } from "@/lib/api";
import { onboardingService } from "@/lib/onboardingService";
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
} from "lucide-react";
import { FaUserTie } from "react-icons/fa";
import { useUserDetails } from "@/hooks/useUserDetails";


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

// Property types data with icons - now fetched from API
// const propertyTypes = [...]; 

// Property categories based on property types
const propertyCategories: Record<string, { id: string; name: string; icon: string }[]> = {
  villa: [
    // { id: "luxury", name: "Luxury Villa", icon: "🏰" },
    // { id: "beachfront", name: "Beachfront Villa", icon: "🏖️" },
    // { id: "mountain", name: "Mountain Villa", icon: "🏔️" },
    // { id: "private", name: "Private Villa", icon: "🏡" },
  ],
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
  // treehouse: [
  //   { id: "luxury", name: "Luxury Treehouse", icon: "🏰" },
  //   { id: "adventure", name: "Adventure Treehouse", icon: "🧗" },
  //   { id: "family", name: "Family Treehouse", icon: "👨‍👩‍👧‍👦" },
  // ],
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
  const baseFeatures = [
   
  ];

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

    // Add property-specific features
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
    const roomFeatures = [
      ...baseFeatures,
     
    ];

    // Add property-specific room features
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
  const { updateUserType, isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Check if Unique Stays section is enabled
    cmsPublicApi.listHomepageSections().then((sections) => {
      const section = sections.find((s: any) => s.sectionKey === 'unique-stays');
      if (section && !section.isVisible) {
        toast.error("Stays onboarding is currently disabled.");
        navigate("/");
      }
    }).catch(console.error);

    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [stayType, setStayType] = useState<"entire" | "individual">("entire");

  // Rules and regulations state
  const [entireStayRules, setEntireStayRules] = useState<string[]>([""]);
  const [roomRules, setRoomRules] = useState<Record<string, string[]>>({});
  const [optionalRules, setOptionalRules] = useState<string[]>([""]);
  const [guestCapacity, setGuestCapacity] = useState(0);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [numberOfBeds, setNumberOfBeds] = useState(0);
  const [numberOfBathrooms, setNumberOfBathrooms] = useState(0);
  const [regularPrice, setRegularPrice] = useState("");
  const [rooms, setRooms] = useState<Room[]>([
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
  
  ]);
  const [expandedRoom, setExpandedRoom] = useState<string>("1");

  // Features state
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");
  const [adminFeatures, setAdminFeatures] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, any[]>>({});

  // Discount state
  const [firstUserDiscount, setFirstUserDiscount] = useState(true);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [festivalOffers, setFestivalOffers] = useState(false);
  const [weeklyOffers, setWeeklyOffers] = useState(false);
  const [specialOffers, setSpecialOffers] = useState(false);

  // Business Details state
  const [brandName, setBrandName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [locality, setLocality] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [businessPincode, setBusinessPincode] = useState("");
  const [personalPincode, setPersonalPincode] = useState("");

  // Personal Details state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [personalCountry, setPersonalCountry] = useState("India");
  const [personalState, setPersonalState] = useState("");
  const [personalCity, setPersonalCity] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [idProof, setIdProof] = useState("");
  const [idProofImage, setIdProofImage] = useState<string | null>(null);
  const [images, setImages] = useState<(string | null)[]>(Array(5).fill(null));
  const [entireStayImages, setEntireStayImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selected, setSelected] = useState<CountryOption | null>(
    countries[100],
  );
  const [open, setOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { userDetails, updateUserDetails } = useUserDetails();

  const totalSteps = 8;
  const completedSteps = currentStep;
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [status, setStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const [fileName, setFileName] = useState("");
  const [data, setData] = useState([]);
  const [countryOption, setCoutryOption] = useState("India");
  const [countryOption2, setCoutryOption2] = useState("India");
  const [stateOption, setStateOption] = useState("");
  const [stateOption2, setStateOption2] = useState("");
  const [cityOption, setCityOptions] = useState("");
  const [cityOption2, setCityOptions2] = useState("");

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

  // Populate country list on mount
  useEffect(() => {
    fetch("/countries_states_cities.json") // remove ../../.. for public/ path
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Failed to load countries:", err));

    // Fetch admin features (amenities)
    cmsPublicApi.getFeatures("Unique Stay").then(list => {
      // Filter for features or items without type (legacy)
      setAdminFeatures(list.filter((f: any) => f.status === 'enable' && (!f.type || f.type === 'feature')));
    }).catch(console.error);

    // Fetch property types (categories)
    cmsPublicApi.getFeatures("Unique Stay", "category").then(list => {
      const types = list
        .filter((f: any) => f.status === 'enable')
        .map((f: any) => ({
           id: f.name.toLowerCase(),
           realId: f.id || f._id,
           name: f.name,
           icon: f.icon
        }));
      setPropertyTypes(types);

      // Fetch dynamic sub-categories for each property type
      types.forEach((type: any) => {
        if (type.realId) {
          cmsPublicApi.getFeatures(type.realId, "subcategory").then(subs => {
             if (subs && subs.length > 0) {
               setSubCategoriesMap(prev => ({
                 ...prev,
                 [type.id]: subs.map((s: any) => ({
                    id: s.name.toLowerCase().replace(/\s+/g, '-'),
                    name: s.name,
                    icon: s.icon
                 }))
               }));
             }
          }).catch(console.error);
        }
      });

    }).catch(console.error);

    // Check for existing data
    const loadExistingData = async () => {
      try {
        const data = await getOnboardingData();
        
        // Enforce single pending service - REMOVED per user request to allow multiple service creation
        // if (data && data.doc && ['pending', 'draft', 'rejected'].includes(data.doc.status)) {
        //     if (data.type !== 'stay') {
        //       toast.info(`You have a pending ${data.type} application. Please complete it first.`);
        //       navigate(`/onboarding/${data.type}`);
        //       return;
        //     }
        // }

        if (data && data.type === 'stay' && data.doc && ['pending', 'draft', 'rejected'].includes(data.doc.status)) {
          const doc = data.doc;
          console.log('Loading existing stay data:', doc);

          console.log('status:', doc.status);
          setStatus(doc.status);
          console.log('rejectionReason:', doc.rejectionReason);
          setRejectionReason(doc.rejectionReason || "");

          console.log('selectedProperties:', doc.selectedProperties);
          setSelectedProperties(doc.selectedProperties || []);
          console.log('selectedCategories:', doc.selectedCategories);
          setSelectedCategories(doc.selectedCategories || []);
          console.log('stayType:', doc.stayType);
          setStayType(doc.stayType || "entire");
          console.log('guestCapacity:', doc.guestCapacity);
          setGuestCapacity(doc.guestCapacity || 0);
          console.log('numberOfRooms:', doc.numberOfRooms);
          setNumberOfRooms(doc.numberOfRooms || 0);
          console.log('numberOfBeds:', doc.numberOfBeds);
          setNumberOfBeds(doc.numberOfBeds || 0);
          console.log('numberOfBathrooms:', doc.numberOfBathrooms);
          setNumberOfBathrooms(doc.numberOfBathrooms || 0);
          console.log('regularPrice:', doc.regularPrice);
          setRegularPrice(String(doc.regularPrice || ""));
          
          console.log('rooms:', doc.rooms);
          if (doc.rooms && doc.rooms.length > 0) {
            setRooms(doc.rooms);
            setCoverImage(doc.coverImage || null);
            // Handle images
            if (doc.stayType === 'entire') {
               console.log('entireStayImages:', doc.images);
               const imgs = doc.images || [];
               setEntireStayImages(imgs);
            } else {
               console.log('images (room):', doc.rooms[0]?.photos);
               const imgs = doc.rooms[0]?.photos || [];
               setImages([...imgs, ...Array(Math.max(0, 5 - imgs.length)).fill(null)]);
            }
          }
          
          console.log('selectedFeatures:', doc.selectedFeatures);
          setSelectedFeatures(doc.selectedFeatures || []);
          console.log('rules:', doc.rules);
          setEntireStayRules(doc.rules && doc.rules.length > 0 ? doc.rules : [""]);
          console.log('roomRules:', doc.roomRules);
          setRoomRules(doc.roomRules || {});
          console.log('optionalRules:', doc.optionalRules);
          setOptionalRules(doc.optionalRules && doc.optionalRules.length > 0 ? doc.optionalRules : [""]);
          
          console.log('firstUserDiscount:', doc.firstUserDiscount);
          setFirstUserDiscount(doc.firstUserDiscount ?? true);
          console.log('discountType:', doc.discountType);
          setDiscountType(doc.discountType || "");
          console.log('discountPercentage:', doc.discountPercentage);
          setDiscountPercentage(String(doc.discountPercentage || ""));
          console.log('finalPrice:', doc.finalPrice);
          setFinalPrice(String(doc.finalPrice || ""));
          
          console.log('festivalOffers:', doc.festivalOffers);
          setFestivalOffers(doc.festivalOffers ?? false);
          console.log('weeklyOffers:', doc.weeklyOffers);
          setWeeklyOffers(doc.weeklyOffers ?? false);
          console.log('specialOffers:', doc.specialOffers);
          setSpecialOffers(doc.specialOffers ?? false);
          
          console.log('brandName:', doc.brandName);
          setBrandName(doc.brandName || "");
          console.log('companyName:', doc.companyName);
          setCompanyName(doc.companyName || "");
          console.log('gstNumber:', doc.gstNumber);
          setGstNumber(doc.gstNumber || "");
          console.log('businessEmail:', doc.businessEmail);
          setBusinessEmail(doc.businessEmail || "");
          console.log('businessPhone:', doc.businessPhone);
          setBusinessPhone(doc.businessPhone || "");
          console.log('locality:', doc.locality);
          setLocality(doc.locality || "India");
          console.log('state:', doc.state);
          setState(doc.state || "");
          setStateOption2(doc.state || "");
          console.log('city:', doc.city);
          setCity(doc.city || "");
          setCityOptions2(doc.city || "");
          console.log('businessPincode/pincode:', doc.businessPincode || doc.pincode);
          setBusinessPincode(doc.businessPincode || doc.pincode || "");
          console.log('personalPincode:', doc.personalPincode);
          setPersonalPincode(doc.personalPincode || "");
          
          console.log('firstName:', doc.firstName);
          setFirstName(doc.firstName || "");
          console.log('lastName:', doc.lastName);
          setLastName(doc.lastName || "");
          console.log('personalCountry:', doc.personalCountry);
          setPersonalCountry(doc.personalCountry || "India");
          console.log('personalState:', doc.personalState);
          setPersonalState(doc.personalState || "");
          setStateOption(doc.personalState || "");
          console.log('personalCity:', doc.personalCity);
          setPersonalCity(doc.personalCity || "");
          setCityOptions(doc.personalCity || "");
          console.log('dateOfBirth:', doc.dateOfBirth);
          setDateOfBirth(doc.dateOfBirth || "");
          console.log('maritalStatus:', doc.maritalStatus);
          setMaritalStatus(doc.maritalStatus || "");
          console.log('idProof:', doc.idProof);
          setIdProof(doc.idProof || "");
          
          console.log('idPhotos:', doc.idPhotos);
          if (doc.idPhotos && doc.idPhotos.length > 0) {
            setIdProofImage(doc.idPhotos[0]);
          }

          setTermsAccepted(false);
        } else if (userDetails && user?.userType !== 'vendor') {
           // Auto-fill from user details if no draft exists and user is not a vendor (first time)
           setFirstName(userDetails.firstName || "");
           setLastName(userDetails.lastName || "");
           setPersonalState(userDetails.state || "");
           setStateOption(userDetails.state || "");
           setPersonalCity(userDetails.city || "");
           setCityOptions(userDetails.city || "");
           setPersonalPincode(userDetails.personalPincode || "");
           
           setPersonalCountry(userDetails.country || "India");
           if (userDetails.dateOfBirth) {
               setDateOfBirth(new Date(userDetails.dateOfBirth).toISOString().split('T')[0]);
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
           setLocality(userDetails.business?.locality || "India");
           setState(userDetails.business?.state || "");
           setStateOption2(userDetails.business?.state || "");
           setCity(userDetails.business?.city || "");
           setCityOptions2(userDetails.business?.city || "");
           setBusinessPincode(userDetails.business?.pincode || "");
        }
      } catch (err) {
        console.error("Failed to load existing onboarding data", err);
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
        // For percentage, discount is interpreted as X%
        // If discount is > 100, it results in 0 price
        calculatedPrice = price - (price * discount / 100);
      } else {
        // For fixed, discount is the amount to subtract
        calculatedPrice = price - discount;
      }
      
      // Ensure price doesn't go below 0
      calculatedPrice = Math.max(0, calculatedPrice);
      
      // Round to 2 decimal places or integer? Previous inputs suggest integer (e.g. "2000")
      // But standard currency often uses decimals. Let's use toFixed(0) to match existing string defaults like "2000"
      setFinalPrice(calculatedPrice.toFixed(0));
    }
  }, [regularPrice, discountPercentage, discountType, currentStep]);

  const handleBack = () => {
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
      // Check if any selected property has categories
      const hasCategories = selectedProperties.some((propId) => {
        const categories = getEffectiveCategories(propId);
        return categories && categories.length > 0;
      });

      if (
        hasCategories &&
        (!selectedCategories || selectedCategories.length === 0)
      ) {
        toast.error("Please select at least one category");
        return;
      }
    } else if (currentStep === 2) {
      // Stay details validation
      if (stayType === "entire") {
        if (!coverImage) {
          toast.error("Please upload a cover photo");
          return;
        }
        const validImages = entireStayImages;
        if (validImages.length < 5) {
          toast.error("Please upload at least 5 images");
          return;
        }

        if (!regularPrice || Number(regularPrice) <= 0) {
          toast.error("Please enter a valid regular price");
          return;
        }
        if (guestCapacity <= 0) {
          toast.error("Please enter a valid guest capacity");
          return;
        }
        if (numberOfRooms <= 0) {
          toast.error("Please enter a valid number of rooms");
          return;
        }
        if (numberOfBeds <= 0) {
          toast.error("Please enter a valid number of beds");
          return;
        }
        if (numberOfBathrooms <= 0) {
          toast.error("Please enter a valid number of bathrooms");
          return;
        }
        // Check if at least one entire stay rule is filled
        const hasValidRule = entireStayRules.some((rule) => rule.trim() !== "");
        if (!hasValidRule) {
          toast.error("Please add at least one rule and regulation");
          return;
        }
      } else if (stayType === "individual") {
        if (!coverImage) {
          toast.error("Please upload a cover photo");
          return;
        }
        if (!rooms || rooms.length === 0) {
          toast.error("Please add at least one room");
          return;
        }
        // Validate each room has required fields
        for (let i = 0; i < rooms.length; i++) {
          const room = rooms[i];
          const validRoomImages = (room.photos || []).filter(p => p);
          if (validRoomImages.length < 5) {
             toast.error(`Please upload at least 5 images for Room ${i + 1}`);
             return;
          }
          if (!room.name || !room.name.trim()) {
            toast.error(`Please enter a name for Room ${i + 1}`);
            return;
          }
          if (!room.description || !room.description.trim()) {
            toast.error(`Please enter a description for Room ${i + 1}`);
            return;
          }
          if (room.guestCapacity <= 0) {
            toast.error(
              `Please enter a valid guest capacity for Room ${i + 1}`
            );
            return;
          }
          if (room.beds <= 0) {
            toast.error(
              `Please enter a valid number of beds for Room ${i + 1}`
            );
            return;
          }
          if (room.bathrooms <= 0) {
            toast.error(
              `Please enter a valid number of bathrooms for Room ${i + 1}`
            );
            return;
          }
          if (!room.price || room.price <= 0) {
            toast.error(`Please enter a valid price for Room ${i + 1}`);
            return;
          }
        }
      }
    } else if (currentStep === 3) {
      if (!selectedFeatures || selectedFeatures.length === 0) {
        toast.error("Please select at least one feature");
        return;
      }
    } else if (currentStep === 4) {
      // Discount step - optional, but if toggled on, fields are required
      if (
        firstUserDiscount ||
        festivalOffers ||
        weeklyOffers ||
        specialOffers
      ) {
        if (!discountPercentage)
          newErrors.discountPercentage = "Discount Percentage is required";
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
      }
      if (!dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required";
      }
      if (!maritalStatus) {
        newErrors.maritalStatus = "Marital status is required";
      }
      if (!idProof) {
        newErrors.idProof = "ID proof is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
      // Save on final step; navigation handled inside handleComplete
      handleComplete();
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      // Ensure server receives photos in rooms[0].photos as it expects
      const gallery: string[] = (images || []).filter(Boolean) as string[];
      const entireStayGallery: string[] = entireStayImages || [];
      const roomsWithPhotos = [...rooms];
      if (!roomsWithPhotos.length) {
        roomsWithPhotos.push({ id: '1', name: '', description: '', photos: [], guestCapacity: 1, beds: 1, bathrooms: 1, price: Number(regularPrice) || 0 });
      }
      
      if (stayType === "entire") {
        roomsWithPhotos[0] = { ...roomsWithPhotos[0], photos: entireStayGallery };
      }

      const payload = {
        selectedProperties,
        selectedCategories,
        stayType,
        coverImage,
        guestCapacity: Number(guestCapacity),
        numberOfRooms: Number(numberOfRooms),
        numberOfBeds: Number(numberOfBeds),
        numberOfBathrooms: Number(numberOfBathrooms),
        regularPrice: Number(regularPrice),
        rooms: roomsWithPhotos,
        selectedFeatures,
        entireStayRules: entireStayRules.filter(rule => rule.trim() !== ""),
        roomRules,
        optionalRules: optionalRules.filter(rule => rule.trim() !== ""),
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
        throw new Error('Please select at least one property type');
      }
      
      const regPrice = Number(regularPrice);
      if (!regularPrice || isNaN(regPrice) || regPrice <= 0) {
        throw new Error('Please enter a valid regular price');
      }
      
      if (!guestCapacity || Number(guestCapacity) <= 0) {
        throw new Error('Please enter a valid guest capacity');
      }

      const result = await submitOnboardingData('stay', payload);
      
      if (result?.id) {
         // Update user profile with personal & business details
         await updateUserDetails({
             firstName: firstName,
             lastName: lastName,
             phoneNumber: businessPhone, // or personal phone if available
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
               locality: locality,
               state: state,
               city: city,
               pincode: businessPincode,
             }
         });

        onboardingService.setStayId(result.id);
        sessionStorage.setItem('onboardingId', result.id);
        sessionStorage.setItem('onboardingType', 'stay');
        sessionStorage.setItem('id', result.id);
        updateUserType('vendor');
        toast.success('Stay onboarding saved successfully!');
        navigate("/onboarding/selfie-verification");
        return;
      } else {
        toast.error("Could not save onboarding. Please try again.");
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
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
    if (currentStep === 0) return selectedProperties.length > 0; // Property types step
    if (currentStep === 1) return selectedCategories.length > 0; // Category selection step
    if (currentStep === 2) return true; // Stay details step
    if (currentStep === 3) return true; // Features step
    if (currentStep === 4) return true; // Discount step
    if (currentStep === 5)
      return brandName.trim() !== "" && companyName.trim() !== ""; // Business details
    if (currentStep === 6)
      return firstName.trim() !== "" && lastName.trim() !== ""; // Personal details
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

  const incrementValue = (
    value: number,
    setter: (val: number) => void,
    max: number = 20,
  ) => {
    if (value < max) setter(value + 1);
  };

  const decrementValue = (
    value: number,
    setter: (val: number) => void,
    min: number = 1,
  ) => {
    if (value > min) setter(value - 1);
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
    setRooms((prev) =>
      prev.map((room) => (room.id === id ? { ...room, [field]: value } : room))
    );
  };

  const removeRoomImage = (roomId: string, index: number) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          photos: (room.photos || []).filter((_, i) => i !== index)
        };
      }
      return room;
    }));
  };

  const handleRoomImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    roomId: string
  ) => {
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

    const readPromises = validFiles.map(file => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    });

    Promise.all(readPromises).then(base64Images => {
        setRooms(prev => prev.map(room => {
            if (room.id === roomId) {
                return {
                    ...room,
                    photos: [...(room.photos || []), ...base64Images]
                };
            }
            return room;
        }));
    });
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation: only JPG/PNG
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed!");
      return;
    }

    // Removed 1MB size restriction per request
    // if (file.size > 1024 * 1024) {
    //   alert("File size must be less than 1MB!");
    //   return;
    // }

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

    // Validation: only JPG/PNG
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
    setEntireStayImages(prev => prev.filter((_, i) => i !== index));
  };

  const CampingIcon = () => (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.75 26.8749V22.0724L14.2313 7.97118L12.8125 6.09118L13.8275 5.33618L15 6.93493L16.1975 5.33618L17.1875 6.09118L15.7938 7.97118L26.25 22.0712V26.8749H3.75ZM15 9.03118L5 22.4762V25.6249H9.0625L15 17.3324L20.9375 25.6249H25V22.4749L15 9.03118ZM10.6113 25.6249H19.39L15 19.4812L10.6113 25.6249Z"
        fill="black"
      />
    </svg>
  );

  const HutIcon = () => (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 15H22.5L25 27.5H5L7.5 15Z"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.25 27.5L12.0975 23.375C12.29 22.44 12.3862 21.9725 12.7325 21.6975C13.4525 21.1225 16.495 21.08 17.2675 21.6975C17.6138 21.9725 17.71 22.44 17.9025 23.3763L18.75 27.5M15 4L6.93 10.5475C4.64625 12.4012 3.505 13.3275 3.79375 14.1638C4.0825 15 5.54625 15 8.47 15H21.53C24.455 15 25.9175 15 26.205 14.1638C26.495 13.3275 25.3537 12.4012 23.07 10.5475L15 4ZM15 4L16.8488 2.5M15 4L13.1512 2.5M15 15V11.25M10 15V13.125M20 15V13.125M2.5 27.5H27.5"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const handleUploadIDProof = (e) => {
    const file = e.target.files[0];
    setError("");
    setFileName("");

    if (file) {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        setError("Only JPG, PNG, or PDF files are allowed.");
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
    setEntireStayRules(prev => [...prev, ""]);
  };

  const removeEntireStayRule = (index: number) => {
    setEntireStayRules(prev => prev.filter((_, i) => i !== index));
  };

  const updateEntireStayRule = (index: number, value: string) => {
    setEntireStayRules(prev => prev.map((rule, i) => i === index ? value : rule));
  };

  const addRoomRule = (roomId: string) => {
    setRoomRules(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || [""]), ""]
    }));
  };

  const removeRoomRule = (roomId: string, index: number) => {
    setRoomRules(prev => {
      const roomRulesList = prev[roomId] || [];
      return {
        ...prev,
        [roomId]: roomRulesList.filter((_, i) => i !== index)
      };
    });
  };

  const updateRoomRule = (roomId: string, index: number, value: string) => {
    setRoomRules(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map((rule, i) => i === index ? value : rule)
    }));
  };

  const addOptionalRule = () => {
    setOptionalRules(prev => [...prev, ""]);
  };

  const removeOptionalRule = (index: number) => {
    setOptionalRules(prev => prev.filter((_, i) => i !== index));
  };

  const updateOptionalRule = (index: number, value: string) => {
    setOptionalRules(prev => prev.map((rule, i) => i === index ? value : rule));
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

const businessMapQuery = `
  ${cityOption2 || ""}
  ${stateOption2 || ""}
  ${businessPincode || ""}
  India
`;

const mapSrcbusiness = `https://www.google.com/maps?q=${encodeURIComponent(
  businessMapQuery
)}&output=embed`;

  return (
    <div className="h-screen w-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex h-16 w-full z-30 fixed items-center justify-start px-6 lg:px-20 py-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <LogoWebsite />
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full overflow-y-auto pt-14 pb-28">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-20 flex flex-col items-center gap-10 py-8">
          
          {status === 'rejected' && (
            <div className="w-full max-w-4xl p-4 border border-red-200 bg-red-50 rounded-md">
              <h3 className="text-red-800 font-semibold mb-1">Service Rejected</h3>
              <p className="text-red-700 text-sm">
                Reason: {rejectionReason || 'No reason provided'}
              </p>
              <p className="text-red-600 text-xs mt-2">
                Please update the details and resubmit for approval.
              </p>
            </div>
          )}

          {/* Step 0: Types of Property */}
          {currentStep === 0 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
              <h1 className="text-xl lg:text-[32px] font-bold text-black dark:text-white font-geist leading-normal text-center">
                Types of Property
              </h1>

              {/* Row 1 */}
            <div className="max-w-6xl mx-auto 
                grid 
                grid-cols-2 
                sm:grid-cols-3 
                md:grid-cols-4 
                lg:grid-cols-5 
                gap-4">

  {propertyTypes.map((property) => (
    <div
      key={property.id}
      onClick={() => togglePropertySelection(property.id)}
      className={`flex flex-col items-center justify-center gap-2 
                  p-3 rounded-xl border cursor-pointer 
                  transition-all duration-200 text-center
        ${
          selectedProperties.includes(property.id)
            ? "border-[#131313] bg-[#F8F9FA] dark:border-white dark:bg-gray-700"
            : "border-[#EAECF0] bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
    >
      <img
        src={getImageUrl(property.icon)}
        alt={property.name}
        className="w-6 h-6 object-contain"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />

      <p className="text-sm sm:text-base md:text-lg font-medium text-[#4B4B4B] dark:text-gray-300">
        {property.name}
      </p>
    </div>
  ))}
</div>

         
            </div>
          )}

          {/* Step 1: Category Selection */}
          {currentStep === 1 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
              <div className="w-full flex flex-col items-start gap-2.5">
                <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white font-geist leading-normal text-center w-full">
                  Category Selection
                </h1>
                <p className="text-lg text-[#5D5D5D] dark:text-gray-400 font-geist leading-normal text-center w-full">
                  Select categories for your selected property types
                </p>
              </div>

              {/* Categories based on selected property types */}
            <div className="max-w-6xl mx-auto w-full">
  {selectedProperties.map((propertyId) => {
    const property = propertyTypes.find((p) => p.id === propertyId);
    const categories = getEffectiveCategories(propertyId);

    return (
      <div key={propertyId} className="mb-8">

        <div
          className="
            grid 
            grid-cols-2 
            sm:grid-cols-3 
            md:grid-cols-4 
            lg:grid-cols-5 
            gap-4
          "
        >
          {categories.map((category) => {
            const categoryKey = `${propertyId}-${category.id}`;
            const isSelected = selectedCategories.includes(categoryKey);

            return (
              <div
                key={categoryKey}
                onClick={() => {
                  setSelectedCategories((prev) =>
                    isSelected
                      ? prev.filter((id) => id !== categoryKey)
                      : [...prev, categoryKey]
                  );
                }}
                className={`
                  flex flex-col items-center justify-center
                  p-4 rounded-xl border cursor-pointer
                  transition-all duration-200 text-center
                  ${
                    isSelected
                      ? "border-[#131313] bg-[#F8F9FA] dark:border-white dark:bg-gray-700"
                      : "border-[#EAECF0] bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                  }
                `}
              >
                <img
                  src={getImageUrl(category.icon)}
                  className="w-6 h-6 sm:w-7 sm:h-7 mb-2 object-contain"
                  alt={category.name}
                />

                <p className="text-xs sm:text-sm md:text-base font-medium text-[#4B4B4B] dark:text-gray-300 text-center">
                  {category.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  })}
</div>

              {/* {selectedCategories.length > 0 && (
                <div className="max-w-4xl mx-auto text-sm text-gray-600 dark:text-gray-400">
                  Selected categories: {selectedCategories.length}
                </div>
              )} */}
            </div>
          )}

          {/* Step 2: Stay Details */}
          {currentStep === 2 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
              <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white font-geist leading-normal text-center">
                Stay Details
              </h1>

              <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                {/* Stay Type Selection */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                    Select best what 3
                  </h3>
                  <div className="flex items-start gap-5">
                    <button
                      onClick={() => setStayType("entire")}
                      className={`flex p-[14px_20px_14px_12px] flex-col justify-center items-center gap-2.5 rounded-[48px] border border-[#EAECF0] transition-all duration-200 ${
                        stayType === "entire"
                          ? "bg-[#131313] text-white"
                          : "bg-white dark:bg-gray-800 text-[#4B4B4B] dark:text-gray-300 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-[1.2px] flex items-center justify-center ${
                            stayType === "entire"
                              ? "border-white bg-white"
                              : "border-[#667085] bg-white"
                          }`}
                        >
                          {stayType === "entire" && (
                            <div className="w-2 h-2 rounded-full bg-black"></div>
                          )}
                        </div>
                        <span className="text-base font-medium font-plus-jakarta">
                          Entire Stay
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setStayType("individual")}
                      className={`flex p-[14px_20px_14px_12px] flex-col justify-center items-center gap-2.5 rounded-[48px] border border-[#EAECF0] transition-all duration-200 ${
                        stayType === "individual"
                          ? "bg-[#131313] text-white"
                          : "bg-white dark:bg-gray-800 text-[#4B4B4B] dark:text-gray-300 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-[1.2px] flex items-center justify-center ${
                            stayType === "individual"
                              ? "border-white bg-white"
                              : "border-[#667085] bg-white"
                          }`}
                        >
                          {stayType === "individual" && (
                            <div className="w-2 h-2 rounded-full bg-black"></div>
                          )}
                        </div>
                        <span className="text-base font-medium font-plus-jakarta">
                          Individual Room
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Entire Stay Form */}
                {stayType === "entire" && (
                  <>
                    {/* Guest Capacity */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                          Guest Capacity
                        </h3>
                        <p className="text-sm text-[#334054] dark:text-gray-400 font-plus-jakarta leading-[21px]">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit,
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            decrementValue(guestCapacity, setGuestCapacity)
                          }
                          className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Minus size={16} className="text-[#666666]" />
                        </button>
                        <span className="text-base font-medium text-[#334054] dark:text-gray-300 font-plus-jakarta min-w-[20px] text-center">
                          {guestCapacity}
                        </span>
                        <button
                          onClick={() =>
                            incrementValue(guestCapacity, setGuestCapacity)
                          }
                          className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Plus size={16} className="text-[#666666]" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-px bg-[#EAECF0]"></div>

                    {/* Number of Rooms */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                          Number of Rooms
                        </h3>
                        <p className="text-sm text-[#334054] dark:text-gray-400 font-plus-jakarta leading-[21px]">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit,
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            decrementValue(numberOfRooms, setNumberOfRooms)
                          }
                          className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Minus size={16} className="text-[#666666]" />
                        </button>
                        <span className="text-base font-medium text-[#334054] dark:text-gray-300 font-plus-jakarta min-w-[20px] text-center">
                          {numberOfRooms}
                        </span>
                        <button
                          onClick={() =>
                            incrementValue(numberOfRooms, setNumberOfRooms)
                          }
                          className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Plus size={16} className="text-[#666666]" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-px bg-[#EAECF0]"></div>

                    {/* Number of Beds */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                          Number of Bed
                        </h3>
                        <p className="text-sm text-[#334054] dark:text-gray-400 font-plus-jakarta leading-[21px]">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit,
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            decrementValue(numberOfBeds, setNumberOfBeds)
                          }
                          className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Minus size={16} className="text-[#666666]" />
                        </button>
                        <span className="text-base font-medium text-[#334054] dark:text-gray-300 font-plus-jakarta min-w-[20px] text-center">
                          {numberOfBeds}
                        </span>
                        <button
                          onClick={() =>
                            incrementValue(numberOfBeds, setNumberOfBeds)
                          }
                          className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Plus size={16} className="text-[#666666]" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-px bg-[#EAECF0]"></div>

                    {/* Number of Bathrooms */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                          Number of Bathroom
                        </h3>
                        <p className="text-sm text-[#334054] dark:text-gray-400 font-plus-jakarta leading-[21px]">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit,
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            decrementValue(
                              numberOfBathrooms,
                              setNumberOfBathrooms,
                            )
                          }
                          className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Minus size={16} className="text-[#666666]" />
                        </button>
                        <span className="text-base font-medium text-[#334054] dark:text-gray-300 font-plus-jakarta min-w-[20px] text-center">
                          {numberOfBathrooms}
                        </span>
                        <button
                          onClick={() =>
                            incrementValue(
                              numberOfBathrooms,
                              setNumberOfBathrooms,
                            )
                          }
                          className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Plus size={16} className="text-[#666666]" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-px bg-[#EAECF0]"></div>

                    {/* Regular Price */}
                    <div className="flex items-center gap-5">
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="flex flex-col gap-3">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta pl-1">
                            Regular Price (in Rupees)
                          </Label>
                          <Input
                            name="regularPrice"
                            placeholder="Enter regular price"
                            value={regularPrice}
                            onChange={(e) => setRegularPrice(e.target.value)}
                            className="h-[38px] border-[#EAECF0] text-sm font-plus-jakarta"
                          />
                        </div>
                        {/* <span className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta pl-1">
                          Regular Price (in Rupees)
                        </span>
                        <div className="flex flex-col gap-3">
                          <span className="text-2xl font-bold text-[#131313] dark:text-white font-plus-jakarta tracking-[-0.96px] pl-3">
                            ₹ {regularPrice.toLocaleString()}
                          </span>
                          <div className="w-full h-px bg-[#EAECF0]"></div>
                        </div>*/}
                      </div>
                    </div>

                    {/* Rules and Regulations */}
                    <div className="flex flex-col gap-5">
                      <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                        Rules and Regulations
                      </h3>

                      {entireStayRules.map((rule, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Input
                            placeholder="Add rule and regulations..."
                            value={rule}
                            onChange={(e) => updateEntireStayRule(index, e.target.value)}
                            className="flex-1 h-[38px] border-[#EAECF0] text-sm font-plus-jakarta"
                          />
                          <button
                            onClick={() => removeEntireStayRule(index)}
                            className="flex items-center justify-center w-[30px] h-[30px] rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                          >
                            <X size={16} className="text-[#666666]" />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={addEntireStayRule}
                        className="flex items-center gap-2 text-[#131313] dark:text-white font-medium"
                      >
                        <Plus size={16} />
                        <span>Add More Rules</span>
                      </button>
                    </div>

                    {/* Cover Photo */}
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                          Cover Photo
                        </h3>
                      </div>

                       <div className="w-full relative h-64 max-w-xl border border-gray-200 rounded-xl overflow-hidden">
                        {coverImage ? (
                          <img
                            src={renderImageSrc(coverImage)}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <label className="w-full h-full flex items-center justify-center text-gray-400 text-sm cursor-pointer bg-[#F9FAFB] dark:bg-gray-700 hover:bg-gray-100 transition-colors">
                            <div className="flex flex-col items-center gap-2">
                                <Plus size={24} />
                                <span>Add Cover Photo</span>
                            </div>
                            <input
                              type="file"
                              accept="image/jpeg,image/png"
                              className="hidden"
                              onChange={handleCoverImageUpload}
                            />
                          </label>
                        )}

                        {coverImage && (
                          <button
                            onClick={removeCoverImage}
                            className="absolute top-2 right-2 w-7 h-7 bg-white shadow-md hover:bg-gray-100 rounded-full flex items-center justify-center transition"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Entire Stay Images */}
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                          Select Property Images
                        </h3>
                        {/* <span className="text-xs text-[#334054] dark:text-gray-400 font-plus-jakarta">
                          {entireStayImages.filter(img => img !== null).length}/15 images
                        </span> */}
                      </div>

                      <label className="flex h-32  flex-col items-center justify-center w-full p-6 text-sm bg-[#F9FAFB] dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Plus size={24} className="text-black" />
                          <span className="text-base text-black font-plus-jakarta">
                            Add Photos
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;

                            const validFiles: File[] = [];
                            for (let i = 0; i < files.length; i++) {
                              const file = files[i];
                              if (["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
                                validFiles.push(file);
                              }
                            }

                            if (validFiles.length === 0) return;

                            const readPromises = validFiles.map(file => {
                                return new Promise<string>((resolve) => {
                                    const reader = new FileReader();
                                    reader.onload = () => resolve(reader.result as string);
                                    reader.readAsDataURL(file);
                                });
                            });

                            Promise.all(readPromises).then(base64Images => {
                                setEntireStayImages(prev => [...prev, ...base64Images]);
                            });
                          }}
                        />
                      </label>

{entireStayImages.length > 0 && (
  <div className="flex relative items-center max-w-4xl mx-auto">

     {/* Carousel Container */}
        <div className="relative">
          {/* Left Arrow */}
          {entireStayImages.length > 5 && (
            <button
              onClick={() => sliderRef.current.scrollBy({ left: -300, behavior: "smooth" })}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow p-2 rounded-full"
            >
            <IoIosArrowBack />
            </button>
          )}
    
          {/* Images Scrollable Row */}
          <div
            ref={sliderRef}
            className="flex max-w-4xl max-md:w-[400px] items-start gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          >
            {entireStayImages.map((photo, index) => (
              <div
                key={index}
                className="relative w-44 h-52 max-sm:w-24 max-md:h- 24 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0"
                >
                <img
                  src={renderImageSrc(photo)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
    
                <button
                  onClick={() => removeEntireStayImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
    
          {/* Right Arrow */}
          {entireStayImages.length > 5 && (
            <button
              onClick={() => sliderRef.current.scrollBy({ left: 300, behavior: "smooth" })}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow p-2 rounded-full"
            >
            <IoIosArrowForward />
    
            </button>
          )}
        </div>
    
  </div>
)}


                    </div>
                  </>
                )}

                {/* Individual Room Form */}
                {stayType === "individual" && (
                  <>
                  
                    {/* Number of Rooms */}
                    <div className="flex items-center justify-between p-3">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                          Number of Rooms
                        </h3>
                        <p className="text-sm text-[#334054] dark:text-gray-400 font-plus-jakarta leading-[21px]">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit,
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={removeRoom}
                          className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Minus size={16} className="text-[#666666]" />
                        </button>
                        <span className="text-base font-medium text-[#334054] dark:text-gray-300 font-plus-jakarta min-w-[20px] text-center">
                          {numberOfRooms}
                        </span>
                        <button
                          onClick={addRoom}
                          className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Plus size={16} className="text-[#666666]" />
                        </button>
                      </div>
                    </div>

                    {/* Room Details */}
                    {rooms.map((room, index) => (
                      <div
                        key={room.id}
                        className="flex flex-col gap-3 p-5 rounded-xl border border-[#EAECF0] bg-white dark:bg-gray-800"
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta flex-1">
                            Room {index + 1}
                          </h3>
                          <button
                            onClick={() =>
                              setExpandedRoom(
                                expandedRoom === room.id ? "" : room.id,
                              )
                            }
                            className="flex items-center justify-center w-[18px] h-[18px]"
                          >
                            {expandedRoom === room.id ? (
                              <ChevronUp size={18} className="text-[#292D32]" />
                            ) : (
                              <ChevronDown
                                size={18}
                                className="text-[#292D32]"
                              />
                            )}
                          </button>
                        </div>

                        {expandedRoom === room.id && (
                          <>
                            <div className="w-full h-px bg-[#EAECF0] border-dashed"></div>

                            <div className="flex flex-col gap-5">
                              {/* Room Name */}
                              <div className="flex flex-col gap-3">
                                <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta pl-1">
                                  Name
                                </Label>
                                <Input
                                  placeholder="Name"
                                  value={room.name}
                                  onChange={(e) => updateRoom(room.id, "name", e.target.value)}
                                  className="h-[38px] border-[#EAECF0] text-sm font-plus-jakarta"
                                />
                              </div>

                              {/* Description */}
                              <div className="flex flex-col gap-3">
                                <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta pl-1">
                                  Descriptions
                                </Label>
                                <div className="flex flex-col gap-1.5">
                                  <textarea
                                    placeholder="Write here..."
                                    maxLength={200}
                                    value={room.description}
                                    onChange={(e) => updateRoom(room.id, "description", e.target.value)}
                                    className="min-h-[96px] border border-[#EAECF0] rounded-lg px-3 py-3 text-sm font-plus-jakarta placeholder:text-black bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:border-[#131313] dark:focus:border-white transition-all duration-200"
                                  />
                                  <span className="text-xs text-[#334054] dark:text-gray-400 text-right font-plus-jakarta px-1.5">
                                    {room.description?.length || 0}/200
                                  </span>
                                </div>
                              </div>


                                {/* Cover Photo */}
                    <div className="flex flex-col gap-5 p-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                          Cover Photo
                        </h3>
                      </div>

                       <div className="w-full relative h-64 max-w-xl border border-gray-200 rounded-xl overflow-hidden">
                        {coverImage ? (
                          <img
                            src={renderImageSrc(coverImage)}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <label className="w-full h-full flex items-center justify-center text-gray-400 text-sm cursor-pointer bg-[#F9FAFB] dark:bg-gray-700 hover:bg-gray-100 transition-colors">
                            <div className="flex flex-col items-center gap-2">
                                <Plus size={24} />
                                <span>Add Cover Photo</span>
                            </div>
                            <input
                              type="file"
                              accept="image/jpeg,image/png"
                              className="hidden"
                              onChange={handleCoverImageUpload}
                            />
                          </label>
                        )}

                        {coverImage && (
                          <button
                            onClick={removeCoverImage}
                            className="absolute top-2 right-2 w-7 h-7 bg-white shadow-md hover:bg-gray-100 rounded-full flex items-center justify-center transition"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>




                                {/* Upload Photos */}
                              <div className="flex flex-col gap-5">
                                <div className="flex items-center gap-4">
                                  <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta flex-1 pl-1">
                                    Upload Photos
                                  </Label>
                                </div>

                                <label className="flex h-32 flex-col items-center justify-center w-full p-6 text-sm bg-[#F9FAFB] dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-2">
                                    <Plus size={24} className="text-black" />
                                    <span className="text-base text-black font-plus-jakarta">
                                        Add Photos
                                    </span>
                                    </div>
                                    <input
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => handleRoomImageUpload(e, room.id)}
                                    />
                                </label>

                                {(room.photos || []).length > 0 && (
                                  <div className="flex relative items-center w-full mx-auto">
                                        <div className="relative w-full">
                                          <div
                                            className="flex w-full items-start gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
                                          >
                                            {room.photos.map((photo, index) => (
                                              <div
                                                key={index}
                                                className="relative w-44 h-52 max-sm:w-24 max-md:h- 24 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0"
                                                >
                                                <img
                                                  src={renderImageSrc(photo)}
                                                  alt={`Upload ${index + 1}`}
                                                  className="w-full h-full object-cover"
                                                />
                                    
                                                <button
                                                  onClick={() => removeRoomImage(room.id, index)}
                                                  className="absolute top-2 right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                                                >
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                  </div>
                                )}
                              </div>

                              {/* Room Statistics */}
                              <div className="flex flex-col gap-5">
                                {/* Guest Capacity */}
                                <div className="flex items-center justify-between p-3">
                                  <div className="flex flex-col gap-3">
                                    <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                                      Guest Capacity
                                    </h3>
                                    <p className="text-sm text-[#334054] dark:text-gray-400 font-plus-jakarta leading-[21px]">
                                      Lorem ipsum dolor sit amet, consectetur
                                      adipiscing elit,
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <button 
                                      onClick={() => updateRoom(room.id, "guestCapacity", Math.max(1, room.guestCapacity - 1))}
                                      className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors">
                                      <Minus
                                        size={16}
                                        className="text-[#666666]"
                                      />
                                    </button>
                                    <span className="text-base font-medium text-[#334054] dark:text-gray-300 font-plus-jakarta min-w-[20px] text-center">
                                      {room.guestCapacity}
                                    </span>
                                    <button 
                                      onClick={() => updateRoom(room.id, "guestCapacity", room.guestCapacity + 1)}
                                      className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors">
                                      <Plus
                                        size={16}
                                        className="text-[#666666]"
                                      />
                                    </button>
                                  </div>
                                </div>

                                {/* Number of Beds */}
                                <div className="flex items-center justify-between p-3">
                                  <div className="flex flex-col gap-3">
                                    <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                                      Number of Bed
                                    </h3>
                                    <p className="text-sm text-[#334054] dark:text-gray-400 font-plus-jakarta leading-[21px] max-w-[365px]">
                                      Lorem ipsum dolor sit amet, consectetur
                                      adipiscing elit,
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <button 
                                      onClick={() => updateRoom(room.id, "beds", Math.max(1, room.beds - 1))}
                                      className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors">
                                      <Minus
                                        size={16}
                                        className="text-[#666666]"
                                      />
                                    </button>
                                    <span className="text-base font-medium text-[#334054] dark:text-gray-300 font-plus-jakarta min-w-[20px] text-center">
                                      {room.beds}
                                    </span>
                                    <button 
                                      onClick={() => updateRoom(room.id, "beds", room.beds + 1)}
                                      className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors">
                                      <Plus
                                        size={16}
                                        className="text-[#666666]"
                                      />
                                    </button>
                                  </div>
                                </div>

                                {/* Number of Bathrooms */}
                                <div className="flex items-center justify-between p-3">
                                  <div className="flex flex-col gap-3">
                                    <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                                      Number of Bathroom
                                    </h3>
                                    <p className="text-sm text-[#334054] dark:text-gray-400 font-plus-jakarta leading-[21px] max-w-[365px]">
                                      Lorem ipsum dolor sit amet, consectetur
                                      adipiscing elit,
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <button 
                                      onClick={() => updateRoom(room.id, "bathrooms", Math.max(1, room.bathrooms - 1))}
                                      className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors">
                                      <Minus
                                        size={16}
                                        className="text-[#666666]"
                                      />
                                    </button>
                                    <span className="text-base font-medium text-[#334054] dark:text-gray-300 font-plus-jakarta min-w-[20px] text-center">
                                      {room.bathrooms}
                                    </span>
                                    <button 
                                      onClick={() => updateRoom(room.id, "bathrooms", room.bathrooms + 1)}
                                      className="flex w-[30px] h-[30px] items-center justify-center rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors">
                                      <Plus
                                        size={16}
                                        className="text-[#666666]"
                                      />
                                    </button>
                                  </div>
                                </div>

                                {/* Regular Price */}
                                <div className="flex items-center gap-5">
                                  <div className="flex flex-col gap-3 flex-1">
                                    <div className="flex flex-col gap-3">
                                      <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta pl-1">
                                        Regular Price (in Rupees)
                                      </Label>
                                      <Input
                                        type="number"
                                        name="regularPrice"
                                        placeholder="Enter regular price"
                                        value={room.price}
                                        onChange={(e) =>
                                          updateRoom(room.id, "price", Number(e.target.value))
                                        }
                                        className="h-[38px] border-[#EAECF0] text-sm font-plus-jakarta"
                                      />
                                    </div>
                                    {/* <span className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta pl-1">
                          Regular Price (in Rupees)
                        </span>
                        <div className="flex flex-col gap-3">
                          <span className="text-2xl font-bold text-[#131313] dark:text-white font-plus-jakarta tracking-[-0.96px] pl-3">
                            ₹ {regularPrice.toLocaleString()}
                          </span>
                          <div className="w-full h-px bg-[#EAECF0]"></div>
                        </div>*/}
                                  </div>
                                </div>

                                {/* Room Rules and Regulations */}
                                <div className="flex flex-col gap-5">
                                  <h4 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">
                                    Room Rules and Regulations
                                  </h4>

                                  {(roomRules[room.id] || [""]).map((rule, ruleIndex) => (
                                    <div key={ruleIndex} className="flex items-center gap-3">
                                      <Input
                                        placeholder="Add room rule and regulations..."
                                        value={rule}
                                        onChange={(e) => updateRoomRule(room.id, ruleIndex, e.target.value)}
                                        className="flex-1 h-[38px] border-[#EAECF0] text-sm font-plus-jakarta"
                                      />
                                      <button
                                        onClick={() => removeRoomRule(room.id, ruleIndex)}
                                        className="flex items-center justify-center w-[30px] h-[30px] rounded-full border border-[#EAECF0] bg-white hover:bg-gray-50 transition-colors"
                                      >
                                        <X size={16} className="text-[#666666]" />
                                      </button>
                                    </div>
                                  ))}

                                  <button
                                    onClick={() => addRoomRule(room.id)}
                                    className="flex items-center gap-2 text-[#131313] dark:text-white font-medium"
                                  >
                                    <Plus size={16} />
                                    <span>Add More Room Rules</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </>
                )}

              
              </div>
            </div>
          )}

  
          {/* Step 3: Features */}
      {currentStep === 3 && (
  <div className="w-full flex flex-col items-center gap-9">
    <h1 className="text-[32px] font-semibold text-black dark:text-white text-center">
      Features
    </h1>

    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex flex-wrap gap-5">

        {/* Dynamic property-based features */}
        {(() => {
          const primaryPropertyType = selectedProperties[0] || "";
          const featuresData = getFeaturesForProperty(
            primaryPropertyType,
            "",
            stayType
          );

          return featuresData
            .filter(f => f.value !== "others")
            .map((feature, idx) => (
              <button
                key={idx}
                onClick={() => toggleFeatureSelection(feature.value)}
                className={`flex items-center gap-3 px-4 py-2 rounded-[48px] border transition-all ${
                  selectedFeatures.includes(feature.value)
                    ? "border-[#131313] dark:border-white bg-white dark:bg-gray-800"
                    : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#131313]"
                }`}
              >
                <div className="w-[22px] h-[22px] flex items-center justify-center">
                  {typeof feature.icon === "string" ? (
                    <span>{feature.icon}</span>
                  ) : (
                    <feature.icon size={18} className="text-gray-600" />
                  )}
                </div>
                <span className="text-base text-[#4B4B4B] dark:text-gray-300 font-medium">
                  {feature.label}
                </span>
              </button>
            ));
        })()}

        {/* Admin Features */}
        {adminFeatures.map((feature, idx) => (
          <button
            key={feature.id || idx}
            onClick={() => toggleFeatureSelection(feature.name)}
            className={`flex items-center gap-3 px-4 py-2 rounded-[48px] border transition-all ${
              selectedFeatures.includes(feature.name)
                ? "border-[#131313] dark:border-white bg-white dark:bg-gray-800"
                : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#131313]"
            }`}
          >
            <div className="w-[22px] h-[22px]">
              <img
                src={getImageUrl(feature.icon)}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-base text-[#4B4B4B] dark:text-gray-300 font-medium">
              {feature.name}
            </span>
          </button>
        ))}

        {/* Custom Features */}
        {customFeatures.map((feature, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCustomFeatures(prev => prev.filter((_, i) => i !== idx));
              setSelectedFeatures(prev =>
                prev.filter(f => f !== feature)
              );
            }}
            className="flex items-center gap-3 px-4 py-2 rounded-[48px] border border-[#131313] bg-white dark:bg-gray-800"
          >
                     <div className="w-[22px] h-[22px]">
      <svg viewBox="0 0 20 20" fill="none">
      <path
        d="M20 8.25L10 1.75L7.5 3.375V1.25H5V5L0 8.25L2.375 11.625L2.5 11.5V18.75H8.75V13.75H11.25V18.75H17.5V11.5L17.625 11.625L20 8.25ZM1.75 8.625L10 3.25L18.25 8.625L17.375 9.875L10 5L2.625 9.875L1.75 8.625ZM16.25 17.5H12.5V12.5H7.5V17.5H3.75V10.75L10 6.625L16.25 10.75V17.5Z"
        fill="currentColor"
      />
    </svg>
                      </div>
            <span className="text-base text-[#4B4B4B] dark:text-gray-300 font-medium">
              {feature}
            </span>
            <X size={16} />
          </button>
        ))}

        {/* Others Button */}
        <button
          onClick={() => setShowCustomFeaturesInput(!showCustomFeaturesInput)}
          className={`flex items-center gap-3 px-4 py-2 rounded-[48px] border transition-all ${
            showCustomFeaturesInput
              ? "border-[#131313] dark:border-white"
              : "border-[#EAECF0] dark:border-gray-600 hover:border-[#131313]"
          }`}
        >
          <Plus size={16} />
          <span className="text-base text-[#4B4B4B] dark:text-gray-300 font-medium">
            Other
          </span>
        </button>
      </div>

      {/* Custom Feature Input */}
      {showCustomFeaturesInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customFeatureInput}
            onChange={(e) => setCustomFeatureInput(e.target.value)}
            placeholder="Add custom feature"
            className="flex-1 h-[50px] px-3 border rounded-lg dark:bg-gray-800"
          />
          <button
            onClick={() => {
              if (
                customFeatureInput.trim() &&
                !selectedFeatures.includes(customFeatureInput)
              ) {
                setCustomFeatures(prev => [
                  ...prev,
                  customFeatureInput.trim()
                ]);
                setSelectedFeatures(prev => [
                  ...prev,
                  customFeatureInput.trim()
                ]);
                setCustomFeatureInput("");
              }
            }}
            className="px-6 h-[50px] bg-[#131313] text-white rounded-lg"
          >
            Add
          </button>
        </div>
      )}
    </div>
  </div>
)}


          {/* Step 4: Types of Discount */}
          {currentStep === 4 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
              <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white font-geist leading-normal text-center">
                Types of Discount
              </h1>

              <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
                {/* First 5 User Discount */}
                <div className="flex flex-col gap-3 p-5 rounded-xl border border-[#EAECF0] bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#334054] dark:text-white font-plus-jakarta">
                      First 5 User Discount
                    </h3>
                    <button
                      onClick={() => setFirstUserDiscount(!firstUserDiscount)}
                      className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                        firstUserDiscount ? "bg-[#2563EB]" : "bg-[#D2D5DA]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                          firstUserDiscount
                            ? "translate-x-[18px]"
                            : "translate-x-[2px]"
                        }`}
                      ></div>
                    </button>
                  </div>

                  {firstUserDiscount && (
                    <>
                      <div className="w-full h-px bg-[#EAECF0] border-dashed"></div>
                      <div className="flex md:items-start  w-full gap-5 max-md:flex-col">
                        <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Discount Type
                          </Label>
                          <div className="relative">
                            <select
                              value={discountType}
                              onChange={(e) => setDiscountType(e.target.value)}
                              className="w-full p-[14px_12px] border border-[#B0B0B0] rounded-lg text-sm font-plus-jakarta text-[#717171] bg-white dark:bg-gray-800 appearance-none"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M4 6L8 10L12 6"
                                  stroke="#131313"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Discount Percentage
                          </Label>
                        <Input
  type="number"
  maxLength={discountType === "percentage" ? 2 : 10}
  placeholder={discountType === "percentage" ? "10%" : "Fixed Amount"}
  value={discountPercentage || ""}
  onChange={(e) => {
    let value = e.target.value;

    // percentage 0–99 tak
    if (discountType === "percentage" && Number(value) > 99) return;

    setDiscountPercentage(value);
    clearError("discountPercentage");
  }}
  className="border-[#B0B0B0] text-sm font-plus-jakarta text-[#717171]"
/>

                          {errors.discountPercentage && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.discountPercentage}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Final Price
                          </Label>
                          <Input
                            type="number"
                            placeholder="Enter Final Price"
                            value={finalPrice}
                            onChange={(e) => {
                              setFinalPrice(e.target.value);
                              clearError("finalPrice");
                            }}
                            className="border-[#B0B0B0] text-sm font-plus-jakarta text-[#717171]"
                          />
                          {errors.finalPrice && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.finalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Festival Offers */}
                <div className="flex flex-col gap-3 p-5 rounded-xl border border-[#EAECF0] bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#334054] dark:text-white font-plus-jakarta">
                      Festival Offers
                    </h3>
                    <button
                      onClick={() => setFestivalOffers(!festivalOffers)}
                      className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                        festivalOffers ? "bg-[#2563EB]" : "bg-[#D2D5DA]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                          festivalOffers
                            ? "translate-x-[18px]"
                            : "translate-x-[2px]"
                        }`}
                      ></div>
                    </button>
                  </div>
                  {festivalOffers && (
                    <>
                      <div className="w-full h-px bg-[#EAECF0] border-dashed"></div>
                          <div className="flex md:items-start  w-full gap-5 max-md:flex-col">
                        <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Discount Type
                          </Label>
                          <div className="relative">
                            <select
                              value={discountType}
                              onChange={(e) => setDiscountType(e.target.value)}
                              className="w-full p-[14px_12px] border border-[#B0B0B0] rounded-lg text-sm font-plus-jakarta text-[#717171] bg-white dark:bg-gray-800 appearance-none"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M4 6L8 10L12 6"
                                  stroke="#131313"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Discount Percentage
                          </Label>
                          <Input
                            type="number"
                            maxLength={discountType === 'percentage' ? 2 : 10}
                            placeholder={discountType === 'percentage' ? "10%" : "₹ 2000"}
                            value={discountPercentage}
                            onChange={(e) => {
                              setDiscountPercentage(e.target.value);
                              clearError("discountPercentage");
                            }}
                            className="border-[#B0B0B0] text-sm font-plus-jakarta text-[#717171]"
                          />
                          {errors.discountPercentage && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.discountPercentage}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Final Price
                          </Label>
                          <Input
                            type="number"
                            placeholder="₹ 2000"
                            value={finalPrice}
                            onChange={(e) => {
                              setFinalPrice(e.target.value);
                              clearError("finalPrice");
                            }}
                            className="border-[#B0B0B0] text-sm font-plus-jakarta text-[#717171]"
                          />
                          {errors.finalPrice && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.finalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Weekly or Monthly Offers */}
                <div className="flex flex-col gap-3 p-5 rounded-xl border border-[#EAECF0] bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#334054] dark:text-white font-plus-jakarta">
                      Weekly or Monthly Offers
                    </h3>
                    <button
                      onClick={() => setWeeklyOffers(!weeklyOffers)}
                      className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                        weeklyOffers ? "bg-[#2563EB]" : "bg-[#D2D5DA]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                          weeklyOffers
                            ? "translate-x-[18px]"
                            : "translate-x-[2px]"
                        }`}
                      ></div>
                    </button>
                  </div>
                  {weeklyOffers && (
                    <>
                      <div className="w-full h-px bg-[#EAECF0] border-dashed"></div>
                        <div className="flex md:items-start  w-full gap-5 max-md:flex-col">
                        <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Discount Type
                          </Label>
                          <div className="relative">
                            <select
                              value={discountType}
                              onChange={(e) => setDiscountType(e.target.value)}
                              className="w-full p-[14px_12px] border border-[#B0B0B0] rounded-lg text-sm font-plus-jakarta text-[#717171] bg-white dark:bg-gray-800 appearance-none"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M4 6L8 10L12 6"
                                  stroke="#131313"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Discount Percentage
                          </Label>
                          <Input
                            type="number"
                            maxLength={discountType === 'percentage' ? 2 : 10}
                            placeholder={discountType === 'percentage' ? "10%" : "₹ 2000"}
                            value={discountPercentage}
                            onChange={(e) => {
                              setDiscountPercentage(e.target.value);
                              clearError("discountPercentage");
                            }}
                            className="border-[#B0B0B0] text-sm font-plus-jakarta text-[#717171]"
                          />
                          {errors.discountPercentage && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.discountPercentage}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Final Price
                          </Label>
                          <Input
                            type="number"
                            placeholder="₹ 2000"
                            value={finalPrice}
                            onChange={(e) => {
                              setFinalPrice(e.target.value);
                              clearError("finalPrice");
                            }}
                            className="border-[#B0B0B0] text-sm font-plus-jakarta text-[#717171]"
                          />
                          {errors.finalPrice && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.finalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Special Offers */}
                <div className="flex flex-col gap-3 p-5 rounded-xl border border-[#EAECF0] bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    {" "}
                    <h3 className="text-base font-bold text-[#334054] dark:text-white font-plus-jakarta">
                      Special Offers
                    </h3>
                    <button
                      onClick={() => setSpecialOffers(!specialOffers)}
                      className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                        specialOffers ? "bg-[#2563EB]" : "bg-[#D2D5DA]"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                          specialOffers
                            ? "translate-x-[18px]"
                            : "translate-x-[2px]"
                        }`}
                      ></div>
                    </button>
                  </div>
                  {specialOffers && (
                    <>
                      <div className="w-full h-px bg-[#EAECF0] border-dashed"></div>
                          <div className="flex md:items-start  w-full gap-5 max-md:flex-col">    <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Discount Type
                          </Label>
                          <div className="relative">
                            <select
                              value={discountType}
                              onChange={(e) => setDiscountType(e.target.value)}
                              className="w-full p-[14px_12px] border border-[#B0B0B0] rounded-lg text-sm font-plus-jakarta text-[#717171] bg-white dark:bg-gray-800 appearance-none"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M4 6L8 10L12 6"
                                  stroke="#131313"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Discount Percentage
                          </Label>
                          <Input
                            type="number"
                            maxLength={discountType === 'percentage' ? 2 : 10}
                            placeholder={discountType === 'percentage' ? "10%" : "₹ 2000"}
                            value={discountPercentage}
                            onChange={(e) => {
                              setDiscountPercentage(e.target.value);
                              clearError("discountPercentage");
                            }}
                            className="border-[#B0B0B0] text-sm font-plus-jakarta text-[#717171]"
                          />
                          {errors.discountPercentage && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.discountPercentage}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                          <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                            Final Price
                          </Label>
                          <Input
                            type="number"
                            placeholder="₹ 2000"
                            value={finalPrice}
                            onChange={(e) => {
                              setFinalPrice(e.target.value);
                              clearError("finalPrice");
                            }}
                            className="border-[#B0B0B0] text-sm font-plus-jakarta text-[#717171]"
                          />
                          {errors.finalPrice && (
                            <span className="text-red-500 text-xs mt-1">
                              {errors.finalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Business Details */}
          {currentStep === 5 && (
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-8 w-full">
              <h1 className="text-[32px] font-bold text-black dark:text-white font-sanse text-center">
                Business Details
              </h1>

              <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
                {/* Brand Name & Legal Company Name */}
      <div className="flex  w-full gap-5 max-md:flex-col">
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => {
                        setBrandName(e.target.value);
                        clearError("brandName");
                      }}
                      placeholder="Enter Brand Name"
                      maxLength={50}
                      className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                    {errors.brandName && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.brandName}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Legal Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        clearError("companyName");
                      }}
                      placeholder="Enter Company Name"
                        maxLength={50}
                      className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                    {errors.companyName && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.companyName}
                      </span>
                    )}
                  </div>
                </div>

                {/* GST Number & Business Email */}
                     <div className="flex  w-full gap-5 max-md:flex-col">
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      placeholder=" GST Number (Optional)"
                        maxLength={15}
                      className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Business Email ID
                    </label>
                    <input
                      type="email"
                      value={businessEmail}
                      onChange={(e) => {
                        setBusinessEmail(e.target.value);
                        clearError("businessEmail");
                      }}
                      placeholder="Enter Business Email ID (Optional)"
                      className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                    {errors.businessEmail && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.businessEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Business Phone Number */}
                <div className=" flex flex-col gap-3">
                  <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                    Business Phone number
                  </label>
                  <div className="flex gap-3">
                    <div
                      onClick={(e) => setOpen(true)}
                      className="cursor-pointer"
                    >
                      {selected && (
                        <span
                          onClick={() => {
                            setSelected(selected);
                          }}
                          className="flex h-[50px] items-center px-5 py-2 border rounded-xl gap-2 text-base text-[#717171] font-['Plus_Jakarta_Sans']"
                        >
                          {" "}
                          {React.createElement(
                            (Flags as any)[selected.isoCode],
                            {
                              title: selected.name,
                              style: { width: "24px" },
                            },
                          )}
                          {selected.dialCode.charAt(0) !== "+"
                            ? `+${selected.dialCode}`
                            : selected.dialCode}
                        </span>
                      )}
                    </div>

                    <Dialog open={open} onClose={setOpen}>
                      <DialogBackdrop
                        transition
                        className="inset-0  data-closed:opacity-1 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                      />
                      {/* {isModalOpen && ( */}
                      <div className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50">
                        <DialogPanel className="w-[150px] shadow-md bg-[#f9fafc]  shadow-[#717171] h-[3 30px] scrollbar-hide  rounded-xl px-4 max-h-[80%] overflow-y-auto">
                          <button
                            onClick={() => setOpen(false)}
                            className="fixed w-auto bg-[#f9fafc] p-3 text-[#717171] text-[16px]"
                          >
                            <span className="font-[22px] flex gap-0 items-center">
                              <IoIosArrowBack size={24} />
                              Back
                            </span>
                          </button>
                          {/* <div className="w-full text-white mt-4 rounded-xl p-3 flex border focus:border-[#BED6FF] border-[#BED6FF] px-4">
                                                <img src={SearchIcon} alt="" className="w-5 h-5" />
                                                <input
                                                  type="text"
                                                  placeholder="Search for Countries"
                                                  value={search}
                                                  onChange={(e) => setSearch(e.target.value)}
                                                  className="outline-none font-normal ml-1 placeholder:text-white px-2 text-sm w-full bg-transparent"
                                                />
                                              </div> */}

                          <ul className="mt-6 py-5">
                            {countries.map((c) => (
                              <li
                                key={c.isoCode}
                                onClick={() => {
                                  setSelected(c);
                                  setOpen(false);
                                }}
                                className="flex items-center rounded-[5px] text-[#717171] text-sm font-normal px-3 py-2 cursor-pointer"
                              >
                                {React.createElement(
                                  (Flags as any)[c.isoCode],
                                  {
                                    title: c.name,
                                    style: {
                                      width: "25px",
                                      marginRight: "12px",
                                    },
                                  },
                                )}{" "}
                                {/* {c.name} */}
                                {c.dialCode.charAt(0) !== "+"
                                  ? `+${c.dialCode}`
                                  : c.dialCode}
                              </li>
                            ))}
                          </ul>
                        </DialogPanel>
                      </div>
                      {/* )} */}
                    </Dialog>
                    {/* <Plus className="w-3 h-3 text-[#717171]" /> */}
                    {/* <span className="text-base text-[#717171] font-['Plus_Jakarta_Sans']">
                                                  91
                                                </span> */}

                    <input
                      type="text"
                      value={businessPhone}
onChange={(e) => {
  const value = e.target.value.replace(/\D/g, "") // remove all non-digit characters
  setBusinessPhone(value)
  clearError("businessPhone")
}}
                      
                      maxLength={10}
                      className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                      placeholder="Mobile Number"
                    />
                    {errors.businessPhone && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.businessPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="max-w-4xl mx-auto w-full flex flex-col gap-3">
                <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                  Business Address
                </label>
<input
                  type="text"
                  // value={formData.businessAddress}
                  // onChange={(e) => {
                  //   setFormData((prev) => ({
                  //     ...prev,
                  //     businessAddress: e.target.value,
                  //   }));
                  // }}
                  className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                  placeholder="Business Address"
                />
                <div className="flex gap-5 max-md:flex-wrap">

                    <div className="w-full relative">
                      <select
                        name="Country"
                        value="India"
                        disabled
                        className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-gray-100 dark:bg-gray-700 cursor-not-allowed appearance-none"
                      >
                        <option value="India">
                          India
                        </option>
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
                 
                    <div className="w-full relative">
                      <select
                        name="state"
                        value={stateOption2}
                        onChange={(e) => {
                          const stateVal = e.target.value;
                          setStateOption2(stateVal);
                          // setFormData((prev) => ({
                          //   ...prev,
                          //   state: stateVal,
                          //   city: "", // reset city
                          // }));
                          setCityOptions2("");
                          clearError("state");
                        }}
                          className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="" disabled>
                          Select State
                        </option>
                        {/* Render states from selected country */}
                        {data
                          .find((c) => c.name === countryOption2)
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
                      {errors.state && (
                        <span className="text-red-500 text-xs mt-1 block">
                          {errors.state}
                        </span>
                      )}
                    </div>
                  
                    <div className="w-full relative">
                      <select
                        name="city"
                        value={cityOption2}
                        onChange={(e) => {
                          const cityVal = e.target.value;
                          setCityOptions2(cityVal);
                          // setFormData((prev) => ({
                          //   ...prev,
                          //   city: cityVal,
                          // }));
                          clearError("city");
                        }}
                          className="w-full h-[50px] px-3 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="" disabled>
                          Select City
                        </option>
                        {data
                          .find((country) => country.name === countryOption2)
                          ?.states.find((state) => state.name === stateOption2)
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
                      {errors.city && (
                        <span className="text-red-500 text-xs mt-1 block">
                          {errors.city}
                        </span>
                      )}
                    </div>
                  
                  <div className="flex flex-col flex-1">
                    <input
                      type="text"
                      value={businessPincode}
                      onChange={(e) => {
                        setBusinessPincode(e.target.value.replace(/\D/g, ""));
                        clearError("businessPincode");
                      }}
                      placeholder="Pincode"
                      maxLength={6}
                             inputMode="numeric"
                      className="flex-1 h-[50px] px-3 py-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                    {errors.businessPincode && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.businessPincode}
                      </span>
                    )}
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

          {/* Step 6: Personal Details */}
          {currentStep === 6 && (
          <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
              <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white font-geist leading-normal text-center">
                Personal Details
              </h1>

             

              <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
                {/* First Name & Last Name */}
                <div className="flex gap-5 max-md:flex-col">
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        clearError("firstName");
                      }}
                      placeholder="Enter Your First Name"
                        maxLength={30}
                      className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                    {errors.firstName && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.firstName}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        clearError("lastName");
                      }}
                      placeholder="Enter Your Last Name"
                        maxLength={30}
                      className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                    {errors.lastName && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.lastName}
                      </span>
                    )}
                  </div>
                </div>

                {/* State & City */}
                <div className="flex flex-col gap-3">
                  <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                    Personal Address
                  </label>

                  <div className="flex max-md:flex-wrap gap-5">

                      <div className="w-full relative">
                        <select
                          name="Country"
                          value="India"
                          disabled
                          className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-gray-100 dark:bg-gray-700 cursor-not-allowed appearance-none"
                        >
                          <option value="India">
                            India
                          </option>
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
                   
                      <div className="w-full relative">
                        <select
                          name="state"
                          value={stateOption}
                          onChange={(e) => {
                            const stateVal = e.target.value;
                            setStateOption(stateVal);
                            // setFormData((prev) => ({
                            //   ...prev,
                            //   state: stateVal,
                            //   city: "", // reset city
                            // }));
                            setCityOptions("");
                            clearError("personalState");
                          }}
                          className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                        >
                          <option value="" disabled>
                            Select State
                          </option>
                          {/* Render states from selected country */}
                          {data
                            .find((c) => c.name === countryOption)
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
                        {errors.personalState && (
                          <span className="text-red-500 text-xs mt-1 block">
                            {errors.personalState}
                          </span>
                        )}
                      </div>
                   
                      <div className="w-full relative">
                        <select
                          name="city"
                          value={cityOption}
                          onChange={(e) => {
                            const cityVal = e.target.value;
                            setCityOptions(cityVal);
                            // setFormData((prev) => ({
                            //   ...prev,
                            //   city: cityVal,
                            // }));
                            clearError("personalCity");
                          }}
                          className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                        >
                          <option value="" disabled>
                            Select City
                          </option>
                          {data
                            .find((country) => country.name === countryOption)
                            ?.states.find((state) => state.name === stateOption)
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
                        {errors.personalCity && (
                          <span className="text-red-500 text-xs mt-1 block">
                            {errors.personalCity}
                          </span>
                        )}
                      </div>
                    
                    <div className="flex-1 flex flex-col">
                    <input
                      type="text"
                      value={personalPincode}
                      onChange={(e) => {
                        setPersonalPincode(e.target.value);
                        clearError("personalPincode");
                      }}
                      placeholder="Pincode"
                      maxLength={6}
                      className="flex-1 h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                    {errors.personalPincode && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.personalPincode}
                      </span>
                    )}
                    </div>
                  </div>
                </div>

                

                {/* Date of Birth & Marital Status */}
                <div className="flex gap-5">
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => {
                        // setFormData((prev) => ({
                        //   ...prev,
                        //   dateOfBirth: e.target.value,
                        // }))
                        setDateOfBirth(e.target.value);
                        clearError("dateOfBirth");
                      }}
                      className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                    {errors.dateOfBirth && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.dateOfBirth}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Marital Status
                    </label>
                    <div className="relative">
                      <select
                        value={maritalStatus}
                        onChange={(e) => {
                          // setFormData((prev) => ({
                          //   ...prev,
                          //   maritalStatus: e.target.value,
                          // }))
                          setMaritalStatus(e.target.value);
                          clearError("maritalStatus");
                        }}
                        className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="">Select</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
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
                    {errors.maritalStatus && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.maritalStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* ID Proof */}
                <div className="flex flex-col gap-3">
                  <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                    ID Proof
                  </label>
                  <div className="relative">
                    <select
                      value={idProof}
                      onChange={(e) => {
                        // setFormData((prev) => ({
                        //   ...prev,
                        //   idProof: e.target.value,
                        // }))
                        setIdProof(e.target.value);
                        clearError("idProof");
                      }}
                      className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-black dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                    >
                      <option value="">Select</option>
                      <option value="aadhar">Aadhar Card</option>
                      <option value="passport">Passport</option>
                      <option value="driving_license">Driving License</option>
                    </select>
                    <span>
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
                    </span>
                  </div>
                  {errors.idProof && (
                    <span className="text-red-500 text-xs mt-1">
                      {errors.idProof}
                    </span>
                  )}
                </div>

                {/* ID Photos */}
                <div className="flex flex-col gap-5">
                  <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                    ID Photos
                  </label>
                  <div className="w-[242px] max-md:w-full h-[175px] flex flex-col items-center justify-center gap-4 bg-[#F9FAFB] dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 relative overflow-hidden">
                    {idProofImage ? (
                      <img 
                        src={getImageUrl(idProofImage)} 
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
                      onChange={handleUploadIDProof}
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
                    
                    {/* Show error message */}
                    {error && (
                      <span className="text-xs text-red-500 mt-2 z-20 bg-white px-1 rounded absolute bottom-2">{error}</span>
                    )}
                  </div>
                </div>
           
              </div>
            </div>
          )}

          {/* Step 7: Terms & Conditions */}
{currentStep === 7 && (
  <div className="fixed flex max-md:flex-col max-md:gap-3 overflow-hidden">
    
    {/* Left Content */}
    <div className="flex-1 flex flex-col gap-3">
      <h1 className="text-[32px] max-md:text-base font-bold text-[#1C2939] dark:text-white">
        Terms & Conditions for Verification
      </h1>

      <p className="max-md:text-xs text-base text-[#485467] dark:text-gray-400 font-['Poppins'] leading-[155%]">
        By proceeding with the verification process on{" "}
        <span className="font-bold text-[#1C2939] dark:text-white">
          Travel Homes
        </span>
        , you agree to the following terms and conditions:
      </p>

      <p className="max-md:text-xs text-base font-['Poppins'] leading-[155%] mt-4">
        <span className="font-bold text-[#101828] dark:text-white">
          1. Accurate Information
        </span>{" "}
        <span className="text-[#334054] dark:text-gray-300">
          – Provide truthful details; false information may lead to account suspension.
        </span>
      </p>

      <p className="max-md:text-xs text-base font-['Poppins'] leading-[155%]">
        <span className="font-bold text-[#101828] dark:text-white">
          2. Data Usage & Security
        </span>{" "}
        <span className="text-[#334054] dark:text-gray-300">
          – Your data is securely stored and used only for verification.
        </span>
      </p>

      <p className="max-md:text-xs text-base font-['Poppins'] leading-[155%]">
        <span className="font-bold text-[#101828] dark:text-white">
          3. Verification Rights
        </span>{" "}
        <span className="text-[#334054] dark:text-gray-300">
          – We may deny verification if information is invalid.
        </span>
      </p>

      {/* Checkbox + Button */}
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center gap-3">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked)}
          />
          <Label htmlFor="terms" className="text-sm">
            I accept the terms and conditions
          </Label>
        </div>

         {/* <Button
          type="button"
          onClick={handleNext}
          disabled={isLoading || !termsAccepted}
          className="w-full sm:w-[200px] px-8 py-3 bg-[#131313] hover:bg-gray-800 text-white rounded-full transition"
        >
          {isLoading ? "Loading..." : "Start Verification"}
        </Button>  */}
      </div>
    </div>

    {/* Right Image */}
    <div className="flex justify-center items-center">
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/7e591c21d8b3bea0e51f3c5c2a65a03538099697?width=1000"
        alt="Verification Illustration"
        className="w-[450px] max-md:w-[280px] h-auto object-contain"
      />
    </div>
  </div>
)}


        </div>
      </div>

      {/* Footer */}
      <div className="flex w-full z-30 fixed bottom-0 items-center justify-center px-5 lg:px-20  bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg">
  <div className="max-w-4xl mx-auto w-full flex justify-between items-center gap-5">

    {/* LEFT SIDE */}
    {currentStep !== 7 && (
      <div className="flex items-center max-md:flex-col gap-6 py-4">
      <span className="max-md:hidden text-lg font-semibold text-[#131313] dark:text-white">
          {currentStep + 0}/{totalSteps - 1} Completed
        </span>
       <div className="md:hidden flex max-md:justify-between  md:items-center  gap-6">
           <button
          onClick={handleBack}
     className=" flex items-center text-sm px-6 py-1 rounded-[60px] border border-gray-200 dark:border-gray-600"
            >
          <span>Back</span>
        </button>
        <span className="text-lg font-semibold text-[#131313] dark:text-white">
          {currentStep + 0}/{totalSteps - 1} Completed
        </span>

        <button
          onClick={handleNext}
           className="flex items-center justify-center text-sm px-6 py-1 bg-[#131313] text-white rounded-full"
      >
          <span>Next</span>
        </button>
        </div>
        <div className="flex gap-[6px] w-[294px] h-[6px]">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-full rounded-2xl ${
                i <= currentStep
                  ? "bg-[#131313] dark:bg-white"
                  : "bg-[#EAECF0] dark:bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>
    )}

    {/* RIGHT SIDE */}
    {currentStep === 7 ? (
      //  ONLY VERIFICATION BUTTON
      <div className="flex justify-center items-center gap-3">
        <button
          onClick={handleBack}
          className="text-sm flex items-center gap-2 px-8 py-3 rounded-[60px] border border-gray-300 dark:border-gray-600"
        >
          <span>Back</span>
        </button>
         <button
          type="button"
          onClick={handleNext}
          disabled={isLoading || !termsAccepted}
          className="w-full sm:w-[200px] px-8 py-3 bg-[#131313] hover:bg-gray-800 text-white rounded-full transition"
        >
          {isLoading ? "Loading..." : "Start Verification"}
        </button> 
        </div>
    ) : (
      //  NORMAL NAVIGATION
      <div className="max-md:hidden flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-8 py-2 rounded-[60px] border border-gray-200 dark:border-gray-600"
        >
          <span>Back</span>
        </button>

        <button
          onClick={handleNext}
          className="flex items-center justify-center px-8 py-2 bg-[#131313] text-white rounded-[60px]"
        >
          <span>Next</span>
        </button>
      </div>
    )}
  </div>
</div>
    </div>
  );
};

export default StaysOnboarding;
