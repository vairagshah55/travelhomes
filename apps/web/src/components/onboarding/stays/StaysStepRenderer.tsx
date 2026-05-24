import React from "react";
import {
  BusinessDetailsStep,
  PersonalDetailsStep,
  TermsConditionsStep,
  DiscountOffersStep,
} from "@/components/onboarding/shared";
import type { CountryOption } from "@/components/onboarding/shared";
import {
  PropertyTypeStep,
  CategorySelectionStep,
  StayDetailsStep,
  FeaturesStep,
} from "@/components/onboarding/stays";

/**
 * Big-bag props for the stays step renderer. Bundling all state + setters
 * + handlers in one object keeps the parent's render dispatch a one-liner.
 * The shape mirrors what each step component needs.
 */
export interface StaysStepApi {
  // Step 0
  selectedProperties: string[];
  propertyTypes: { id: string; name: string; icon: string }[];
  togglePropertySelection: (id: string) => void;
  errors: Record<string, string>;
  setErrors: (e: Record<string, string>) => void;

  // Step 1
  selectedCategories: string[];
  getEffectiveCategories: (id: string) => any[];
  handleCategoryToggle: (key: string) => void;

  // Step 2
  stayType: "entire" | "individual";
  setStayType: (t: "entire" | "individual") => void;
  guestCapacity: number;
  numberOfRooms: number;
  numberOfBeds: number;
  numberOfBathrooms: number;
  regularPrice: string;
  setRegularPrice: (v: string) => void;
  incrementValue: (value: number, setter: (val: number) => void, max?: number) => void;
  decrementValue: (value: number, setter: (val: number) => void, min?: number) => void;
  setGuestCapacity: (v: number) => void;
  setNumberOfRooms: (v: number) => void;
  setNumberOfBeds: (v: number) => void;
  setNumberOfBathrooms: (v: number) => void;
  entireStayRules: string[];
  addEntireStayRule: () => void;
  removeEntireStayRule: (i: number) => void;
  updateEntireStayRule: (i: number, v: string) => void;
  roomRules: Record<string, string[]>;
  addRoomRule: (roomId: string) => void;
  removeRoomRule: (roomId: string, i: number) => void;
  updateRoomRule: (roomId: string, i: number, v: string) => void;
  coverImage: string | null;
  handleCoverImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeCoverImage: () => void;
  renderImageSrc: (src: string | null) => string;
  entireStayImages: string[];
  setEntireStayImages: React.Dispatch<React.SetStateAction<string[]>>;
  removeEntireStayImage: (i: number) => void;
  sliderRef: React.RefObject<any>;
  rooms: any[];
  expandedRoom: string;
  setExpandedRoom: (v: string) => void;
  addRoom: () => void;
  removeRoom: () => void;
  updateRoom: (id: string, field: any, value: any) => void;
  handleRoomImageUpload: (e: React.ChangeEvent<HTMLInputElement>, roomId: string) => void;
  removeRoomImage: (roomId: string, index: number) => void;
  clearError: (field: string) => void;

  // Step 3
  selectedFeatures: string[];
  toggleFeatureSelection: (id: string) => void;
  adminFeatures: any[];
  customFeatures: string[];
  setCustomFeatures: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedFeatures: React.Dispatch<React.SetStateAction<string[]>>;
  showCustomFeaturesInput: boolean;
  setShowCustomFeaturesInput: (v: boolean) => void;
  customFeatureInput: string;
  setCustomFeatureInput: (v: string) => void;
  featuresData: any[];

  // Step 4
  discountOffers: any;
  handleDiscountToggle: (key: "firstUser" | "festival" | "weekly" | "special") => void;
  handleDiscountOfferChange: (...args: any[]) => void;

  // Step 5
  brandName: string;
  companyName: string;
  gstNumber: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessPincode: string;
  handleBusinessChange: (field: string, value: string) => void;
  selected: CountryOption | null;
  setSelected: (c: CountryOption | null) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  countries: CountryOption[];
  data: any;
  stateOption2: string;
  cityOption2: string;
  countryOption2: string;
  handleBusinessStateChange: (val: string) => void;
  handleBusinessCityChange: (val: string) => void;
  mapSrcbusiness: string;

  // Step 6
  firstName: string;
  lastName: string;
  personalPincode: string;
  dateOfBirth: string;
  maritalStatus: string;
  idProof: string;
  handlePersonalChange: (field: string, value: string) => void;
  stateOption: string;
  cityOption: string;
  countryOption: string;
  handlePersonalStateChange: (val: string) => void;
  handlePersonalCityChange: (val: string) => void;
  idProofImage: string | null;
  handleUploadIDProof: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadError: string;

  // Step 7
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
}

/**
 * Dispatcher that renders the right step component for the current step,
 * forwarding props from the bundled `api` object.
 */
