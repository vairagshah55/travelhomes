import { toast } from "sonner";
import { submitOnboardingData } from "@/lib/api";
import { onboardingService } from "@/lib/onboardingService";

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

export interface SubmitStayInput {
  // Selections
  selectedProperties: string[];
  selectedCategories: string[];
  stayType: "entire" | "individual";
  coverImage: string | null;

  // Capacity / pricing
  guestCapacity: number;
  numberOfRooms: number;
  numberOfBeds: number;
  numberOfBathrooms: number;
  regularPrice: string | number;
  rooms: Room[];

  // Features & rules
  selectedFeatures: string[];
  entireStayRules: string[];
  roomRules: Record<string, string[]>;
  optionalRules: string[];

  // Discounts
  firstUserDiscount: boolean;
  discountType: string;
  discountPercentage: string | number;
  finalPrice: string | number;
  festivalOffers: boolean;
  weeklyOffers: boolean;
  specialOffers: boolean;

  // Business
  brandName: string;
  companyName: string;
  gstNumber: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  locality: string;
  state: string;
  city: string;
  businessPincode: string;

  // Personal
  personalPincode: string;
  firstName: string;
  lastName: string;
  personalCountry: string;
  personalState: string;
  personalCity: string;
  dateOfBirth: string;
  maritalStatus: string;
  idProof: string;
  idProofImage: string | null;

  images: (string | null)[];
  entireStayImages: string[];
}

export interface SubmitStayCallbacks {
  setIsLoading: (v: boolean) => void;
  updateUserDetails: (data: any) => Promise<unknown>;
  updateUserType: (t: "user" | "vendor") => unknown;
  navigate: (to: string) => void;
  stepStorageKey: string;
  formStorageKey: string;
}

/**
 * Builds the stay-onboarding payload, validates required fields, submits to
 * the API, then mirrors the personal/business details onto the user account.
 * On success: persists the new offer id, clears the draft snapshot, and
 * navigates to selfie-verification.
 */
export async function submitStayOnboarding(
  input: SubmitStayInput,
  cb: SubmitStayCallbacks,
): Promise<void> {
  const {
    selectedProperties,
    selectedCategories,
    stayType,
    coverImage,
    guestCapacity,
    numberOfRooms,
    numberOfBeds,
    numberOfBathrooms,
    regularPrice,
    rooms,
    selectedFeatures,
    entireStayRules,
    roomRules,
    optionalRules,
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
    entireStayImages,
  } = input;

  try {
    cb.setIsLoading(true);

    const entireStayGallery: string[] = entireStayImages || [];
    const roomsWithPhotos: Room[] = [...rooms];
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
    // top-level values so downstream always gets numbers > 0.
    const effectiveRegularPrice =
      stayType === "individual" ? roomsWithPhotos[0]?.price || 0 : Number(regularPrice);

    // Accept the legacy `capacity` field name from older RoomSchema docs.
    const roomCapacitySum =
      stayType === "individual"
        ? roomsWithPhotos.reduce(
            (sum, r) => sum + (Number(r.guestCapacity) || Number((r as any).capacity) || 0),
            0,
          )
        : 0;
    const effectiveGuestCapacity =
      stayType === "individual"
        ? roomCapacitySum > 0
          ? roomCapacitySum
          : Number(guestCapacity) || 0
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
      // `rules` and `images`, not `entireStayRules`/`entireStayImages`: those are
      // the StayOnboarding schema's field names, and Mongoose strict mode
      // silently DROPS anything else. Sending the wizard's own state names meant
      // house rules were never stored, and the gallery only survived as
      // rooms[0].photos (which is where the Offer takes its photos from) — so
      // loadStayDraft, which reads doc.rules and doc.images, restored an empty
      // rule list and a 0/5 gallery every time a vendor reopened a submission.
      rules: entireStayRules.filter((rule) => rule.trim() !== ""),
      // Individual-room listings keep their photos per room; only the
      // entire-stay gallery has a top-level home.
      images: stayType === "entire" ? entireStayGallery : [],
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
    if (!result?.id) {
      toast.error("Could not save onboarding. Please try again.");
      return;
    }

    await cb.updateUserDetails({
      firstName,
      lastName,
      phoneNumber: businessPhone,
      country: personalCountry,
      state: personalState,
      city: personalCity,
      personalLocality: personalCountry,
      personalPincode,
      dateOfBirth,
      maritalStatus,
      idProof,
      idPhotos: idProofImage ? [idProofImage] : [],
      business: {
        brandName,
        legalCompanyName: companyName,
        gstNumber,
        email: businessEmail,
        phoneNumber: businessPhone,
        address: businessAddress,
        locality,
        state,
        city,
        pincode: businessPincode,
      },
    });

    onboardingService.setStayId(result.id);
    sessionStorage.setItem("onboardingId", result.id);
    sessionStorage.setItem("onboardingType", "stay");
    sessionStorage.setItem("id", result.id);
    sessionStorage.removeItem(cb.stepStorageKey);
    sessionStorage.removeItem(cb.formStorageKey);
    cb.updateUserType("vendor");
    toast.success("Stay onboarding saved successfully!");
    cb.navigate("/onboarding/selfie-verification");
  } catch (e: any) {
    toast.error(e?.message || "Failed to save");
  } finally {
    cb.setIsLoading(false);
  }
}
