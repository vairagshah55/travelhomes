import React from "react";
import type { DiscountOffer } from "@/components/onboarding/shared";

interface UseStayFieldHandlersInput {
  // Discounts (Step 4)
  firstUserDiscount: boolean;
  setFirstUserDiscount: React.Dispatch<React.SetStateAction<boolean>>;
  festivalOffers: boolean;
  setFestivalOffers: React.Dispatch<React.SetStateAction<boolean>>;
  weeklyOffers: boolean;
  setWeeklyOffers: React.Dispatch<React.SetStateAction<boolean>>;
  specialOffers: boolean;
  setSpecialOffers: React.Dispatch<React.SetStateAction<boolean>>;
  setDiscountType: React.Dispatch<React.SetStateAction<string>>;
  setDiscountPercentage: React.Dispatch<React.SetStateAction<string>>;
  setFinalPrice: React.Dispatch<React.SetStateAction<string>>;

  // Categories (Step 1)
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;

  // Business fields (Step 5)
  setBrandName: (v: string) => void;
  setCompanyName: (v: string) => void;
  setGstNumber: (v: string) => void;
  setBusinessEmail: (v: string) => void;
  setBusinessPhone: (v: string) => void;
  setBusinessAddress: (v: string) => void;
  setBusinessPincode: (v: string) => void;
  setStateOption2: (v: string) => void;
  setCityOptions2: (v: string) => void;

  // Personal fields (Step 6)
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setPersonalPincode: (v: string) => void;
  setDateOfBirth: (v: string) => void;
  setMaritalStatus: (v: string) => void;
  setIdProof: (v: string) => void;
  setStateOption: (v: string) => void;
  setCityOptions: (v: string) => void;

  clearError: (field: string) => void;
}

/**
 * Bundles the field-level onChange handlers for the Stay onboarding flow:
 * discount toggles / offer changes, business + personal text fields, and
 * the location state/city sync handlers. All clear inline errors on input.
 */
export function useStayFieldHandlers(input: UseStayFieldHandlersInput) {
  const {
    firstUserDiscount,
    setFirstUserDiscount,
    festivalOffers,
    setFestivalOffers,
    weeklyOffers,
    setWeeklyOffers,
    specialOffers,
    setSpecialOffers,
    setDiscountType,
    setDiscountPercentage,
    setFinalPrice,
    setSelectedCategories,
    setBrandName,
    setCompanyName,
    setGstNumber,
    setBusinessEmail,
    setBusinessPhone,
    setBusinessAddress,
    setBusinessPincode,
    setStateOption2,
    setCityOptions2,
    setFirstName,
    setLastName,
    setPersonalPincode,
    setDateOfBirth,
    setMaritalStatus,
    setIdProof,
    setStateOption,
    setCityOptions,
    clearError,
  } = input;

  const handleDiscountToggle = (key: "firstUser" | "festival" | "weekly" | "special") => {
    if (key === "firstUser") setFirstUserDiscount(!firstUserDiscount);
    else if (key === "festival") setFestivalOffers(!festivalOffers);
    else if (key === "weekly") setWeeklyOffers(!weeklyOffers);
    else if (key === "special") setSpecialOffers(!specialOffers);
  };

  // All 4 offers share the same discountType/percentage/finalPrice, so the
  // `_key` arg is intentionally ignored — only the field matters.
  const handleDiscountOfferChange = (
    _key: "firstUser" | "festival" | "weekly" | "special",
    field: keyof DiscountOffer,
    value: string,
  ) => {
    if (field === "type") {
      setDiscountType(value);
    } else if (field === "value") {
      setDiscountPercentage(value);
      clearError("discountPercentage");
    } else if (field === "finalPrice") {
      setFinalPrice(value);
      clearError("finalPrice");
    }
  };

  const handleBusinessChange = (field: string, value: string) => {
    const map: Record<string, [(v: string) => void, string?]> = {
      brandName: [setBrandName, "brandName"],
      companyName: [setCompanyName, "companyName"],
      gstNumber: [setGstNumber],
      businessEmail: [setBusinessEmail, "businessEmail"],
      businessPhone: [setBusinessPhone, "businessPhone"],
      businessAddress: [setBusinessAddress, "businessAddress"],
      pincode: [setBusinessPincode, "businessPincode"],
    };
    const entry = map[field];
    if (!entry) return;
    entry[0](value);
    if (entry[1]) clearError(entry[1]);
  };

  const handleBusinessStateChange = (val: string) => {
    setStateOption2(val);
    setCityOptions2("");
    clearError("state");
  };

  const handleBusinessCityChange = (val: string) => {
    setCityOptions2(val);
    clearError("city");
  };

  const handlePersonalChange = (field: string, value: string) => {
    const map: Record<string, [(v: string) => void, string]> = {
      firstName: [setFirstName, "firstName"],
      lastName: [setLastName, "lastName"],
      pincode: [setPersonalPincode, "personalPincode"],
      dateOfBirth: [setDateOfBirth, "dateOfBirth"],
      maritalStatus: [setMaritalStatus, "maritalStatus"],
      idProof: [setIdProof, "idProof"],
    };
    const entry = map[field];
    if (!entry) return;
    entry[0](value);
    clearError(entry[1]);
  };

  const handlePersonalStateChange = (val: string) => {
    setStateOption(val);
    setCityOptions("");
    clearError("personalState");
  };

  const handlePersonalCityChange = (val: string) => {
    setCityOptions(val);
    clearError("personalCity");
  };

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryKey) ? prev.filter((id) => id !== categoryKey) : [...prev, categoryKey],
    );
  };

  return {
    handleDiscountToggle,
    handleDiscountOfferChange,
    handleBusinessChange,
    handleBusinessStateChange,
    handleBusinessCityChange,
    handlePersonalChange,
    handlePersonalStateChange,
    handlePersonalCityChange,
    handleCategoryToggle,
  };
}
