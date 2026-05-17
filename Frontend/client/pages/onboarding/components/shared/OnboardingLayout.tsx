import React from "react";
import LogoWebsite from "@/components/ui/LogoWebsite";

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
  canProceed: boolean;
  termsAccepted?: boolean;
  onBack: () => void;
  onNext: () => void;
  children: React.ReactNode;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  currentStep,
  totalSteps,
  isLoading,
  canProceed,
  termsAccepted,
  onBack,
  onNext,
  children,
}) => {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="min-h-screen bg-white font-sans text-ds-charcoal flex flex-col">
      {/* Header */}
      <div className="onb-header">
        <LogoWebsite />
        <div className="hidden sm:flex items-center gap-2 text-xs text-ds-slate">
          <span className="onb-step-badge">{currentStep + 1}</span>
          <span className="font-medium text-ds-deep">Step {currentStep + 1}</span>
          <span>of {totalSteps}</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pt-16 pb-24">
        <div
          key={currentStep}
          className="max-w-7xl mx-auto w-full px-6 lg:px-20 flex flex-col items-center gap-10 py-8 onb-fade-up"
        >
          {children}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="flex w-full z-30 fixed bottom-0 items-center justify-center px-6 lg:px-16 bg-white border-t border-ds-pebble py-4">
        <div className="max-w-4xl mx-auto w-full flex justify-between items-center gap-5">
          {/* LEFT - progress */}
          {!isLastStep && (
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-sm font-medium text-ds-slate whitespace-nowrap">
                Step <span className="font-semibold text-ds-deep">{currentStep + 1}</span> of{" "}
                {totalSteps - 1}
              </span>
              <div className="flex gap-1.5 w-36 sm:w-48 h-1.5">
                {Array.from({ length: totalSteps - 1 }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-full rounded-full transition-colors ${
                      i <= currentStep ? "bg-ds-deep" : "bg-ds-pebble/60"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* RIGHT - nav */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onBack}
              className="h-10 px-6 text-sm border border-ds-pebble rounded-full text-ds-charcoal hover:border-ds-deep hover:bg-ds-sky active:scale-95 transition-all duration-200"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={isLoading || !canProceed || (isLastStep && !termsAccepted)}
              className="h-10 px-8 text-sm rounded-full onb-btn-primary disabled:opacity-35 disabled:cursor-not-allowed"
              style={canProceed ? { boxShadow: "0 4px 20px rgba(24, 95, 165, 0.20)" } : undefined}
            >
              {isLoading ? "Loading..." : isLastStep ? "Start Verification" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;
