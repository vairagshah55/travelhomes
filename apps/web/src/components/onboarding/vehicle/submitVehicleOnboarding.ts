import { toast } from "sonner";
import { submitOnboardingData } from "@/lib/api";
import { onboardingService } from "@/lib/onboardingService";
import { compressImageToDataUrl } from "@/lib/imageCompression";
import type { FormData } from "./vehicleConfig";
import {
  deriveVehicleName,
  deriveVehicleDescription,
  deriveVehicleLocation,
} from "./vehicleConfig";

export interface SubmitVehicleCallbacks {
  setIsLoading: (v: boolean) => void;
  updateUserDetails: (data: any) => Promise<unknown>;
  updateUserType: (t: "user" | "vendor") => unknown;
  navigate: (to: string) => void;
  formStorageKey: string;
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const num = (value: string | number | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const cleanList = (items: string[] | undefined) =>
  (items || []).map((i) => i.trim()).filter(Boolean);

/**
 * Validates vehicle form data, converts File uploads to data URLs, posts the
 * onboarding payload, then mirrors business/personal details onto the user
 * account. On success: persists the onboarding id and navigates to
 * selfie-verification, matching the caravan and stay flows.
 */
export async function submitVehicleOnboarding(
  formData: FormData,
  cb: SubmitVehicleCallbacks,
): Promise<void> {
  try {
    cb.setIsLoading(true);

    // No name guard: the field is gone from the wizard and the name is derived
    // from brand + model below. The brand/model guard that replaces it is the
    // vehicleClass/category pair already checked here plus step 1's validation.
    if (!formData.vehicleClass) throw new Error("Please select car, van or bus");
    if (!formData.category) throw new Error("Please select a vehicle sub-category");
    if (formData.selfDriveEnabled && formData.withDriverEnabled) {
      throw new Error("Pick one rental mode — self-drive or with driver, not both");
    }
    if (!formData.selfDriveEnabled && !formData.withDriverEnabled) {
      throw new Error("Choose a rental mode — self-drive or with driver");
    }

    const selfDrivePerDay = num(formData.selfDrivePerDay);
    const withDriverPerKm = num(formData.withDriverPerKm);
    if (formData.selfDriveEnabled && selfDrivePerDay <= 0) {
      throw new Error("A per-day rate is required for self-drive");
    }
    // Chauffeur work is priced per kilometre; the per-day rate was removed.
    if (formData.withDriverEnabled && withDriverPerKm <= 0) {
      throw new Error("A per-km rate is required for chauffeur-driven");
    }
    if (formData.withDriverEnabled && !formData.withDriverOneWay && !formData.withDriverTwoWay) {
      throw new Error("Choose one-way, two-way, or both for chauffeur trips");
    }

    // Gallery/cover photos are downscaled + re-encoded before base64 — there's
    // no client-side size cap on these, so uncompressed phone-camera photos
    // routinely exceed the server's onboarding payload limit. Document scans
    // (ID, RC, licence) stay untouched: legibility matters more than payload
    // size for anything a human has to read and verify.
    const compressAll = (items: (string | File)[] | undefined) =>
      Promise.all(
        ((items as any[]) || []).map((f: any) =>
          typeof f === "string" ? Promise.resolve(f) : compressImageToDataUrl(f),
        ),
      );
    const rawAll = (items: (string | File)[] | undefined) =>
      Promise.all(
        ((items as any[]) || []).map((f: any) =>
          typeof f === "string" ? Promise.resolve(f) : fileToDataUrl(f),
        ),
      );

    const [photosData, coverData, idPhotosData, rcPhotosData, licencePhotosData] =
      await Promise.all([
        compressAll(formData.photos),
        compressAll(formData.coverImage),
        rawAll(formData.idPhotos),
        rawAll(formData.rcPhotos),
        rawAll(formData.driverLicencePhotos),
      ]);

    const payload = {
      ...formData,

      // Numbers the Mongoose schema declares as Number — sending the raw
      // strings the form holds would store them as casts-on-write and break
      // any `$gte` range query the search page runs against them.
      seatingCapacity: num(formData.seatingCapacity),
      luggageCapacity: num(formData.luggageCapacity),
      manufactureYear: num(formData.manufactureYear),

      selfDrivePerDay,
      selfDrivePerKm: num(formData.selfDrivePerKm),
      freeKmPerDay: num(formData.freeKmPerDay),
      extraKmCharge: num(formData.extraKmCharge),
      minRentalHours: num(formData.minRentalHours),

      withDriverPerKm,
      driverAllowancePerDay: num(formData.driverAllowancePerDay),
      cancellationWindowHours: num(formData.cancellationWindowHours),

      registrationNumber: formData.registrationNumber.trim().toUpperCase(),
      pickupPoints: cleanList(formData.pickupPoints),
      selfDriveIncludes: cleanList(formData.selfDriveIncludes),
      selfDriveExcludes: cleanList(formData.selfDriveExcludes),
      withDriverIncludes: cleanList(formData.withDriverIncludes),
      withDriverExcludes: cleanList(formData.withDriverExcludes),
      /**
       * Identity, derived rather than typed — the Vehicle Name, Description and
       * Rules inputs were removed from step 0.
       *
       * These three still have to be sent. `VehicleOnboarding.name` and
       * `Offer.name`/`Offer.description` are `required` in Mongoose, so an
       * omitted name fails at Model.create and an omitted description gets the
       * server's "Auto-created from vehicle rental onboarding" fallback, which
       * is published to guests. Spreading `...formData` above would carry stale
       * values from a draft saved before the fields were removed, so these
       * override rather than rely on it.
       */
      name: deriveVehicleName(formData),
      description: deriveVehicleDescription(formData),
      rules: [],

      // Address/city/state/pincode, from the business address — the Pickup
      // location card is gone from the capacity step. Spread last-wins over
      // `...formData` so a draft saved while that card still existed does not
      // resurrect a stale address.
      ...deriveVehicleLocation(formData),

      // Driver fields belong to the chauffeur mode. A vendor who filled them in
      // and then turned that mode off would otherwise ship a driver on a
      // self-drive-only listing, and the details page would show it to guests.
      driverName: formData.withDriverEnabled ? formData.driverName : "",
      driverPhone: formData.withDriverEnabled ? formData.driverPhone : "",
      driverLicenceNumber: formData.withDriverEnabled ? formData.driverLicenceNumber : "",
      driverLicencePhotos: formData.withDriverEnabled ? licencePhotosData : [],

      finalPrice: 0,
      photos: photosData,
      coverImage: coverData,
      idPhotos: idPhotosData,
      rcPhotos: rcPhotosData,
    };

    const result = await submitOnboardingData("vehicle", payload);
    if (!result?.id) {
      toast.error("Could not save onboarding. Please try again.");
      return;
    }

    await cb.updateUserDetails({
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
        address: formData.businessAddress,
        locality: formData.businessLocality,
        state: formData.businessState,
        city: formData.businessCity,
        pincode: formData.businessPincode,
      },
    });

    onboardingService.setVehicleId(result.id);
    sessionStorage.setItem("onboardingId", result.id);
    sessionStorage.setItem("onboardingType", "vehicle");
    sessionStorage.setItem("id", result.id);
    sessionStorage.removeItem("vehicle_onboarding_step");
    sessionStorage.removeItem(cb.formStorageKey);
    cb.updateUserType("vendor");
    toast.success("Vehicle rental onboarding saved successfully!");
    cb.navigate("/onboarding/selfie-verification");
  } catch (e: any) {
    toast.error(e?.message || "Failed to save vehicle onboarding");
  } finally {
    cb.setIsLoading(false);
  }
}
