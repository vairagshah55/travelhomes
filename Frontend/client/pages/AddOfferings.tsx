import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Menu, Plus, ChevronDown, Upload, X, ArrowLeft, Minus, ChevronLeft, ChevronRight, ChevronUp, Bath, Flame, Fan, User, Refrigerator, Wind, Tent, Utensils, Droplets, BedDouble, Table, Gamepad2, Gamepad, CupSoda, Microwave, CookingPot, MoreHorizontal, Wifi, Tv, Music, Zap, Shield, Coffee, Sun, Moon, Volume2, Lock, Map } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "@/components/Navigation";
import { useNavigate } from "react-router-dom";
import ProfileDropdown from "@/components/ProfileDropdown";
import MobileVendorNav from "@/components/MobileVendorNav";
import { DashboardHeader } from "@/components/Header";
import { offersApi, OfferDTO, cmsPublicApi } from "@/lib/api";
import { PiVanBold, PiVanFill } from "react-icons/pi";
import { FaVanShuttle, FaUserTie } from "react-icons/fa6";
import { GiBinoculars, GiCampCookingPot, GiCruiser } from "react-icons/gi";
import { Country } from "country-state-city";
import * as Flags from "country-flag-icons/react/3x2";

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

const AddOfferings = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("camper-van");
  const [dragActive, setDragActive] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>({
    'camper-van': true,
    'unique-stays': true,
    'best-activity': true,
  });

  // Consolidated Form Data for all types
  const [formData, setFormData] = useState({
    // Common
    name: "",
    category: "",
    description: "",
    rules: [""],
    features: [] as string[],
    photos: {
      cover: null as File | null,
      gallery: [] as File[],
    },
    
    // Location
    address: "",
    locality: "India",
    pincode: "",
    city: "",
    state: "",
    
    // Caravan specific
    seatingCapacity: "1",
    sleepingCapacity: "0",
    perKmCharge: "",
    perDayCharge: "",
    perKmIncludes: [] as string[],
    perKmExcludes: [] as string[],
    perDayIncludes: [] as string[],
    perDayExcludes: [] as string[],
    
    // Activity specific
    selectedActivities: [] as string[],
    activityName: "", 
    rulesAndRegulations: [] as string[],
    timeDuration: "",
    personCapacity: 1,
    expectations: [] as string[],
    priceDetails: [] as Array<{
      state: string;
      city: string;
      include: boolean;
      price?: string;
    }>,
    
    // Stays specific
    stayType: "entire", // entire | individual
    selectedProperties: [] as string[],
    guestCapacity: 1,
    numberOfRooms: 0,
    numberOfBeds: 0,
    numberOfBathrooms: 0,
    entireStayRules: [] as string[],
    optionalRules: [] as string[],
    rooms: [] as any[], // Complex room objects
    
    // Pricing (Common/Activity/Stays)
    regularPrice: "",
    priceIncludes: [] as string[],
    priceExcludes: [] as string[],

    // Discounts
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

    // Terms
    termsAccepted: false
  });

  const [previews, setPreviews] = useState({
    cover: "",
    gallery: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    cmsPublicApi.listHomepageSections().then((sections) => {
      const nextState: Record<string, boolean> = {
        'camper-van': true,
        'unique-stays': true,
        'best-activity': true,
      };
      sections.forEach((s: any) => {
        nextState[s.sectionKey] = s.isVisible;
      });
      setEnabledSections(nextState);

      const tabMap: Record<string, string> = {
        'camper-van': 'camper-van',
        'unique-stay': 'unique-stays',
        'activity': 'best-activity'
      };

      if (!nextState['camper-van']) {
         if (nextState['unique-stays']) setActiveTab('unique-stay');
         else if (nextState['best-activity']) setActiveTab('activity');
      }
    }).catch(console.error);
  }, []);

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map(
        (item: string, i: number) => (i === index ? value : item),
      ),
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev], ""],
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].filter(
        (_: any, i: number) => i !== index,
      ),
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: "cover" | "gallery") => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (type === "cover") {
        setFormData((prev) => ({
          ...prev,
          photos: { ...prev.photos, cover: file },
        }));
        setPreviews((prev) => ({ ...prev, cover: URL.createObjectURL(file) }));
      } else {
        setFormData((prev) => ({
          ...prev,
          photos: {
            ...prev.photos,
            gallery: [...prev.photos.gallery, file],
          },
        }));
        setPreviews((prev) => ({
             ...prev,
             gallery: [...prev.gallery, URL.createObjectURL(file)]
        }));
      }
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "gallery",
    index?: number
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);

      if (type === "cover") {
        setFormData((prev) => ({
          ...prev,
          photos: { ...prev.photos, cover: file },
        }));
        setPreviews((prev) => ({ ...prev, cover: url }));
      } else {
        setFormData((prev) => {
          const newGallery = [...prev.photos.gallery];
          if (typeof index === "number" && index < newGallery.length) {
             // Replacing existing
             newGallery[index] = file;
          } else {
             // Adding new
             newGallery.push(file);
          }
          return {
            ...prev,
            photos: {
              ...prev.photos,
              gallery: newGallery,
            },
          };
        });
        setPreviews((prev) => {
          const newGallery = [...prev.gallery];
           if (typeof index === "number" && index < newGallery.length) {
            newGallery[index] = url;
          } else {
            newGallery.push(url);
          }
          return { ...prev, gallery: newGallery };
        });
      }
    }
  };

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleSubmit = async () => {
    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.name && activeTab !== "activity") newErrors.name = "Name is required";
    if (!formData.activityName && activeTab === "activity") newErrors.name = "Activity Name is required";
    if (!formData.category && activeTab !== "activity") newErrors.category = "Category is required";
    if (!formData.description) newErrors.description = "Description is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        // Convert selected images to data URLs
        const coverUrl = formData.photos.cover ? await fileToDataUrl(formData.photos.cover) : '';
        const galleryUrls: string[] = [];
        
        if (formData.photos.gallery && Array.isArray(formData.photos.gallery)) {
          for (const f of formData.photos.gallery) {
            if (f) {
              const dataUrl = await fileToDataUrl(f);
              galleryUrls.push(dataUrl);
            }
          }
        }

        // Construct payload based on activeTab
        let specificData: any = {};

        if (activeTab === 'camper-van') {
          specificData = {
            seatingCapacity: formData.seatingCapacity ? Number(formData.seatingCapacity) : undefined,
            sleepingCapacity: formData.sleepingCapacity ? Number(formData.sleepingCapacity) : undefined,
            perKmCharge: formData.perKmCharge,
            perDayCharge: formData.perDayCharge,
            perKmIncludes: formData.perKmIncludes,
            perKmExcludes: formData.perKmExcludes,
            perDayIncludes: formData.perDayIncludes,
            perDayExcludes: formData.perDayExcludes,
          };
        } else if (activeTab === 'unique-stay') {
          specificData = {
            guestCapacity: formData.guestCapacity ? Number(formData.guestCapacity) : undefined,
            numberOfRooms: formData.numberOfRooms ? Number(formData.numberOfRooms) : undefined,
            numberOfBeds: formData.numberOfBeds ? Number(formData.numberOfBeds) : undefined,
            numberOfBathrooms: formData.numberOfBathrooms ? Number(formData.numberOfBathrooms) : undefined,
            stayType: formData.stayType,
            rooms: formData.rooms,
            entireStayRules: formData.entireStayRules,
            optionalRules: formData.optionalRules,
          };
        } else if (activeTab === 'activity') {
          specificData = {
            name: formData.activityName,
            personCapacity: formData.personCapacity ? Number(formData.personCapacity) : undefined,
            timeDuration: formData.timeDuration,
            priceDetails: formData.priceDetails,
            expectations: formData.expectations,
          };
        }
        
        // Get token
        const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token');
        if (!token) {
             throw new Error("User not authenticated");
        }

        const payload: any = {
          name: activeTab === 'activity' ? formData.activityName : formData.name,
          category: formData.category,
          description: formData.description,
          rules: formData.rules.filter(Boolean),
          features: formData.features,
          locality: formData.locality,
          pincode: formData.pincode,
          city: formData.city,
          state: formData.state,
          address: formData.address,
          regularPrice: Number(formData.regularPrice || 0),
          priceIncludes: formData.priceIncludes.filter(Boolean),
          priceExcludes: formData.priceExcludes.filter(Boolean),
          photos: { coverUrl, galleryUrls },
          status: 'pending',
          serviceType: activeTab,
          ...specificData,
          
           // Discounts
           firstUserDiscount: formData.firstUserDiscount,
           firstUserDiscountType: formData.firstUserDiscountType,
           firstUserDiscountValue: formData.firstUserDiscountValue,
           
           festivalOffers: formData.festivalOffers,
           festivalOffersType: formData.festivalOffersType,
           festivalOffersValue: formData.festivalOffersValue,
           
           weeklyMonthlyOffers: formData.weeklyMonthlyOffers,
           weeklyMonthlyOffersType: formData.weeklyMonthlyOffersType,
           weeklyMonthlyOffersValue: formData.weeklyMonthlyOffersValue,
           
           specialOffers: formData.specialOffers,
           specialOffersType: formData.specialOffersType,
           specialOffersValue: formData.specialOffersValue,
        };
        
        console.log("Submitting Payload:", payload);

        await offersApi.create(payload, token);
        
        setShowSuccessAlert(true);
        setTimeout(() => {
            setShowSuccessAlert(false);
            navigate("/offerings");
        }, 2000);
      } catch (err) {
        console.error("Submission error:", err);
        setErrors({ submit: "Failed to submit. Please try again." });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden font-plus-jakarta">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isMobile={false} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <DashboardHeader 
            isCollapsed={isCollapsed} 
            isMobileMenuOpen={isMobileMenuOpen} 
            setIsMobileMenuOpen={setIsMobileMenuOpen} 
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-dashboard-title dark:text-white">Add Offering</h1>
                    <p className="text-dashboard-text dark:text-gray-400">Create a new service offering for your customers</p>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-1">
                    {enabledSections['camper-van'] && (
                        <button 
                            onClick={() => setActiveTab('camper-van')}
                            className={`pb-3 px-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === 'camper-van' ? 'border-dashboard-primary text-dashboard-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <div className="flex items-center gap-2"><PiVanBold size={18} /> Camper Van</div>
                        </button>
                    )}
                    {enabledSections['unique-stays'] && (
                        <button 
                            onClick={() => setActiveTab('unique-stay')}
                            className={`pb-3 px-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === 'unique-stay' ? 'border-dashboard-primary text-dashboard-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <div className="flex items-center gap-2"><Tent size={18} /> Unique Stays</div>
                        </button>
                    )}
                    {enabledSections['best-activity'] && (
                        <button 
                            onClick={() => setActiveTab('activity')}
                            className={`pb-3 px-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === 'activity' ? 'border-dashboard-primary text-dashboard-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <div className="flex items-center gap-2"><GiBinoculars size={18} /> Activities</div>
                        </button>
                    )}
                </div>

                {/* Form Content */}
                <div className="space-y-6">
                    {/* Camper Van Form */}
                    {activeTab === "camper-van" && (
                      <div className="space-y-6">
                        {/* Descriptions */}
                        <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-800">
                           <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta mb-4">Descriptions</h3>
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                             <div className="space-y-2">
                               <Label className="text-dashboard-title dark:text-gray-300">Name</Label>
                               <Input value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} placeholder="Name" className="figma-input" />
                             </div>
                             <div className="space-y-2">
                               <Label className="text-dashboard-title dark:text-gray-300">Category</Label>
                               <Select value={formData.category} onValueChange={(val) => handleInputChange("category", val)}>
                                 <SelectTrigger className="figma-input"><SelectValue placeholder="Select" /></SelectTrigger>
                                 <SelectContent>
                                   {["Camper Trailer", "Luxury RV", "Basic Van", "Adventure Vehicle"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                 </SelectContent>
                               </Select>
                             </div>
                           </div>
                           <div className="space-y-2 mb-6">
                             <Label className="text-dashboard-title dark:text-gray-300">Description</Label>
                             <Textarea value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} placeholder="Description" className="figma-input min-h-[100px]" />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-dashboard-title dark:text-gray-300">Rules</Label>
                             {formData.rules.map((rule, i) => (
                               <div key={i} className="flex gap-2">
                                 <Input value={rule} onChange={(e) => handleArrayChange("rules", i, e.target.value)} placeholder="Rule" className="figma-input" />
                                 <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("rules", i)}><X size={16} /></Button>
                               </div>
                             ))}
                             <Button type="button" variant="ghost" onClick={() => addArrayItem("rules")} className="text-dashboard-primary p-0 h-auto"><Plus size={12} className="mr-2" /> Add Rule</Button>
                           </div>
                        </div>

                        {/* Photos */}
                        <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-800">
                          <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta mb-4">Upload Photos</h3>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                             <div className="lg:col-span-1 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center relative overflow-hidden h-48" onClick={() => document.getElementById("camper-cover-upload")?.click()}>
                               {previews.cover ? <img src={previews.cover} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-gray-400 flex flex-col items-center"><Upload className="mb-2" /><span>Cover Photo</span></div>}
                               <input id="camper-cover-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "cover")} />
                             </div>
                             <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                               {[...Array(4)].map((_, i) => (
                                 <div key={i} className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center relative overflow-hidden h-48" onClick={() => document.getElementById(`camper-gallery-upload-${i}`)?.click()}>
                                   {previews.gallery[i] ? <img src={previews.gallery[i]} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-gray-400 flex flex-col items-center"><Plus className="mb-2" /><span>Photo {i+1}</span></div>}
                                   <input id={`camper-gallery-upload-${i}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "gallery", i)} />
                                 </div>
                               ))}
                             </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-800">
                          <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta mb-4">Details</h3>
                          
                          {/* Features */}
                          <div className="mb-6">
                            <Label className="block mb-2 text-dashboard-title dark:text-gray-300">Features</Label>
                            <div className="flex flex-wrap gap-2">
                              {["Fan", "AC", "Kitchen", "Water", "Wifi", "Solar"].map(f => (
                                <button key={f} type="button" onClick={() => handleFeatureToggle(f)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${formData.features.includes(f) ? "bg-dashboard-primary text-white border-dashboard-primary" : "bg-gray-50 border-gray-200 text-gray-700"}`}>{f}</button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-5 mb-6">
                            <div><Label>Seating Capacity</Label><Input type="number" value={formData.seatingCapacity} onChange={(e) => handleInputChange("seatingCapacity", e.target.value)} className="figma-input" /></div>
                            <div><Label>Sleeping Capacity</Label><Input type="number" value={formData.sleepingCapacity} onChange={(e) => handleInputChange("sleepingCapacity", e.target.value)} className="figma-input" /></div>
                          </div>

                          <div className="space-y-4">
                            <div><Label>Address</Label><Input value={formData.address} onChange={(e) => handleInputChange("address", e.target.value)} className="figma-input" /></div>
                            <div className="grid grid-cols-2 gap-5">
                               <div><Label>Locality</Label><Input value={formData.locality} onChange={(e) => handleInputChange("locality", e.target.value)} className="figma-input" /></div>
                               <div><Label>City</Label><Input value={formData.city} onChange={(e) => handleInputChange("city", e.target.value)} className="figma-input" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                               <div><Label>State</Label><Input value={formData.state} onChange={(e) => handleInputChange("state", e.target.value)} className="figma-input" /></div>
                               <div><Label>Pincode</Label><Input value={formData.pincode} onChange={(e) => handleInputChange("pincode", e.target.value)} className="figma-input" /></div>
                            </div>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-800">
                          <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta mb-4">Pricing</h3>
                          <div className="grid grid-cols-2 gap-5 mb-6">
                            <div><Label>Per Km Charge</Label><Input type="number" value={formData.perKmCharge} onChange={(e) => handleInputChange("perKmCharge", e.target.value)} className="figma-input" /></div>
                            <div><Label>Per Day Charge</Label><Input type="number" value={formData.perDayCharge} onChange={(e) => handleInputChange("perDayCharge", e.target.value)} className="figma-input" /></div>
                          </div>
                          
                          {/* Includes/Excludes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* Per KM Includes */}
                             <div className="space-y-2">
                               <Label>Per Km Includes</Label>
                               {formData.perKmIncludes.map((item, i) => (
                                 <div key={i} className="flex gap-2"><Input value={item} onChange={(e) => handleArrayChange("perKmIncludes", i, e.target.value)} className="figma-input" /><Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("perKmIncludes", i)}><X size={16} /></Button></div>
                               ))}
                               <Button type="button" variant="ghost" onClick={() => addArrayItem("perKmIncludes")} className="text-dashboard-primary p-0 h-auto"><Plus size={12} className="mr-2" /> Add</Button>
                            </div>
                            {/* Per KM Excludes */}
                             <div className="space-y-2">
                               <Label>Per Km Excludes</Label>
                               {formData.perKmExcludes.map((item, i) => (
                                 <div key={i} className="flex gap-2"><Input value={item} onChange={(e) => handleArrayChange("perKmExcludes", i, e.target.value)} className="figma-input" /><Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("perKmExcludes", i)}><X size={16} /></Button></div>
                               ))}
                               <Button type="button" variant="ghost" onClick={() => addArrayItem("perKmExcludes")} className="text-dashboard-primary p-0 h-auto"><Plus size={12} className="mr-2" /> Add</Button>
                            </div>
                          </div>

                          <div className="mt-6 border-t pt-6">
                            <h4 className="font-semibold mb-4">Discounts</h4>
                            <div className="space-y-4">
                               <div className="flex items-center gap-2">
                                  <Checkbox checked={formData.firstUserDiscount} onCheckedChange={(c) => handleCheckboxChange("firstUserDiscount", c as boolean)} />
                                  <Label>First User Discount</Label>
                               </div>
                               {formData.firstUserDiscount && (
                                 <div className="grid grid-cols-2 gap-4 pl-6">
                                    <Input value={formData.firstUserDiscountValue} onChange={(e) => handleInputChange("firstUserDiscountValue", e.target.value)} placeholder="Value" />
                                    <Select value={formData.firstUserDiscountType} onValueChange={(v) => handleInputChange("firstUserDiscountType", v)}>
                                       <SelectTrigger><SelectValue /></SelectTrigger>
                                       <SelectContent><SelectItem value="percentage">%</SelectItem><SelectItem value="fixed">Fixed</SelectItem></SelectContent>
                                    </Select>
                                 </div>
                               )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unique Stay Form */}
                    {activeTab === "unique-stay" && (
                      <div className="space-y-6">
                         <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-800">
                           <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta mb-4">Descriptions</h3>
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                             <div className="space-y-2">
                               <Label>Name</Label>
                               <Input value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="figma-input" />
                             </div>
                             <div className="space-y-2">
                               <Label>Property Type</Label>
                               <Select value={formData.category} onValueChange={(val) => handleInputChange("category", val)}>
                                 <SelectTrigger className="figma-input"><SelectValue placeholder="Select" /></SelectTrigger>
                                 <SelectContent>
                                   {["Villa", "Cabin", "Castle", "Cave", "Farmhouse", "Camping", "Hut", "Heritage", "Tiny Home", "Tent", "Container"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                 </SelectContent>
                               </Select>
                             </div>
                           </div>
                           <div className="space-y-2 mb-6">
                             <Label>Description</Label>
                             <Textarea value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} className="figma-input min-h-[100px]" />
                           </div>
                           <div className="space-y-2">
                             <Label>Rules</Label>
                             {formData.rules.map((rule, i) => (
                               <div key={i} className="flex gap-2"><Input value={rule} onChange={(e) => handleArrayChange("rules", i, e.target.value)} className="figma-input" /><Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("rules", i)}><X size={16} /></Button></div>
                             ))}
                             <Button type="button" variant="ghost" onClick={() => addArrayItem("rules")} className="text-dashboard-primary p-0 h-auto"><Plus size={12} className="mr-2" /> Add Rule</Button>
                           </div>
                         </div>

                        {/* Photos */}
                        <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-800">
                          <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta mb-4">Upload Photos</h3>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                             <div className="lg:col-span-1 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center relative overflow-hidden h-48" onClick={() => document.getElementById("stay-cover-upload")?.click()}>
                               {previews.cover ? <img src={previews.cover} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-gray-400 flex flex-col items-center"><Upload className="mb-2" /><span>Cover Photo</span></div>}
                               <input id="stay-cover-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "cover")} />
                             </div>
                             <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                               {[...Array(4)].map((_, i) => (
                                 <div key={i} className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center relative overflow-hidden h-48" onClick={() => document.getElementById(`stay-gallery-upload-${i}`)?.click()}>
                                   {previews.gallery[i] ? <img src={previews.gallery[i]} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-gray-400 flex flex-col items-center"><Plus className="mb-2" /><span>Photo {i+1}</span></div>}
                                   <input id={`stay-gallery-upload-${i}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "gallery", i)} />
                                 </div>
                               ))}
                             </div>
                          </div>
                        </div>

                         <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-800">
                            <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 mb-4">Pricing & Capacity</h3>
                            <div className="grid grid-cols-2 gap-5 mb-4">
                               <div><Label>Regular Price (Entire/Room)</Label><Input type="number" value={formData.regularPrice} onChange={(e) => handleInputChange("regularPrice", e.target.value)} className="figma-input" /></div>
                               <div><Label>Guest Capacity</Label><Input type="number" value={formData.guestCapacity} onChange={(e) => handleInputChange("guestCapacity", e.target.value)} className="figma-input" /></div>
                            </div>
                            <div className="space-y-4">
                              <Label>Price Includes</Label>
                               {formData.priceIncludes.map((item, i) => (
                                 <div key={i} className="flex gap-2"><Input value={item} onChange={(e) => handleArrayChange("priceIncludes", i, e.target.value)} className="figma-input" /><Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("priceIncludes", i)}><X size={16} /></Button></div>
                               ))}
                               <Button type="button" variant="ghost" onClick={() => addArrayItem("priceIncludes")} className="text-dashboard-primary p-0 h-auto"><Plus size={12} className="mr-2" /> Add</Button>
                            </div>
                         </div>
                      </div>
                    )}

                    {/* Activity Form */}
                    {activeTab === "activity" && (
                        <div className="space-y-6">
                            <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-800">
                               <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 mb-4">Activity Details</h3>
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                                 <div className="space-y-2">
                                   <Label>Activity Name</Label>
                                   <Input value={formData.activityName} onChange={(e) => handleInputChange("activityName", e.target.value)} className="figma-input" />
                                 </div>
                                  <div className="space-y-2">
                                    <Label>Activity Type</Label>
                                    <Select value={formData.category} onValueChange={(val) => handleInputChange("category", val)}>
                                       <SelectTrigger className="figma-input"><SelectValue placeholder="Select" /></SelectTrigger>
                                       <SelectContent>
                                          {["Hiking", "Camping", "Rafting", "Paragliding", "Trekking", "Biking", "Safari"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                       </SelectContent>
                                    </Select>
                                  </div>
                               </div>
                               <div className="space-y-2 mb-6">
                                 <Label>Description</Label>
                                 <Textarea value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} className="figma-input min-h-[100px]" />
                               </div>
                               <div className="space-y-2">
                                 <Label>Rules</Label>
                                 {formData.rules.map((rule, i) => (
                                   <div key={i} className="flex gap-2"><Input value={rule} onChange={(e) => handleArrayChange("rules", i, e.target.value)} className="figma-input" /><Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("rules", i)}><X size={16} /></Button></div>
                                 ))}
                                 <Button type="button" variant="ghost" onClick={() => addArrayItem("rules")} className="text-dashboard-primary p-0 h-auto"><Plus size={12} className="mr-2" /> Add Rule</Button>
                               </div>
                            </div>
                            
                            {/* Photos */}
                             <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-800">
                              <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 font-plus-jakarta mb-4">Upload Photos</h3>
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                 <div className="lg:col-span-1 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center relative overflow-hidden h-48" onClick={() => document.getElementById("activity-cover-upload")?.click()}>
                                   {previews.cover ? <img src={previews.cover} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-gray-400 flex flex-col items-center"><Upload className="mb-2" /><span>Cover Photo</span></div>}
                                   <input id="activity-cover-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "cover")} />
                                 </div>
                                 <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                                   {[...Array(4)].map((_, i) => (
                                     <div key={i} className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center relative overflow-hidden h-48" onClick={() => document.getElementById(`activity-gallery-upload-${i}`)?.click()}>
                                       {previews.gallery[i] ? <img src={previews.gallery[i]} className="absolute inset-0 w-full h-full object-cover" /> : <div className="text-gray-400 flex flex-col items-center"><Plus className="mb-2" /><span>Photo {i+1}</span></div>}
                                       <input id={`activity-gallery-upload-${i}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "gallery", i)} />
                                     </div>
                                   ))}
                                 </div>
                              </div>
                            </div>

                            <div className="border border-dashboard-stroke dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-800">
                                <h3 className="text-base font-semibold text-dashboard-title dark:text-gray-300 mb-4">Pricing & Capacity</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-4">
                                   <div><Label>Regular Price</Label><Input type="number" value={formData.regularPrice} onChange={(e) => handleInputChange("regularPrice", e.target.value)} className="figma-input" /></div>
                                   <div><Label>Person Capacity</Label><Input type="number" value={formData.personCapacity} onChange={(e) => handleInputChange("personCapacity", e.target.value)} className="figma-input" /></div>
                                   <div><Label>Time Duration</Label><Input value={formData.timeDuration} onChange={(e) => handleInputChange("timeDuration", e.target.value)} placeholder="e.g. 2 Hours" className="figma-input" /></div>
                                </div>
                                 <div className="space-y-4">
                                  <Label>Price Includes</Label>
                                   {formData.priceIncludes.map((item, i) => (
                                     <div key={i} className="flex gap-2"><Input value={item} onChange={(e) => handleArrayChange("priceIncludes", i, e.target.value)} className="figma-input" /><Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem("priceIncludes", i)}><X size={16} /></Button></div>
                                   ))}
                                   <Button type="button" variant="ghost" onClick={() => addArrayItem("priceIncludes")} className="text-dashboard-primary p-0 h-auto"><Plus size={12} className="mr-2" /> Add</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" onClick={() => navigate("/offerings")}>Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        className="bg-dashboard-primary hover:bg-dashboard-primary/90 text-white"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Offering"}
                    </Button>
                </div>
            </div>
        </main>
      </div>

      {showSuccessAlert && (
         <div className="fixed bottom-6 right-6 z-50">
           <Alert className="bg-green-500 text-white border-none shadow-lg w-80">
             <AlertDescription>Offering submitted successfully!</AlertDescription>
           </Alert>
         </div>
      )}
    </div>
  );
};

export default AddOfferings;