export function StaysStepRenderer({ step, api }: { step: number; api: StaysStepApi }) {
  switch (step) {
    case 0:
      return (
        <PropertyTypeStep
          selectedProperties={api.selectedProperties}
          propertyTypes={api.propertyTypes}
          onToggle={api.togglePropertySelection}
          errors={api.errors}
        />
      );

    case 1:
      return (
        <CategorySelectionStep
          selectedProperties={api.selectedProperties}
          selectedCategories={api.selectedCategories}
          propertyTypes={api.propertyTypes}
          getEffectiveCategories={api.getEffectiveCategories}
          onCategoryToggle={api.handleCategoryToggle}
        />
      );

    case 2:
      return (
        <StayDetailsStep
          stayType={api.stayType}
          setStayType={(t) => {
            api.setStayType(t);
            api.setErrors({});
          }}
          guestCapacity={api.guestCapacity}
          numberOfRooms={api.numberOfRooms}
          numberOfBeds={api.numberOfBeds}
          numberOfBathrooms={api.numberOfBathrooms}
          regularPrice={api.regularPrice}
          setRegularPrice={api.setRegularPrice}
          incrementValue={api.incrementValue}
          decrementValue={api.decrementValue}
          setGuestCapacity={api.setGuestCapacity}
          setNumberOfRooms={api.setNumberOfRooms}
          setNumberOfBeds={api.setNumberOfBeds}
          setNumberOfBathrooms={api.setNumberOfBathrooms}
          entireStayRules={api.entireStayRules}
          addEntireStayRule={api.addEntireStayRule}
          removeEntireStayRule={api.removeEntireStayRule}
          updateEntireStayRule={api.updateEntireStayRule}
          roomRules={api.roomRules}
          addRoomRule={api.addRoomRule}
          removeRoomRule={api.removeRoomRule}
          updateRoomRule={api.updateRoomRule}
          coverImage={api.coverImage}
          handleCoverImageUpload={api.handleCoverImageUpload}
          removeCoverImage={api.removeCoverImage}
          renderImageSrc={api.renderImageSrc}
          entireStayImages={api.entireStayImages}
          setEntireStayImages={api.setEntireStayImages}
          removeEntireStayImage={api.removeEntireStayImage}
          sliderRef={api.sliderRef}
          rooms={api.rooms}
          expandedRoom={api.expandedRoom}
          setExpandedRoom={api.setExpandedRoom}
          addRoom={api.addRoom}
          removeRoom={api.removeRoom}
          updateRoom={api.updateRoom}
          handleRoomImageUpload={api.handleRoomImageUpload}
          removeRoomImage={api.removeRoomImage}
          errors={api.errors}
          clearError={api.clearError}
        />
      );

    case 3:
      return (
        <FeaturesStep
          selectedFeatures={api.selectedFeatures}
          toggleFeatureSelection={api.toggleFeatureSelection}
          adminFeatures={api.adminFeatures}
          customFeatures={api.customFeatures}
          setCustomFeatures={api.setCustomFeatures}
          setSelectedFeatures={api.setSelectedFeatures}
          showCustomFeaturesInput={api.showCustomFeaturesInput}
          setShowCustomFeaturesInput={api.setShowCustomFeaturesInput}
          customFeatureInput={api.customFeatureInput}
          setCustomFeatureInput={api.setCustomFeatureInput}
          featuresData={api.featuresData}
          errors={api.errors}
        />
      );

    case 4:
      return (
        <DiscountOffersStep
          offers={api.discountOffers}
          onToggle={api.handleDiscountToggle}
          onOfferChange={api.handleDiscountOfferChange}
          errors={api.errors}
          weeklyLabel="Weekly or Monthly Offers"
        />
      );

    case 5:
      return (
        <BusinessDetailsStep
          values={{
            brandName: api.brandName,
            companyName: api.companyName,
            gstNumber: api.gstNumber,
            businessEmail: api.businessEmail,
            businessPhone: api.businessPhone,
            businessAddress: api.businessAddress,
            pincode: api.businessPincode,
          }}
          errors={api.errors}
          onChange={api.handleBusinessChange}
          selectedCountry={api.selected}
          onCountrySelect={api.setSelected}
          countryDialogOpen={api.open}
          setCountryDialogOpen={api.setOpen}
          countries={api.countries}
          locationData={api.data}
          selectedState={api.stateOption2}
          selectedCity={api.cityOption2}
          countryName={api.countryOption2}
          onStateChange={api.handleBusinessStateChange}
          onCityChange={api.handleBusinessCityChange}
          mapSrc={api.mapSrcbusiness}
        />
      );

    case 6:
      return (
        <PersonalDetailsStep
          values={{
            firstName: api.firstName,
            lastName: api.lastName,
            pincode: api.personalPincode,
            dateOfBirth: api.dateOfBirth,
            maritalStatus: api.maritalStatus,
            idProof: api.idProof,
          }}
          errors={api.errors}
          onChange={api.handlePersonalChange}
          locationData={api.data}
          selectedState={api.stateOption}
          selectedCity={api.cityOption}
          countryName={api.countryOption}
          onStateChange={api.handlePersonalStateChange}
          onCityChange={api.handlePersonalCityChange}
          idProofImage={api.idProofImage}
          onIdProofUpload={api.handleUploadIDProof}
          uploadError={api.uploadError}
        />
      );

    case 7:
      return (
        <TermsConditionsStep
          termsAccepted={api.termsAccepted}
          onTermsChange={api.setTermsAccepted}
        />
      );

    default:
      return null;
  }
}

export default StaysStepRenderer;
