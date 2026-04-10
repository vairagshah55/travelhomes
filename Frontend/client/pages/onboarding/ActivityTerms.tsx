import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';

const ActivityTerms = () => {
  const navigate = useNavigate();

  const handleStartVerification = () => {
    navigate('/onboarding/activity-selfie');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-center px-20 py-5 border-b border-gray-100">
        <div className="flex items-center gap-6 w-full max-w-6xl">
          <div className="w-20 h-14">
            <img src="/placeholder.svg" alt="Travel Homes" className="w-20 h-14" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-16 py-20">
        <div className="flex items-start justify-between w-full max-w-6xl mx-auto gap-20">
          {/* Left Content */}
          <div className="flex-1 max-w-2xl space-y-12">
            <div className="space-y-12">
              {/* Header Section */}
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-[#1C2939] leading-tight">
                  Terms & Conditions for Verification
                </h1>
                <p className="text-base text-[#485467] leading-relaxed">
                  By proceeding with the verification process on{' '}
                  <span className="font-bold text-[#1C2939]">Travel Homes</span>, you agree to 
                  the following terms and conditions:
                </p>
              </div>

              {/* Terms List */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <p className="text-base text-[#334054] leading-relaxed">
                    <span className="font-bold text-[#101828]">1. Accurate Information</span>
                    <span className="font-bold text-[#334054]"> –</span>
                    <span className="text-[#334054]"> Provide truthful details; false information may lead to account suspension.</span>
                  </p>

                  <p className="text-base text-[#334054] leading-relaxed">
                    <span className="font-bold text-[#101828]">2. Data Usage & Security</span>
                    <span className="font-bold text-[#334054]"> –</span>
                    <span className="text-[#334054]"> Your data is securely stored and used only for verification; third-party services may assist in the process.</span>
                  </p>

                  <p className="text-base text-[#334054] leading-relaxed">
                    <span className="font-bold text-[#101828]">3. Verification Rights</span>
                    <span className="font-bold text-[#334054]"> –</span>
                    <span className="text-[#334054]"> We may deny verification if information is invalid, and terms are subject to updates.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Start Verification Button */}
            <div className="flex items-start">
              <Button
                onClick={handleStartVerification}
                className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 text-base"
              >
                Start Verification
              </Button>
            </div>
          </div>

          {/* Right Content - Illustration */}
          <div className="flex-1 max-w-lg flex items-center justify-center">
            <div className="w-full h-96 flex items-center justify-center">
              <img
                src="/placeholder.svg"
                alt="Verification illustration"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTerms;
