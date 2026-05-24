import { getOnboardingData } from "@/lib/api";
import type { FormData } from "./caravanConfig";

export interface LoadCaravanDraftOptions {
  setFormData: (updater: (prev: FormData) => FormData) => void;
  setIdProofImage: (v: string) => void;
  setStatus: (v: string) => void;
  setRejectionReason: (v: string) => void;
  setIsStatusLoading: (v: boolean) => void;
  userDetails: any;
  /** True when the current user is already a vendor — used to gate auto-fill. */
  isExistingVendor: boolean;
}

/**
 * Fetches the user's caravan-onboarding draft (if any) and either restores
 * it onto the form, or — when no draft exists and the user isn't already a
 * vendor — auto-fills personal + business fields from the saved profile.
 */
export async function loadCaravanDraft(opts: LoadCaravanDraftOptions): Promise<void> {
  const {
    setFormData,
    setIdProofImage,
    setStatus,
    setRejectionReason,
    setIsStatusLoading,
    userDetails,
    isExistingVendor,
  } = opts;
  try {
    const data = await getOnboardingData();

    if (
      data &&
      data.type === "caravan" &&
      data.doc &&
      ["pending", "draft", "rejected", "approved"].includes(data.doc.status)
    ) {
      const doc = data.doc;

      setFormData((prev) => ({
        ...prev,
        name: doc.name || "",
        description: doc.description || "",
        rules: doc.rules || [],
        photos: Array.isArray(doc.photos) ? doc.photos : [],
        coverImage: Array.isArray(doc.coverImage)
          ? doc.coverImage
          : typeof doc.coverImage === "string"
            ? [doc.coverImage]
            : [],
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

        // Personal + business fields are NOT persisted on the caravan doc —
        // Mongoose strict mode drops them. They live on Profile via
        // syncUserProfile. Fall back to userDetails so resumed drafts aren't
        // empty.
        brandName: doc.brandName || userDetails?.business?.brandName || "",
        legalCompanyName:
          doc.legalCompanyName || userDetails?.business?.legalCompanyName || "",
        gstNumber: doc.gstNumber || userDetails?.business?.gstNumber || "",
        businessEmailId: doc.businessEmailId || userDetails?.business?.email || "",
        businessPhoneNumber:
          doc.businessPhoneNumber || userDetails?.business?.phoneNumber || "",
        businessAddress: doc.businessAddress || userDetails?.business?.address || "",
        businessLocality:
          doc.businessLocality || userDetails?.business?.locality || "India",
        personalLocality: doc.personalLocality || userDetails?.personalLocality || "India",
        businessState: doc.businessState || userDetails?.business?.state || "",
        businessCity: doc.businessCity || userDetails?.business?.city || "",
        businessPincode: doc.businessPincode || userDetails?.business?.pincode || "",

        firstName: doc.firstName || userDetails?.firstName || "",
        lastName: doc.lastName || userDetails?.lastName || "",
        personalState: doc.personalState || userDetails?.state || "",
        personalCity: doc.personalCity || userDetails?.city || "",
        personalPincode: doc.personalPincode || userDetails?.personalPincode || "",
        dateOfBirth:
          doc.dateOfBirth ||
          (userDetails?.dateOfBirth
            ? new Date(userDetails.dateOfBirth).toISOString().split("T")[0]
            : ""),
        maritalStatus: doc.maritalStatus || userDetails?.maritalStatus || "",
        idProof: doc.idProof || userDetails?.idProof || "",
        idPhotos:
          Array.isArray(doc.idPhotos) && doc.idPhotos.length > 0
            ? doc.idPhotos
            : userDetails?.idPhotos || [],

        termsAccepted: false,
      }));

      const draftIdPhoto = doc.idPhotos?.[0] || userDetails?.idPhotos?.[0];
      if (draftIdPhoto) setIdProofImage(draftIdPhoto);
      setStatus(doc.status || "draft");
      setRejectionReason(doc.rejectionReason || "");
      setIsStatusLoading(false);
      return;
    }

    if (userDetails && !isExistingVendor) {
      setFormData((prev) => ({
        ...prev,
        firstName: userDetails.firstName || "",
        lastName: userDetails.lastName || "",
        personalState: userDetails.state || "",
        personalCity: userDetails.city || "",
        personalPincode: userDetails.personalPincode || "",
        personalLocality: userDetails.personalLocality || "India",
        dateOfBirth: userDetails.dateOfBirth
          ? new Date(userDetails.dateOfBirth).toISOString().split("T")[0]
          : "",
        maritalStatus: userDetails.maritalStatus || "",
        idProof: userDetails.idProof || "",
        idPhotos: userDetails.idPhotos || [],

        brandName: userDetails.business?.brandName || "",
        legalCompanyName: userDetails.business?.legalCompanyName || "",
        gstNumber: userDetails.business?.gstNumber || "",
        businessEmailId: userDetails.business?.email || "",
        businessPhoneNumber: userDetails.business?.phoneNumber || "",
        businessAddress: userDetails.business?.address || "",
        businessLocality: userDetails.business?.locality || "India",
        businessState: userDetails.business?.state || "",
        businessCity: userDetails.business?.city || "",
        businessPincode: userDetails.business?.pincode || "",
      }));
      if (userDetails.idPhotos && userDetails.idPhotos.length > 0) {
        setIdProofImage(userDetails.idPhotos[0]);
      }
    }
    setIsStatusLoading(false);
  } catch {
    setIsStatusLoading(false);
  }
}
