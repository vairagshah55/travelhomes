import { getOnboardingData } from "@/lib/api";
import { defaultVehicleFormData, type FormData } from "./vehicleConfig";

export interface LoadVehicleDraftOptions {
  setFormData: (updater: (prev: FormData) => FormData) => void;
  setCurrentStep: (n: number) => void;
  setIdProofImage: (v: string) => void;
  setStatus: (v: string) => void;
  setRejectionReason: (v: string) => void;
  setIsStatusLoading: (v: boolean) => void;
  // A pending submission of a DIFFERENT type — set when the vendor navigates
  // straight to /onboarding/vehicle while e.g. a stay listing is still awaiting
  // admin action. Lets the page block with a clear message instead of silently
  // starting a second listing (the backend rejects that submit anyway, but only
  // after the whole wizard is filled out).
  setCrossTypePending: (v: { type: string; doc: any } | null) => void;
  userDetails: any;
  /** sessionStorage key for the persisted form snapshot. */
  formStorageKey: string;
  /** sessionStorage key for the persisted step index. */
  stepStorageKey: string;
}

function autofillFromUserDetails(userDetails: any): Partial<FormData> {
  if (!userDetails) return {};
  return {
    firstName: userDetails.firstName || "",
    lastName: userDetails.lastName || "",
    // No personal address: this flow stopped asking for one.
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
  };
}

/** Dates arrive as ISO strings; the `<input type="date">` needs YYYY-MM-DD. */
const toDateInput = (value: any) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
};

const asArray = (value: any) => (Array.isArray(value) ? value : value ? [value] : []);

/**
 * Fetches the user's vehicle-onboarding draft (if any) and either restores it
 * onto the form, or — when no active draft exists — auto-fills personal +
 * business fields from the saved profile so already-approved vendors can submit
 * another listing without re-entering their profile.
 *
 * Approved-resubmit handling matches the caravan loader: when the latest vehicle
 * doc is already approved, the persisted form in sessionStorage would pre-fill
 * the next listing with the previous submission's data, so it's wiped and
 * formData hard-resets to defaults (keeping personal/business autofill).
 */
