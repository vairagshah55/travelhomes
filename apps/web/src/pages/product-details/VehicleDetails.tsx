import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PhotoGallery, { uniqueStayImages } from "../../components/PhotoGallery";
import {
  Briefcase,
  Coffee,
  Fuel,
  Settings2,
  Shield,
  Snowflake,
  Star,
  Thermometer,
  Users,
} from "lucide-react";
import {
  FaBluetoothB,
  FaCarSide,
  FaMapMarkedAlt,
  FaMusic,
  FaSnowflake,
  FaUsb,
  FaWifi,
} from "react-icons/fa";
import { MdChildCare, MdOutlineLuggage } from "react-icons/md";
import MobileUserNav from "@/components/MobileUserNav";
import ShareModal from "./ShareModal";
import { LoginModal } from "@/components/product-details/LoginModal";
import { BookingWidget } from "@/components/product-details/BookingWidget";
import { MobileBookingBar } from "@/components/product-details/MobileBookingBar";
import { ShareSaveButtons } from "@/components/product-details/ShareSaveButtons";
import { HostedByCard } from "@/components/product-details/HostedByCard";
import { StickyNavBar } from "@/components/product-details/StickyNavBar";
import { ImageGalleryHero } from "@/components/product-details/ImageGalleryHero";
import {
  InclusionsSection,
  ExclusionsSection,
  HouseRulesSection,
} from "@/components/product-details/ListSections";
import { AmenitiesSection } from "@/components/product-details/AmenitiesSection";
import { HiddenPdfView } from "@/components/product-details/HiddenPdfView";
import { ReviewsSection as DetailsReviewsSection } from "@/components/product-details/ReviewsSection";
import { TitleMetaHeader } from "@/components/product-details/TitleMetaHeader";
import { IoIosArrowBack } from "react-icons/io";
import { offersApi, OfferDTO, API_BASE_URL, vendorPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import ReadMore from "@/components/ReadMore";
import ProductDetailsSkeleton from "@/components/product-details/ProductDetailsSkeleton";

/** Human labels for the enum values stored on the offer. */
const FUEL_POLICY_LABEL: Record<string, string> = {
  included: "Fuel included in the rate",
  excluded: "Fuel paid by you",
  "same-to-same": "Return at the same fuel level",
};

const TOLLS_LABEL: Record<string, string> = {
  included: "Tolls & parking included",
  "on-actuals": "Tolls & parking on actuals",
};

/**
 * Vehicle rental detail page.
 *
 * Composes the same product-details kit the three older detail pages use, with
 * two rental-specific additions:
 *
 *   - a rental-mode selector in the booking widget, offering only the modes the
 *     vendor enabled, with each mode's own per-day rate;
 *   - pickup and return times, because a rental is priced from the hour it
 *     starts. The search page passes both through the query string, so the
 *     widget opens on whatever window the guest searched for.
 *
 * Inclusions/exclusions follow the selected mode rather than the offer's flat
 * priceIncludes: showing self-drive inclusions to someone booking a chauffeur
 * would misstate the contract they're about to pay for.
 */
export default function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Seeded from the search query string when present, so the dates and times
  // the guest already chose survive the navigation.
  const [checkInDate, setCheckInDate] = useState<Date>(() => {
    const v = searchParams.get("checkin");
    const d = v ? new Date(v) : null;
    return d && !Number.isNaN(d.getTime()) ? d : new Date();
  });
  const [checkOutDate, setCheckOutDate] = useState<Date>(() => {
    const v = searchParams.get("checkout");
    const d = v ? new Date(v) : null;
    return d && !Number.isNaN(d.getTime()) ? d : new Date(Date.now() + 24 * 60 * 60 * 1000);
  });
  const [pickupTime, setPickupTime] = useState(searchParams.get("pickupTime") || "10:00");
  const [returnTime, setReturnTime] = useState(searchParams.get("returnTime") || "10:00");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0, pet: 0 });

  // ─── Offer + vendor ─────────────────────────────────────────────────────
  const offerQuery = useQuery<OfferDTO | null>({
    queryKey: ["offer", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await offersApi.get(id!);
      return ((res as any)?.data ?? null) as OfferDTO | null;
    },
  });
  const vehicle = (offerQuery.data ?? null) as any;
  const loadingVehicle = offerQuery.isLoading;

  const vendorId = vehicle?.vendorId;
  const vendorQuery = useQuery<any | null>({
    queryKey: ["vendor", "public", vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      try {
        const v = await vendorPublicApi.get(vendorId);
        return v?.data ?? null;
      } catch {
        return null;
      }
    },
  });
  const vendor = vendorQuery.data ?? null;
  const loadingVendor = vendorQuery.isLoading;

  // ─── Rental modes ───────────────────────────────────────────────────────
  // Only what the vendor enabled, cheaper mode first so the default selection
  // matches the "from" price the search card advertised.
  const rentalModes = useMemo(() => {
    if (!vehicle) return [];
    const modes: { value: string; label: string; perDay: number; hint?: string }[] = [];
    if (vehicle.selfDriveEnabled) {
      modes.push({
        value: "self-drive",
        label: "Self-Drive",
        perDay: Number(vehicle.selfDrivePerDay || 0),
        hint: "You drive. Valid licence required.",
      });
    }
    if (vehicle.withDriverEnabled) {
      modes.push({
        value: "with-driver",
        label: "With Driver",
        perDay: Number(vehicle.withDriverPerDay || 0),
        hint: "A chauffeur is included.",
      });
    }
    return modes.sort((a, b) => a.perDay - b.perDay);
  }, [vehicle]);

  const [rentalMode, setRentalMode] = useState<string>("");
  // Land on the first available mode once the offer loads. Kept in an effect
  // rather than a lazy initialiser because `vehicle` is undefined on mount.
  useEffect(() => {
    if (!rentalMode && rentalModes.length > 0) setRentalMode(rentalModes[0].value);
  }, [rentalModes, rentalMode]);

  const selectedMode = rentalModes.find((m) => m.value === rentalMode) ?? rentalModes[0];
  const displayRate = selectedMode?.perDay || Number(vehicle?.regularPrice || 0);

  // ─── Content ────────────────────────────────────────────────────────────
  const description = vehicle?.description || "";

  // Inclusions/exclusions track the selected mode, falling back to the offer's
  // flat lists for any legacy row that has no per-mode arrays.
  const inclusions: string[] =
    (rentalMode === "with-driver" ? vehicle?.withDriverIncludes : vehicle?.selfDriveIncludes) ||
    vehicle?.priceIncludes ||
    [];
  const exclusions: string[] =
    (rentalMode === "with-driver" ? vehicle?.withDriverExcludes : vehicle?.selfDriveExcludes) ||
    vehicle?.priceExcludes ||
    [];
  const policies: string[] = vehicle?.rules || [];

  const getAmenityIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("wifi") || n.includes("internet")) return FaWifi;
    if (n.includes("bluetooth")) return FaBluetoothB;
    if (n.includes("usb") || n.includes("charger") || n.includes("charging")) return FaUsb;
    if (n.includes("gps") || n.includes("navigation") || n.includes("map")) return FaMapMarkedAlt;
    if (n.includes("music") || n.includes("speaker") || n.includes("audio")) return FaMusic;
    if (n.includes("child") || n.includes("baby") || n.includes("infant")) return MdChildCare;
    if (n.includes("luggage") || n.includes("boot") || n.includes("carrier")) return MdOutlineLuggage;
    if (n.includes("ac") || n.includes("air condition") || n.includes("climate"))
      return FaSnowflake;
    if (n.includes("heater") || n.includes("temperature")) return Thermometer;
    if (n.includes("camera") || n.includes("sensor") || n.includes("airbag") || n.includes("safe"))
      return Shield;
    if (n.includes("car") || n.includes("parking") || n.includes("spare")) return FaCarSide;
    if (n.includes("coffee") || n.includes("cup")) return Coffee;
    return Star;
  };

  const amenities = (vehicle?.features || []).map((feature: string) => ({
    icon: getAmenityIcon(feature),
    name: feature,
  }));
  const visibleAmenities = showAll ? amenities : amenities.slice(0, 12);

  // Rental terms rendered as a plain list — they're prose statements, not
  // amenities, so they don't belong in the icon grid above.
  const rentalTerms = useMemo(() => {
    if (!vehicle) return [];
    const terms: string[] = [];
    if (vehicle.fuelPolicy && FUEL_POLICY_LABEL[vehicle.fuelPolicy]) {
      terms.push(FUEL_POLICY_LABEL[vehicle.fuelPolicy]);
    }
    if (vehicle.tollsAndParking && TOLLS_LABEL[vehicle.tollsAndParking]) {
      terms.push(TOLLS_LABEL[vehicle.tollsAndParking]);
    }
    if (rentalMode === "self-drive") {
      if (Number(vehicle.freeKmPerDay) > 0) {
        terms.push(`${vehicle.freeKmPerDay} km included per day`);
      }
      if (Number(vehicle.extraKmCharge) > 0) {
        terms.push(`₹${vehicle.extraKmCharge} per extra km beyond the daily allowance`);
      }
      if (Number(vehicle.securityDeposit) > 0) {
        terms.push(
          `Refundable security deposit of ₹${Number(vehicle.securityDeposit).toLocaleString()}`,
        );
      }
      if (Number(vehicle.minRentalHours) > 0) {
        terms.push(`Minimum rental of ${vehicle.minRentalHours} hours`);
      }
    }
    if (rentalMode === "with-driver") {
      if (Number(vehicle.driverAllowancePerDay) > 0) {
        terms.push(`Driver allowance of ₹${vehicle.driverAllowancePerDay} per day`);
      }
      if (Number(vehicle.nightChargeAfter) > 0) {
        terms.push(`Night charge applies after ${vehicle.nightChargeAfter}:00`);
      }
      if (Number(vehicle.outstationPerKm) > 0) {
        terms.push(`Outstation travel at ₹${vehicle.outstationPerKm} per km`);
      }
    }
    if (Number(vehicle.cancellationWindowHours) > 0) {
      terms.push(`Free cancellation up to ${vehicle.cancellationWindowHours} hours before pickup`);
    }
    return terms;
  }, [vehicle, rentalMode]);

  const handleContactOwner = async () => {
    if (!isAuthenticated || !user) {
      navigate("/register");
      return;
    }
    if (!vendor?._id) {
      toast.error("Cannot contact owner: Vendor details missing");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/vendorchats/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor._id,
          userId: user.id,
          title: `${vendor.brandName || vendor.personName || "Vendor"} - ${user.name || "User"}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        navigate("/chat", { state: { conversationId: json.data._id } });
      } else {
        toast.error("Failed to start chat: " + (json.message || "Unknown error"));
      }
    } catch {
      toast.error("Error starting chat. Please try again.");
    }
  };

  useEffect(() => {
    const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const allTabs = [
    { id: "overview", label: "Overview", hasContent: true },
    { id: "amenities", label: "Features", hasContent: amenities.length > 0 },
    { id: "terms", label: "Rental Terms", hasContent: rentalTerms.length > 0 },
    { id: "inclusions", label: "Inclusions", hasContent: inclusions.length > 0 },
    { id: "exclusions", label: "Exclusions", hasContent: exclusions.length > 0 },
    { id: "policies", label: "Policies & Rules", hasContent: policies.length > 0 },
    { id: "reviews", label: "Reviews", hasContent: true },
    { id: "owner", label: "Owner Details", hasContent: true },
  ];
  const tabs = allTabs.filter((tab) => tab.hasContent);

  useEffect(() => {
    const handleScroll = () => {
      const sections = tabs
        .map((t) => document.getElementById(t.id))
        .filter(Boolean) as HTMLElement[];
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].getBoundingClientRect().top <= 120) {
          if (activeTab !== tabs[i].id) setActiveTab(tabs[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tabs, activeTab]);

  const galleryImages =
    vehicle?.photos?.galleryUrls && vehicle.photos.galleryUrls.length > 0
      ? [vehicle.photos.coverUrl, ...vehicle.photos.galleryUrls]
          .filter(Boolean)
          .map((url: string) => getImageUrl(url))
      : uniqueStayImages;

  /** Everything the payment page needs to quote and create the booking. */
  const bookingState = {
    offerId: id,
    checkInDate,
    checkOutDate,
    guests,
    serviceType: "vehicle-rental",
    service: vehicle,
    type: "vehicle",
    rentalMode,
    pickupTime,
    returnTime,
    ratePerDay: displayRate,
  };

  const makeText = [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ");

  return (
    <>
      {(loadingVehicle || loadingVendor) && <ProductDetailsSkeleton />}
      {!(loadingVehicle || loadingVendor) && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="min-h-screen font-sans flex-col flex gap-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors"
          >
            <Header callbackFun={() => {}} onNavigate={() => {}} />

            <div ref={contentRef} className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 z-10">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
              >
                <IoIosArrowBack size={16} /> Back
              </button>

              <TitleMetaHeader
                categoryBadge="Vehicle Rental"
                badgeColor="violet"
                name={vehicle?.name}
                city={vehicle?.city}
                state={vehicle?.state}
                regularPrice={displayRate}
                priceLabel="day"
                actions={
                  <ShareSaveButtons
                    isAuthenticated={isAuthenticated}
                    isFavorite={isFavorite}
                    setIsFavorite={setIsFavorite}
                    onShareClick={() => setShowShareModal(true)}
                    onLoginRequired={() => setShowLoginModal(true)}
                  />
                }
              />

              {/* Spec chips — the same four facets the search sidebar filters on,
                  so a guest arriving from a filtered list can see immediately
                  why this result matched. */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {makeText && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold">
                    <FaCarSide className="w-3.5 h-3.5" /> {makeText}
                    {vehicle?.manufactureYear ? ` · ${vehicle.manufactureYear}` : ""}
                  </span>
                )}
                {!!vehicle?.seatingCapacity && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <Users className="w-3.5 h-3.5" /> {vehicle.seatingCapacity} seats
                  </span>
                )}
                {!!vehicle?.luggageCapacity && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <Briefcase className="w-3.5 h-3.5" /> {vehicle.luggageCapacity} bags
                  </span>
                )}
                {!!vehicle?.fuelType && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <Fuel className="w-3.5 h-3.5" /> {vehicle.fuelType}
                  </span>
                )}
                {!!vehicle?.transmission && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <Settings2 className="w-3.5 h-3.5" /> {vehicle.transmission}
                  </span>
                )}
                {vehicle?.airConditioned && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <Snowflake className="w-3.5 h-3.5" /> AC
                  </span>
                )}
              </div>

              <ImageGalleryHero
                coverUrl={vehicle?.photos?.coverUrl}
                galleryUrls={vehicle?.photos?.galleryUrls}
                name={vehicle?.name}
                altFallback="Vehicle"
                totalPhotoCount={galleryImages.length}
                onPhotoClick={(i) => {
                  setPhotoIndex(i);
                  setShowPhotoGallery(true);
                }}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-1">
                <div className="lg:col-span-2 mt-3">
                  <StickyNavBar
                    tabs={tabs}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    layoutIdPrefix="vehicle-tab"
                  />

                  <div className="space-y-12">
                    <div id="overview" className="scroll-mt-36 space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        About this vehicle
                      </h3>
                      <div className="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
                        <ReadMore
                          children={description}
                          maxCharacters={400}
                          dialogTitle="Full Description"
                        />
                      </div>

                      {Array.isArray(vehicle?.pickupPoints) &&
                        vehicle.pickupPoints.length > 0 && (
                          <div className="pt-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                              Parking location
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {vehicle.pickupPoints.map((point: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300"
                                >
                                  {point}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    <AmenitiesSection
                      amenities={amenities}
                      visibleAmenities={visibleAmenities}
                      showAll={showAll}
                      onShowAll={() => setShowAll(true)}
                      heading="Features & Amenities"
                    />

                    {rentalTerms.length > 0 && (
                      <div id="terms" className="scroll-mt-36 space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Rental terms
                          {selectedMode ? ` — ${selectedMode.label}` : ""}
                        </h3>
                        <ul className="space-y-2">
                          {rentalTerms.map((term, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-[15px] text-gray-600 dark:text-gray-300"
                            >
                              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#3BD9DA] shrink-0" />
                              {term}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <InclusionsSection items={inclusions} />
                    <ExclusionsSection items={exclusions} />
                    <HouseRulesSection rules={policies} headerGap="normal" />

                    <DetailsReviewsSection visibleReviews={[]} showStatsPanel={false} />

                    <HostedByCard vendor={vendor} onContactClick={handleContactOwner} />
                  </div>
                </div>

                <BookingWidget
                  priceLabel="day"
                  rareItemNoun="vehicle"
                  regularPrice={displayRate}
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  onDateChange={(range) => {
                    setCheckInDate(range.start);
                    setCheckOutDate(range.end);
                  }}
                  guests={guests}
                  setGuests={setGuests}
                  rentalModes={rentalModes}
                  rentalMode={rentalMode}
                  onRentalModeChange={setRentalMode}
                  pickupTime={pickupTime}
                  returnTime={returnTime}
                  onPickupTimeChange={setPickupTime}
                  onReturnTimeChange={setReturnTime}
                  securityDeposit={Number(vehicle?.securityDeposit || 0)}
                  ctaLabel="Continue to booking"
                  onReserve={() => navigate("/payment", { state: bookingState })}
                />
              </div>
            </div>

            <div className="mt-10">
              <Footer />
            </div>

            <PhotoGallery
              images={galleryImages}
              initialIndex={photoIndex}
              isOpen={showPhotoGallery}
              onClose={() => setShowPhotoGallery(false)}
            />

            <HiddenPdfView
              pdfRef={pdfRef}
              stay={vehicle}
              vendor={vendor}
              allReviews={[]}
              getAmenityIcon={() => Star}
              categoryLabel="vehicle rental"
              priceLabel="day"
            />

            <LoginModal
              isOpen={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              onSuccess={() => {
                setIsFavorite(true);
                toast.success("Added to favorites!");
              }}
            />

            <ShareModal
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              title={vehicle?.name || "Vehicle Details"}
              url={window.location.href}
              contentRef={pdfRef}
              isDarkMode={isDarkMode}
            />
          </motion.div>

          <MobileBookingBar
            priceLabel="day"
            regularPrice={displayRate}
            ctaLabel="Continue to booking"
            onCtaClick={() => navigate("/payment", { state: bookingState })}
          />

          <div className="fixed bottom-0 left-0 right-0 z-50 dark:bg-black dark:text-white bg-white border-t border-gray-200 dark:border-gray-800 shadow-md">
            <MobileUserNav />
          </div>
        </>
      )}
    </>
  );
}
