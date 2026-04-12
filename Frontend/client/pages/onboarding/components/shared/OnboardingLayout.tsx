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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="onb-header">
        <LogoWebsite />
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <span className="onb-step-badge">{currentStep + 1}</span>
          <span className="font-medium" style={{ color: "var(--th-accent)" }}>
            Step {currentStep + 1}
          </span>
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
      <div className="flex w-full z-30 fixed bottom-0 items-center justify-center px-6 lg:px-16 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-4">
        <div className="max-w-4xl mx-auto w-full flex justify-between items-center gap-5">
          {/* LEFT - progress */}
          {!isLastStep && (
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Step{" "}
                <span className="font-semibold" style={{ color: "var(--th-accent)" }}>
                  {currentStep + 1}
                </span>{" "}
                of {totalSteps - 1}
              </span>
              <div className="flex gap-1.5 w-36 sm:w-48 h-1.5">
                {Array.from({ length: totalSteps - 1 }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-full rounded-full transition-colors ${
                      i <= currentStep ? "bg-[var(--th-accent)]" : "bg-gray-200 dark:bg-gray-700"
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
              className="h-10 px-6 text-sm border border-gray-200 dark:border-gray-600 rounded-full hover:border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all duration-200"
            >
              Back
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={isLoading || !canProceed || (isLastStep && !termsAccepted)}
              className="h-10 px-8 text-sm rounded-full onb-btn-primary disabled:opacity-35 disabled:cursor-not-allowed"
              style={canProceed ? { boxShadow: "0 4px 20px rgba(37, 99, 235, 0.25)" } : undefined}
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