export async function loadVehicleDraft(opts: LoadVehicleDraftOptions): Promise<void> {
  const {
    setFormData,
    setCurrentStep,
    setIdProofImage,
    setStatus,
    setRejectionReason,
    setIsStatusLoading,
    setCrossTypePending,
    userDetails,
    formStorageKey,
    stepStorageKey,
  } = opts;
  try {
    const data = await getOnboardingData();
    const vehicleDoc = data?.type === "vehicle" ? data?.doc : null;

    if (data && data.type && data.type !== "vehicle" && data.doc?.status === "pending") {
      setCrossTypePending({ type: data.type, doc: data.doc });
      setIsStatusLoading(false);
      return;
    }
    setCrossTypePending(null);

    if (vehicleDoc && vehicleDoc.status === "approved") {
      try {
        sessionStorage.removeItem(formStorageKey);
        sessionStorage.removeItem(stepStorageKey);
      } catch {}
      setCurrentStep(0);
      setFormData(() => ({
        ...defaultVehicleFormData,
        ...autofillFromUserDetails(userDetails),
      }));
      if (userDetails?.idPhotos?.length) {
        setIdProofImage(userDetails.idPhotos[0]);
      }
      setStatus("");
      setRejectionReason("");
      setIsStatusLoading(false);
      return;
    }

    if (
      data &&
      data.type === "vehicle" &&
      data.doc &&
      ["pending", "draft", "rejected"].includes(data.doc.status)
    ) {
      const doc = data.doc;

      setFormData((prev) => ({
        ...prev,
        name: doc.name || "",
        description: doc.description || "",
        rules: doc.rules || [],
        photos: asArray(doc.photos),
        coverImage: asArray(doc.coverImage),

        vehicleClass: doc.vehicleClass || null,
        category: doc.category || null,
        brand: doc.brand || "",
        model: doc.model || "",
        manufactureYear: doc.manufactureYear ? String(doc.manufactureYear) : "",
        registrationNumber: doc.registrationNumber || "",

        fuelType: doc.fuelType || "",
        transmission: doc.transmission || "",
        airConditioned: doc.airConditioned ?? false,
        features: doc.features || [],

        seatingCapacity: doc.seatingCapacity || 4,
        luggageCapacity: doc.luggageCapacity || 0,
        address: doc.address || "",
        locality: doc.locality || "India",
        state: doc.state || "",
        city: doc.city || "",
        pincode: doc.pincode || "",
        pickupPoints: doc.pickupPoints || [],

        selfDriveEnabled: doc.selfDriveEnabled ?? false,
        selfDrivePerDay: String(doc.selfDrivePerDay || ""),
        selfDrivePerKm: String(doc.selfDrivePerKm || ""),
        freeKmPerDay: String(doc.freeKmPerDay || ""),
        extraKmCharge: String(doc.extraKmCharge || ""),
        securityDeposit: String(doc.securityDeposit || ""),
        minRentalHours: String(doc.minRentalHours || "24"),
        selfDriveIncludes: doc.selfDriveIncludes || [],
        selfDriveExcludes: doc.selfDriveExcludes || [],

        withDriverEnabled: doc.withDriverEnabled ?? false,
        withDriverPerDay: String(doc.withDriverPerDay || ""),
        withDriverPerKm: String(doc.withDriverPerKm || ""),
        driverAllowancePerDay: String(doc.driverAllowancePerDay || ""),
        nightChargeAfter: String(doc.nightChargeAfter ?? "22"),
        outstationPerKm: String(doc.outstationPerKm || ""),
        withDriverIncludes: doc.withDriverIncludes || [],
        withDriverExcludes: doc.withDriverExcludes || [],

        fuelPolicy: doc.fuelPolicy || "excluded",
        tollsAndParking: doc.tollsAndParking || "on-actuals",
        cancellationWindowHours: String(doc.cancellationWindowHours || "24"),

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

        rcPhotos: asArray(doc.rcPhotos),
        insuranceExpiry: toDateInput(doc.insuranceExpiry),
        pucExpiry: toDateInput(doc.pucExpiry),

        driverName: doc.driverName || "",
        driverPhone: doc.driverPhone || "",
        driverLicenceNumber: doc.driverLicenceNumber || "",
        driverLicencePhotos: asArray(doc.driverLicencePhotos),

        // Personal + business fields are NOT persisted on the vehicle doc —
        // Mongoose strict mode drops them. They live on Profile via
        // syncUserProfile. Fall back to userDetails so resumed drafts aren't
        // empty.
        brandName: doc.brandName || userDetails?.business?.brandName || "",
        legalCompanyName: doc.legalCompanyName || userDetails?.business?.legalCompanyName || "",
        gstNumber: doc.gstNumber || userDetails?.business?.gstNumber || "",
        businessEmailId: doc.businessEmailId || userDetails?.business?.email || "",
        businessPhoneNumber: doc.businessPhoneNumber || userDetails?.business?.phoneNumber || "",
        businessAddress: doc.businessAddress || userDetails?.business?.address || "",
        businessLocality: doc.businessLocality || userDetails?.business?.locality || "India",
        businessState: doc.businessState || userDetails?.business?.state || "",
        businessCity: doc.businessCity || userDetails?.business?.city || "",
        businessPincode: doc.businessPincode || userDetails?.business?.pincode || "",

        firstName: doc.firstName || userDetails?.firstName || "",
        lastName: doc.lastName || userDetails?.lastName || "",
        dateOfBirth: doc.dateOfBirth || toDateInput(userDetails?.dateOfBirth),
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

    if (userDetails) {
      setFormData((prev) => ({ ...prev, ...autofillFromUserDetails(userDetails) }));
      if (userDetails.idPhotos?.length) {
        setIdProofImage(userDetails.idPhotos[0]);
      }
    }
    setIsStatusLoading(false);
  } catch {
    setIsStatusLoading(false);
  }
}
