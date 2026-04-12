import React, { useEffect, useState } from "react";
import { IndianRupee, MapPin, FileText, Camera, Tag, Tent, Percent, Check } from "lucide-react";
import { Sidebar } from "@/components/Navigation";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/Header";
import { offersApi, cmsPublicApi } from "@/lib/api";
import { PiVanBold } from "react-icons/pi";
import { GiBinoculars } from "react-icons/gi";

import {
  TEAL, BLACK, GRAY_500, GRAY_400, GRAY_200, WHITE, SURFACE, ERROR, ERROR_BG,
  SectionCard, Field, StyledInput, StyledTextarea, StyledSelect,
  RulesList, PhotoGrid, FeaturePill, DiscountRow,
} from "@/components/offering";
import { CamperVanPricing, UniqueStayPricing, ActivityPricing } from "@/components/offering";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { key: "camper-van", label: "Camper Van", icon: <PiVanBold size={16} />, section: "camper-van" },
  { key: "unique-stay", label: "Unique Stays", icon: <Tent size={16} />, section: "unique-stays" },
  { key: "activity", label: "Activities", icon: <GiBinoculars size={16} />, section: "best-activity" },
];

const CATEGORIES: Record<string, string[]> = {
  "camper-van": ["Camper Trailer", "Luxury RV", "Basic Van", "Adventure Vehicle", "Panel Van", "Cargo Van", "Motorhome", "Campervan", "Caravan"],
  "unique-stay": ["Villa", "Cabin", "Castle", "Cave", "Farmhouse", "Camping", "Hut", "Heritage", "Tiny Home", "Tent", "Container", "Treehouse"],
  activity: ["Hiking", "Camping", "Rafting", "Paragliding", "Trekking", "Biking", "Safari", "Snorkeling", "Kayaking"],
};

