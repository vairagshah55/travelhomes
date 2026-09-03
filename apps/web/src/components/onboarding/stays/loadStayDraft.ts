import { getOnboardingData } from "@/lib/api";

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

/**
 * All setters the draft-loader needs to write to. Bundled into one object so
 * the loader signature stays tidy. Each setter mirrors a useState on the page.
 */
export interface StayDraftSetters {
  setStatus: (v: string) => void;
  setRejectionReason: (v: string) => void;
  setSelectedProperties: (v: string[]) => void;
  setSelectedCategories: (v: string[]) => void;
  setStayType: (v: "entire" | "individual") => void;
  setGuestCapacity: (v: number) => void;
  setNumberOfRooms: (v: number) => void;
  setNumberOfBeds: (v: number) => void;
  setNumberOfBathrooms: (v: number) => void;
  setRegularPrice: (v: string) => void;
  setRooms: (v: Room[]) => void;
  setCoverImage: (v: string | null) => void;
  setEntireStayImages: (v: string[]) => void;
  setImages: (v: (string | null)[]) => void;
  setSelectedFeatures: (v: string[]) => void;
  setEntireStayRules: (v: string[]) => void;
  setRoomRules: (v: Record<string, string[]>) => void;
  setOptionalRules: (v: string[]) => void;
  setFirstUserDiscount: (v: boolean) => void;
  setDiscountType: (v: string) => void;
  setDiscountPercentage: (v: string) => void;
  setFinalPrice: (v: string) => void;
  setFestivalOffers: (v: boolean) => void;
  setWeeklyOffers: (v: boolean) => void;
  setSpecialOffers: (v: boolean) => void;
  setBrandName: (v: string) => void;
  setCompanyName: (v: string) => void;
  setGstNumber: (v: string) => void;
  setBusinessEmail: (v: string) => void;
  setBusinessPhone: (v: string) => void;
  setBusinessAddress: (v: string) => void;
  setLocality: (v: string) => void;
  setState: (v: string) => void;
  setStateOption2: (v: string) => void;
  setCity: (v: string) => void;
  setCityOptions2: (v: string) => void;
  setBusinessPincode: (v: string) => void;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setDateOfBirth: (v: string) => void;
  setMaritalStatus: (v: string) => void;
  setIdProof: (v: string) => void;
  setIdProofImage: (v: string) => void;
  setTermsAccepted: (v: boolean) => void;
  setCurrentStep: (v: number) => void;
  setIsStatusLoading: (v: boolean) => void;
  // A pending submission of a DIFFERENT type — set when the vendor navigates
  // straight to /onboarding/stay while e.g. a caravan listing is still awaiting
  // admin action. Lets the page block with a clear message instead of silently
  // starting a second listing (the backend rejects that submit anyway, but only
  // after the whole wizard is filled out). Mirrors loadCaravanDraft.
  setCrossTypePending: (v: { type: string; doc: any } | null) => void;
}

export interface LoadStayDraftOptions {
  setters: StayDraftSetters;
  userDetails: any;
  stepStorageKey: string;
  /** Needed to wipe a finished draft — see the `approved` branch in the loader. */
  formStorageKey: string;
  /** Sets the "already loaded" guard so background refetches don't re-apply the draft. */
  markLoaded: () => void;
}

/**
 * Personal + business fields carried over from the vendor's profile.
 *
 * Reused by both the "no draft" and "previous listing already approved" paths,
 * which need identical autofill.
 */
function autofillFromProfile(s: StayDraftSetters, userDetails: any): void {
  if (!userDetails) return;

  s.setFirstName(userDetails.firstName || "");
  s.setLastName(userDetails.lastName || "");
  if (userDetails.dateOfBirth) {
    s.setDateOfBirth(new Date(userDetails.dateOfBirth).toISOString().split("T")[0]);
  }
  s.setMaritalStatus(userDetails.maritalStatus || "");
  s.setIdProof(userDetails.idProof || "");
  if (userDetails.idPhotos && userDetails.idPhotos.length > 0) {
    s.setIdProofImage(userDetails.idPhotos[0]);
  }

  s.setBrandName(userDetails.business?.brandName || "");
  s.setCompanyName(userDetails.business?.legalCompanyName || "");
  s.setGstNumber(userDetails.business?.gstNumber || "");
  s.setBusinessEmail(userDetails.business?.email || "");
  s.setBusinessPhone(userDetails.business?.phoneNumber || "");
  s.setBusinessAddress(userDetails.business?.address || "");
  s.setLocality(userDetails.business?.locality || "India");
  s.setState(userDetails.business?.state || "");
  s.setStateOption2(userDetails.business?.state || "");
  s.setCity(userDetails.business?.city || "");
  s.setCityOptions2(userDetails.business?.city || "");
  s.setBusinessPincode(userDetails.business?.pincode || "");
}

/**
 * Reset every listing-specific field to the value StaysOnboarding's `useState`
 * defaults use.
 *
 * Needed because those states are seeded from the sessionStorage snapshot during
 * the first render — before this loader runs — so clearing storage alone leaves
 * the already-populated state on screen. Personal/business fields are excluded:
 * those are re-applied from the profile by `autofillFromProfile`.
 */
