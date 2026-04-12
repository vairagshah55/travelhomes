import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TermsConditionsStepProps {
  termsAccepted: boolean;
  onTermsChange: (checked: boolean) => void;
}

const TermsConditionsStep: React.FC<TermsConditionsStepProps> = ({
  termsAccepted,
  onTermsChange,
}) => {
  return (
    <div className="fixed flex max-md:flex-col max-md:gap-3 overflow-hidden">
      {/* Left Content */}
      <div className="flex-1 flex flex-col gap-3">
        <h1 className="text-[32px] max-md:text-base font-bold text-[#1C2939] dark:text-white">
          Terms & Conditions for Verification
        </h1>

        <p className="max-md:text-xs text-base text-[#485467] dark:text-gray-400 font-['Poppins'] leading-[155%]">
          By proceeding with the verification process on{" "}
          <span className="font-bold text-[#1C2939] dark:text-white">Travel Homes</span>, you
          agree to the following terms and conditions:
        </p>

        <p className="max-md:text-xs text-base font-['Poppins'] leading-[155%] mt-4">
          <span className="font-bold text-[#101828] dark:text-white">1. Accurate Information</span>{" "}
          <span className="text-[#334054] dark:text-gray-300">
            – Provide truthful details; false information may lead to account suspension.
          </span>
        </p>

        <p className="max-md:text-xs text-base font-['Poppins'] leading-[155%]">
          <span className="font-bold text-[#101828] dark:text-white">2. Data Usage & Security</span>{" "}
          <span className="text-[#334054] dark:text-gray-300">
            – Your data is securely stored and used only for verification.
          </span>
        </p>

        <p className="max-md:text-xs text-base font-['Poppins'] leading-[155%]">
          <span className="font-bold text-[#101828] dark:text-white">3. Verification Rights</span>{" "}
          <span className="text-[#334054] dark:text-gray-300">
            – We may deny verification if information is invalid.
          </span>
        </p>

        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => onTermsChange(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm">
              I accept the terms and conditions
            </Label>
          </div>
        </div>
      </div>

      {/* Right Image */}
      <div className="flex justify-center items-center">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/7e591c21d8b3bea0e51f3c5c2a65a03538099697?width=1000"
          alt="Verification Illustration"
          className="w-[450px] max-md:w-[280px] h-auto object-contain"
        />
      </div>
    </div>
  );
};

export default TermsConditionsStep;
