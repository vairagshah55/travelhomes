import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SmallDropdownArrowSvg, type DiscountOffer } from "./types";

interface DiscountOffersStepProps {
  offers: {
    firstUser: DiscountOffer;
    festival: DiscountOffer;
    weekly: DiscountOffer;
    special: DiscountOffer;
  };
  onToggle: (key: "firstUser" | "festival" | "weekly" | "special") => void;
  onOfferChange: (key: "firstUser" | "festival" | "weekly" | "special", field: keyof DiscountOffer, value: string) => void;
  errors: Record<string, string>;
  weeklyLabel?: string;
}

const OfferCard: React.FC<{
  title: string;
  offer: DiscountOffer;
  offerKey: string;
  onToggle: () => void;
  onOfferChange: (field: keyof DiscountOffer, value: string) => void;
  errors: Record<string, string>;
}> = ({ title, offer, offerKey, onToggle, onOfferChange, errors }) => {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-black dark:text-white">{title}</h3>
        <button
          onClick={onToggle}
          className={`w-9 h-5 rounded-full transition-colors duration-200 ${
            offer.enabled ? "bg-[var(--th-accent)]" : "bg-[#D2D5DA]"
          }`}
        >
          <div
            className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
              offer.enabled ? "translate-x-[18px]" : "translate-x-[2px]"
            }`}
          ></div>
        </button>
      </div>

      {offer.enabled && (
        <>
          <div className="w-full h-px bg-[#EAECF0] border-dashed"></div>
          <div className="flex md:items-start w-full gap-5 max-md:flex-col">
            <div className="flex flex-col gap-3 flex-1">
              <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                Discount Type
              </Label>
              <div className="relative">
                <select
                  value={offer.type}
                  onChange={(e) => onOfferChange("type", e.target.value)}
                  className="w-full p-[14px_12px] border border-[#B0B0B0] rounded-lg text-sm font-plus-jakarta text-[#717171] bg-white dark:bg-gray-800 appearance-none"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                <SmallDropdownArrowSvg />
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                Discount {offer.type === "percentage" ? "Percentage" : "Amount"}
              </Label>
              <Input
                type="number"
                maxLength={offer.type === "percentage" ? 2 : 10}
                placeholder={offer.type === "percentage" ? "10%" : "Fixed Amount"}
                value={offer.value}
                onChange={(e) => {
                  let value = e.target.value;
                  if (offer.type === "percentage" && Number(value) > 99) return;
                  onOfferChange("value", value);
                }}
                className="border-[#B0B0B0] text-sm font-plus-jakarta text-[#717171]"
              />
              {errors[`${offerKey}Value`] && (
                <span className="text-red-500 text-xs mt-1">{errors[`${offerKey}Value`]}</span>
              )}
              {errors.discountPercentage && offerKey === "firstUser" && (
                <span className="text-red-500 text-xs mt-1">{errors.discountPercentage}</span>
              )}
            </div>
            <div className="flex flex-col gap-3 flex-1">
              <Label className="text-base text-[#334054] dark:text-gray-400 font-plus-jakarta">
                Final Price
              </Label>
              <Input
                type="number"
                placeholder="Enter Final Price"
                value={offer.finalPrice}
                onChange={(e) => onOfferChange("finalPrice", e.target.value)}
                className="border-[#B0B0B0] text-sm font-plus-jakarta text-[#717171]"
              />
              {errors[`${offerKey}FinalPrice`] && (
                <span className="text-red-500 text-xs mt-1">{errors[`${offerKey}FinalPrice`]}</span>
              )}
              {errors.finalPrice && offerKey === "firstUser" && (
                <span className="text-red-500 text-xs mt-1">{errors.finalPrice}</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const DiscountOffersStep: React.FC<DiscountOffersStepProps> = ({
  offers,
  onToggle,
  onOfferChange,
  errors,
  weeklyLabel = "Weekly or Monthly Offers",
}) => {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Types of Discount
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set up promotional offers for your listing
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">
        <OfferCard
          title="First 5 User Discount"
          offer={offers.firstUser}
          offerKey="firstUser"
          onToggle={() => onToggle("firstUser")}
          onOfferChange={(field, value) => onOfferChange("firstUser", field, value)}
          errors={errors}
        />
        <OfferCard
          title="Festival Offers"
          offer={offers.festival}
          offerKey="festival"
          onToggle={() => onToggle("festival")}
          onOfferChange={(field, value) => onOfferChange("festival", field, value)}
          errors={errors}
        />
        <OfferCard
          title={weeklyLabel}
          offer={offers.weekly}
          offerKey="weekly"
          onToggle={() => onToggle("weekly")}
          onOfferChange={(field, value) => onOfferChange("weekly", field, value)}
          errors={errors}
        />
        <OfferCard
          title="Special Offers"
          offer={offers.special}
          offerKey="special"
          onToggle={() => onToggle("special")}
          onOfferChange={(field, value) => onOfferChange("special", field, value)}
          errors={errors}
        />
      </div>
    </div>
  );
};

export default DiscountOffersStep;