function resetListingFields(s: StayDraftSetters): void {
  s.setSelectedProperties([]);
  s.setSelectedCategories([]);
  s.setStayType("entire");
  s.setGuestCapacity(0);
  s.setNumberOfRooms(1);
  s.setNumberOfBeds(0);
  s.setNumberOfBathrooms(0);
  s.setRegularPrice("");
  s.setRooms([
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
  s.setCoverImage(null);
  s.setEntireStayImages([]);
  s.setImages(Array(5).fill(null));
  s.setSelectedFeatures([]);
  s.setEntireStayRules([""]);
  s.setRoomRules({});
  s.setOptionalRules([""]);
  s.setFirstUserDiscount(true);
  s.setDiscountType("percentage");
  s.setDiscountPercentage("");
  s.setFinalPrice("");
  s.setFestivalOffers(false);
  s.setWeeklyOffers(false);
  s.setSpecialOffers(false);
  s.setTermsAccepted(false);
}

/**
 * Fetches the user's existing stay-onboarding draft (if any) and either
 * restores it onto the form, or — when no draft exists — auto-fills personal
 * + business fields from the saved user profile.
 */
export async function loadStayDraft(opts: LoadStayDraftOptions): Promise<void> {
  const { setters: s, userDetails, stepStorageKey, formStorageKey, markLoaded } = opts;
  try {
    const data = await getOnboardingData();
    // `byType.stay` is this wizard's own latest doc. Falling back to the
    // top-level `doc` keeps this working against an older server response, but
    // that value is only the stay when no other type has a newer submission —
    // which is exactly how an approved stay stayed invisible behind a
    // more-recently-approved caravan.
    const stayDoc = data?.byType?.stay ?? (data?.type === "stay" ? data?.doc : null);

    // Another service type is already in review — stop before hydrating this
    // form. markLoaded() too, so the background userDetails refetch doesn't
    // re-run the loader and clear the block.
    if (data && data.type && data.type !== "stay" && data.doc?.status === "pending") {
      markLoaded();
      s.setCrossTypePending({ type: data.type, doc: data.doc });
      s.setIsStatusLoading(false);
      return;
    }
    s.setCrossTypePending(null);

    /**
     * The previous stay listing is already approved — start a NEW one.
     *
     * "approved" used to be in the hydration list below, so an approved listing
     * was loaded straight back into the wizard: every field pre-filled, the step
     * restored to the end, and no way to begin a fresh listing. The vendor's
     * next submit would then create a second listing that was a copy of the
     * first, because the server only reuses a doc whose status is in
     * EDITABLE_STATUSES = ["pending","draft","rejected"] (see
     * modules/onboarding/onboarding.service.js) — approved is deliberately not
     * one of them.
     *
     * loadCaravanDraft and loadActivityDraft already did this; stay was the
     * outlier.
     */
    if (stayDoc && stayDoc.status === "approved") {
      // Clearing storage matters for the NEXT mount; the current render already
      // seeded its state from that snapshot, which is why the reset below runs.
      try {
        sessionStorage.removeItem(formStorageKey);
        sessionStorage.removeItem(stepStorageKey);
      } catch {}
      markLoaded();
      resetListingFields(s);
      autofillFromProfile(s, userDetails);
      s.setStatus("");
      s.setRejectionReason("");
      s.setCurrentStep(0);
      s.setIsStatusLoading(false);
      return;
    }

    // Keyed off this wizard's own doc, not the cross-type winner — a rejected
    // stay sitting behind a newer caravan needs to open for editing.
    if (stayDoc && ["pending", "draft", "rejected"].includes(stayDoc.status)) {
      const doc = stayDoc;
      markLoaded();
      s.setIsStatusLoading(false);

      s.setStatus(doc.status);
      s.setRejectionReason(doc.rejectionReason || "");

      s.setSelectedProperties(doc.selectedProperties || []);
      s.setSelectedCategories(doc.selectedCategories || []);
      s.setStayType(doc.stayType || "entire");
      s.setGuestCapacity(Number(doc.guestCapacity) || 0);
      s.setNumberOfRooms(Number(doc.numberOfRooms) || 1);
      s.setNumberOfBeds(Number(doc.numberOfBeds) || 0);
      s.setNumberOfBathrooms(Number(doc.numberOfBathrooms) || 0);
      s.setRegularPrice(String(doc.regularPrice || ""));

      if (doc.rooms && doc.rooms.length > 0) {
        // Normalise legacy `capacity`/`bedCount` field names to canonical
        // frontend names so counters always see real numbers.
        const normalizedRooms: Room[] = doc.rooms.map((r: any) => ({
          id: r.id || String(Date.now() + Math.random()),
          name: r.name || "",
          description: r.description || "",
          guestCapacity: Number(r.guestCapacity || r.capacity || 1),
          beds: Number(r.beds || r.bedCount || 1),
          bathrooms: Number(r.bathrooms || 1),
          price: Number(r.price || 0),
          photos: r.photos || [],
        }));
        s.setRooms(normalizedRooms);
        s.setCoverImage(doc.coverImage || null);
        if (doc.stayType === "entire") {
          s.setEntireStayImages(doc.images || []);
        } else {
          const imgs = doc.rooms[0]?.photos || [];
          s.setImages([...imgs, ...Array(Math.max(0, 5 - imgs.length)).fill(null)]);
        }
      }

      s.setSelectedFeatures(doc.selectedFeatures || []);
      s.setEntireStayRules(doc.rules && doc.rules.length > 0 ? doc.rules : [""]);
      s.setRoomRules(doc.roomRules || {});
      s.setOptionalRules(
        doc.optionalRules && doc.optionalRules.length > 0 ? doc.optionalRules : [""],
      );

      s.setFirstUserDiscount(doc.firstUserDiscount ?? true);
      s.setDiscountType(doc.discountType || "percentage");
      s.setDiscountPercentage(String(doc.discountPercentage || ""));
      s.setFinalPrice(String(doc.finalPrice || ""));

      s.setFestivalOffers(doc.festivalOffers ?? false);
      s.setWeeklyOffers(doc.weeklyOffers ?? false);
      s.setSpecialOffers(doc.specialOffers ?? false);

      // Business + personal aren't on the StayOnboarding doc (Mongoose strict
      // mode drops unknown keys). Fall back to userDetails so resumed drafts
      // aren't empty.
      s.setBrandName(doc.brandName || userDetails?.business?.brandName || "");
      s.setCompanyName(doc.companyName || userDetails?.business?.legalCompanyName || "");
      s.setGstNumber(doc.gstNumber || userDetails?.business?.gstNumber || "");
      s.setBusinessEmail(doc.businessEmail || userDetails?.business?.email || "");
      s.setBusinessPhone(doc.businessPhone || userDetails?.business?.phoneNumber || "");
      s.setBusinessAddress(doc.businessAddress || userDetails?.business?.address || "");
      s.setLocality(doc.locality || userDetails?.business?.locality || "India");
      s.setState(doc.state || userDetails?.business?.state || "");
      s.setStateOption2(doc.state || userDetails?.business?.state || "");
      s.setCity(doc.city || userDetails?.business?.city || "");
      s.setCityOptions2(doc.city || userDetails?.business?.city || "");
      s.setBusinessPincode(
        doc.businessPincode || doc.pincode || userDetails?.business?.pincode || "",
      );

      s.setFirstName(doc.firstName || userDetails?.firstName || "");
      s.setLastName(doc.lastName || userDetails?.lastName || "");
      s.setDateOfBirth(
        doc.dateOfBirth ||
          (userDetails?.dateOfBirth
            ? new Date(userDetails.dateOfBirth).toISOString().split("T")[0]
            : ""),
      );
      s.setMaritalStatus(doc.maritalStatus || userDetails?.maritalStatus || "");
      s.setIdProof(doc.idProof || userDetails?.idProof || "");

      const draftIdPhoto = doc.idPhotos?.[0] || userDetails?.idPhotos?.[0];
      if (draftIdPhoto) s.setIdProofImage(draftIdPhoto);

      s.setTermsAccepted(false);

      // Restore step: sessionStorage takes priority, otherwise compute from data
      const savedStep = sessionStorage.getItem(stepStorageKey);
      if (savedStep && parseInt(savedStep, 10) > 0) {
        s.setCurrentStep(parseInt(savedStep, 10));
      } else {
        let restoredStep = 0;
        if (doc.selectedProperties?.length > 0) restoredStep = 1;
        if (doc.selectedCategories?.length > 0) restoredStep = 2;
        if (
          doc.stayType === "entire"
            ? doc.guestCapacity > 0 && doc.regularPrice
            : doc.rooms && doc.rooms.length > 0 && doc.rooms[0]?.name
        )
          restoredStep = 3;
        if (doc.selectedFeatures?.length > 0) restoredStep = 4;
        if (doc.brandName) restoredStep = Math.max(restoredStep, 5);
        if (doc.firstName) restoredStep = Math.max(restoredStep, 6);
        s.setCurrentStep(restoredStep);
      }
      return;
    }

    // No draft. Reveal the form now even if the profile hasn't arrived (or
    // doesn't exist): every early return above clears this flag, but falling
    // through with a falsy `userDetails` used to leave it true forever, so a
    // brand-new vendor with no Profile row sat on the loading spinner and could
    // never start a stay listing. loadCaravanDraft always clears it, which is
    // why caravan never showed this.
    //
    // markLoaded() stays inside the branch on purpose: marking loaded here
    // would latch the guard before the autofill ran, so the profile arriving a
    // moment later would never be applied.
    s.setIsStatusLoading(false);

    if (userDetails) {
      // No draft found — auto-fill from saved profile.
      markLoaded();
      autofillFromProfile(s, userDetails);
    }
  } catch {
    markLoaded();
    s.setIsStatusLoading(false);
  }
}