const FEATURES: Record<string, string[]> = {
  "camper-van": ["Fan", "AC", "Kitchen", "Water", "Wifi", "Solar", "Toilet", "Shower", "Fridge", "TV", "Music", "GPS"],
  "unique-stay": ["WiFi", "AC", "Kitchen", "Pool", "Parking", "Garden", "BBQ", "Fireplace", "Hot Tub", "Gym", "Laundry"],
  activity: ["Guide", "Equipment", "Meals", "Transport", "Insurance", "Photography"],
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const AddOfferings = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("camper-van");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>({ "camper-van": true, "unique-stays": true, "best-activity": true });

  // ─── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "", category: "", description: "", rules: [""], features: [] as string[],
    photos: { cover: null as File | null, gallery: [] as File[] },
    address: "", locality: "India", pincode: "", city: "", state: "",
    seatingCapacity: "1", sleepingCapacity: "0", perKmCharge: "", perDayCharge: "",
    perKmIncludes: [] as string[], perKmExcludes: [] as string[],
    perDayIncludes: [] as string[], perDayExcludes: [] as string[],
    activityName: "", selectedActivities: [] as string[], rulesAndRegulations: [] as string[],
    timeDuration: "", personCapacity: 1, expectations: [] as string[], priceDetails: [] as any[],
    stayType: "entire", selectedProperties: [] as string[],
    guestCapacity: 1, numberOfRooms: 0, numberOfBeds: 0, numberOfBathrooms: 0,
    entireStayRules: [] as string[], optionalRules: [] as string[], rooms: [] as any[],
    regularPrice: "", priceIncludes: [] as string[], priceExcludes: [] as string[],
    firstUserDiscount: false, firstUserDiscountType: "percentage", firstUserDiscountValue: "",
    festivalOffers: false, festivalOffersType: "percentage", festivalOffersValue: "",
    weeklyMonthlyOffers: false, weeklyMonthlyOffersType: "percentage", weeklyMonthlyOffersValue: "",
    specialOffers: false, specialOffersType: "percentage", specialOffersValue: "",
    termsAccepted: false,
  });
  const [previews, setPreviews] = useState({ cover: "", gallery: [] as string[] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const set = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: (prev as any)[field].map((item: string, i: number) => (i === index ? value : item)) }));
  };

  const addArrayItem = (field: string) => {
    setFormData((prev) => ({ ...prev, [field]: [...(prev as any)[field], ""] }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({ ...prev, [field]: (prev as any)[field].filter((_: any, i: number) => i !== index) }));
  };

  const toggleFeature = (f: string) => {
    setFormData((prev) => ({ ...prev, features: prev.features.includes(f) ? prev.features.filter((x) => x !== f) : [...prev.features, f] }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "gallery", index?: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      if (type === "cover") {
        setFormData((prev) => ({ ...prev, photos: { ...prev.photos, cover: file } }));
        setPreviews((prev) => ({ ...prev, cover: url }));
        clearError("cover");
      } else {
        setFormData((prev) => {
          const g = [...prev.photos.gallery];
          if (typeof index === "number" && index < g.length) g[index] = file; else g.push(file);
          return { ...prev, photos: { ...prev.photos, gallery: g } };
        });
        setPreviews((prev) => {
          const g = [...prev.gallery];
          if (typeof index === "number" && index < g.length) g[index] = url; else g.push(url);
          return { ...prev, gallery: g };
        });
      }
    }
  };

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(file);
  });

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    cmsPublicApi.listHomepageSections().then((sections) => {
      const next: Record<string, boolean> = { "camper-van": true, "unique-stays": true, "best-activity": true };
      sections.forEach((s: any) => { next[s.sectionKey] = s.isVisible; });
      setEnabledSections(next);
      if (!next["camper-van"]) {
        if (next["unique-stays"]) setActiveTab("unique-stay");
        else if (next["best-activity"]) setActiveTab("activity");
      }
    }).catch(console.error);
  }, []);

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
    if (!formData.photos.cover) e.cover = "Cover photo is required";
    if (!formData.state) e.state = "State is required";
    if (!formData.city) e.city = "City is required";
    if (activeTab === "camper-van") {
      if (!formData.perKmCharge && !formData.perDayCharge) e.perKmCharge = "At least one pricing is required";
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
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const coverUrl = formData.photos.cover ? await fileToDataUrl(formData.photos.cover) : "";
      const galleryUrls: string[] = [];
      for (const f of formData.photos.gallery) { if (f) galleryUrls.push(await fileToDataUrl(f)); }

      let specificData: any = {};
      if (activeTab === "camper-van") {
        specificData = { seatingCapacity: Number(formData.seatingCapacity), sleepingCapacity: Number(formData.sleepingCapacity), perKmCharge: formData.perKmCharge, perDayCharge: formData.perDayCharge, perKmIncludes: formData.perKmIncludes, perKmExcludes: formData.perKmExcludes, perDayIncludes: formData.perDayIncludes, perDayExcludes: formData.perDayExcludes };
      } else if (activeTab === "unique-stay") {
        specificData = { guestCapacity: Number(formData.guestCapacity), numberOfRooms: Number(formData.numberOfRooms), numberOfBeds: Number(formData.numberOfBeds), numberOfBathrooms: Number(formData.numberOfBathrooms), stayType: formData.stayType, rooms: formData.rooms, entireStayRules: formData.entireStayRules, optionalRules: formData.optionalRules };
      } else if (activeTab === "activity") {
        specificData = { name: formData.activityName, personCapacity: Number(formData.personCapacity), timeDuration: formData.timeDuration, priceDetails: formData.priceDetails, expectations: formData.expectations };
      }

      const token = localStorage.getItem("travel_auth_token") || sessionStorage.getItem("travel_auth_token");
      if (!token) throw new Error("User not authenticated");

      await offersApi.create({
        name: activeTab === "activity" ? formData.activityName : formData.name,
        category: formData.category, description: formData.description,
        rules: formData.rules.filter(Boolean), features: formData.features,
        locality: formData.locality, pincode: formData.pincode, city: formData.city, state: formData.state, address: formData.address,
        regularPrice: Number(formData.regularPrice || 0),
        priceIncludes: formData.priceIncludes.filter(Boolean), priceExcludes: formData.priceExcludes.filter(Boolean),
        photos: { coverUrl, galleryUrls }, status: "pending", serviceType: activeTab,
        ...specificData,
        firstUserDiscount: formData.firstUserDiscount, firstUserDiscountType: formData.firstUserDiscountType, firstUserDiscountValue: formData.firstUserDiscountValue,
        festivalOffers: formData.festivalOffers, festivalOffersType: formData.festivalOffersType, festivalOffersValue: formData.festivalOffersValue,
        weeklyMonthlyOffers: formData.weeklyMonthlyOffers, weeklyMonthlyOffersType: formData.weeklyMonthlyOffersType, weeklyMonthlyOffersValue: formData.weeklyMonthlyOffersValue,
        specialOffers: formData.specialOffers, specialOffersType: formData.specialOffersType, specialOffersValue: formData.specialOffersValue,
      } as any, token);

      setShowSuccessAlert(true);
      setTimeout(() => { setShowSuccessAlert(false); navigate("/offerings"); }, 2000);
    } catch (err) {
      console.error("Submission error:", err);
      setErrors({ submit: "Failed to submit. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = CATEGORIES[activeTab] || [];
  const features = FEATURES[activeTab] || [];
  const arrayHelpers = { handleArrayChange, addArrayItem, removeArrayItem };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-plus-jakarta">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isMobile={false} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <DashboardHeader isCollapsed={isCollapsed} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">

            {/* ── Page header ── */}
            <div className="text-center space-y-2 pt-2">
              <div className="flex items-center justify-center gap-2.5 mb-3">
                <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: GRAY_400 }}>New Listing</span>
                <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
              </div>
              <h1 style={{ fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 800, color: BLACK, letterSpacing: "-0.03em", lineHeight: 1.15 }}>Add Offering</h1>
              <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>Create a new service offering for your customers.</p>
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: "flex", gap: 8, backgroundColor: SURFACE, borderRadius: 14, padding: 4 }}>
              {TABS.filter((t) => enabledSections[t.section]).map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button key={tab.key} type="button" onClick={() => { setActiveTab(tab.key); setErrors({}); }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 42, borderRadius: 11, border: `1.5px solid ${active ? `${TEAL}30` : "transparent"}`, backgroundColor: active ? WHITE : "transparent", color: active ? TEAL : GRAY_400, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                    {tab.icon} {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── Description ── */}
            <SectionCard icon={<FileText size={16} color={TEAL} strokeWidth={2.5} />} title="Description" subtitle="Basic info about your offering">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={activeTab === "activity" ? "Activity Name" : "Name"} required error={errors.name || errors.activityName}>
                  <StyledInput value={activeTab === "activity" ? formData.activityName : formData.name} onChange={(v) => set(activeTab === "activity" ? "activityName" : "name", v)} placeholder={activeTab === "activity" ? "e.g. River Rafting" : "e.g. Sunset Villa"} error={!!(errors.name || errors.activityName)} />
                </Field>
                <Field label={activeTab === "activity" ? "Activity Type" : "Category"} required error={errors.category}>
                  <StyledSelect value={formData.category} onChange={(v) => set("category", v)} placeholder="Select" error={!!errors.category}>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </StyledSelect>
                </Field>
              </div>
              <Field label="Description" required error={errors.description}>
                <StyledTextarea value={formData.description} onChange={(v) => set("description", v)} placeholder="Describe your offering in detail\u2026" error={!!errors.description} />
              </Field>
              <Field label="Rules">
                <RulesList rules={formData.rules} onChange={(i, v) => handleArrayChange("rules", i, v)} onAdd={() => addArrayItem("rules")} onRemove={(i) => removeArrayItem("rules", i)} />
              </Field>
            </SectionCard>

            {/* ── Photos ── */}
            <SectionCard icon={<Camera size={16} color={TEAL} strokeWidth={2.5} />} title="Photos" subtitle="Upload cover and gallery images">
              <PhotoGrid coverPreview={previews.cover} galleryPreviews={previews.gallery} onCoverSelect={(e) => handleFileSelect(e, "cover")} onGallerySelect={(e, i) => handleFileSelect(e, "gallery", i)} idPrefix={activeTab} error={errors.cover} />
            </SectionCard>

            {/* ── Features ── */}
            <SectionCard icon={<Tag size={16} color={TEAL} strokeWidth={2.5} />} title="Features" subtitle="What your offering includes">
              <div className="flex flex-wrap gap-2.5">
                {features.map((f) => <FeaturePill key={f} label={f} selected={formData.features.includes(f)} onClick={() => toggleFeature(f)} />)}
              </div>
            </SectionCard>

            {/* ── Location ── */}
            <SectionCard icon={<MapPin size={16} color={TEAL} strokeWidth={2.5} />} title="Location" subtitle="Where is your offering located?">
              <Field label="Address">
                <StyledInput value={formData.address} onChange={(v) => set("address", v)} placeholder="Street address" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="State" required error={errors.state}>
                  <StyledInput value={formData.state} onChange={(v) => set("state", v)} placeholder="State" error={!!errors.state} />
                </Field>
                <Field label="City" required error={errors.city}>
                  <StyledInput value={formData.city} onChange={(v) => set("city", v)} placeholder="City" error={!!errors.city} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pincode">
                  <StyledInput value={formData.pincode} onChange={(v) => set("pincode", v.replace(/\D/g, ""))} placeholder="6-digit code" maxLength={6} />
                </Field>
                <Field label="Country">
                  <StyledInput value={formData.locality} onChange={(v) => set("locality", v)} />
                </Field>
              </div>
            </SectionCard>

            {/* ── Pricing (tab-specific) ── */}
            <SectionCard icon={<IndianRupee size={16} color={TEAL} strokeWidth={2.5} />} title="Pricing" subtitle="Set your rates">
              {activeTab === "camper-van" && <CamperVanPricing formData={formData} set={set} errors={errors} {...arrayHelpers} />}
              {activeTab === "unique-stay" && <UniqueStayPricing formData={formData} set={set} errors={errors} {...arrayHelpers} />}
              {activeTab === "activity" && <ActivityPricing formData={formData} set={set} errors={errors} {...arrayHelpers} />}
            </SectionCard>

            {/* ── Discounts ── */}
            <SectionCard icon={<Percent size={16} color={TEAL} strokeWidth={2.5} />} title="Discounts" subtitle="Optional promotional offers">
              <div className="flex flex-col gap-3">
                <DiscountRow label="First User Discount" enabled={formData.firstUserDiscount} onToggle={(v) => set("firstUserDiscount", v)} type={formData.firstUserDiscountType} value={formData.firstUserDiscountValue} onTypeChange={(v) => set("firstUserDiscountType", v)} onValueChange={(v) => set("firstUserDiscountValue", v)} />
                <DiscountRow label="Festival Offers" enabled={formData.festivalOffers} onToggle={(v) => set("festivalOffers", v)} type={formData.festivalOffersType} value={formData.festivalOffersValue} onTypeChange={(v) => set("festivalOffersType", v)} onValueChange={(v) => set("festivalOffersValue", v)} />
                <DiscountRow label="Weekly / Monthly Offers" enabled={formData.weeklyMonthlyOffers} onToggle={(v) => set("weeklyMonthlyOffers", v)} type={formData.weeklyMonthlyOffersType} value={formData.weeklyMonthlyOffersValue} onTypeChange={(v) => set("weeklyMonthlyOffersType", v)} onValueChange={(v) => set("weeklyMonthlyOffersValue", v)} />
                <DiscountRow label="Special Offers" enabled={formData.specialOffers} onToggle={(v) => set("specialOffers", v)} type={formData.specialOffersType} value={formData.specialOffersValue} onTypeChange={(v) => set("specialOffersType", v)} onValueChange={(v) => set("specialOffersValue", v)} />
              </div>
            </SectionCard>

            {/* ── Submit error ── */}
            {errors.submit && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 13, backgroundColor: ERROR_BG, border: "1.5px solid #fca5a5" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" /><path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" /></svg>
                <p style={{ fontSize: 13, fontWeight: 600, color: ERROR }}>{errors.submit}</p>
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex justify-end gap-3 pt-2 pb-6">
              <button type="button" onClick={() => navigate("/offerings")} style={{ height: 44, padding: "0 24px", borderRadius: 13, border: `1.5px solid ${GRAY_200}`, backgroundColor: "transparent", fontSize: 14, fontWeight: 600, color: GRAY_500, cursor: "pointer", transition: "all 0.15s" }}>Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} style={{ height: 44, padding: "0 28px", borderRadius: 13, border: "none", backgroundColor: TEAL, fontSize: 14, fontWeight: 700, color: BLACK, cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.5 : 1, transition: "all 0.15s", boxShadow: "0 4px 20px rgba(7,228,228,0.3)" }}>
                {isSubmitting ? "Submitting\u2026" : "Submit Offering"}
              </button>
            </div>
          </div>
        </main>
      </div>

      {showSuccessAlert && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50, display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderRadius: 16, backgroundColor: "#16a34a", color: WHITE, fontSize: 14, fontWeight: 700, boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
          <Check size={16} strokeWidth={3} /> Offering submitted successfully!
        </div>
      )}
    </div>
  );
};

export default AddOfferings;
