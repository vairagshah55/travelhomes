import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoWebsite from '@/components/ui/LogoWebsite';

const ActivityTerms = () => {
  const navigate = useNavigate();

  const terms = [
    {
      title: "1. Accurate Information",
      body: "Provide truthful details; false information may lead to account suspension.",
    },
    {
      title: "2. Data Usage & Security",
      body: "Your data is securely stored and used only for verification; third-party services may assist in the process.",
    },
    {
      title: "3. Verification Rights",
      body: "We may deny verification if information is invalid, and terms are subject to updates.",
    },
  ];

  return (
    <div className="onboarding-layout min-h-screen flex flex-col bg-white dark:bg-gray-900">

      {/* Header */}
      <div className="flex h-14 w-full items-center justify-start px-6 lg:px-16 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <LogoWebsite />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-16 py-12">
        <div className="flex items-start justify-between w-full max-w-5xl gap-16">

          {/* Left */}
          <div className="flex-1 max-w-xl flex flex-col gap-8">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Before you proceed
              </span>
              <h1 className="text-2xl lg:text-3xl font-semibold text-black dark:text-white leading-tight">
                Terms & Conditions for Verification
              </h1>
              <p className="text-sm text-[--th-text-secondary] dark:text-gray-400">
                By proceeding with the verification process on{' '}
                <span className="font-semibold text-black dark:text-white">Travel Homes</span>,
                you agree to the following:
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {terms.map((term) => (
                <div
                  key={term.title}
                  className="flex flex-col gap-0.5 p-4 rounded-2xl border border-[--th-border] dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40"
                >
                  <p className="text-sm font-semibold text-black dark:text-white">{term.title}</p>
                  <p className="text-sm text-[--th-text-secondary] dark:text-gray-400">{term.body}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/onboarding/activity-selfie')}
              className="h-12 w-fit px-10 rounded-full hover:brightness-110 font-semibold text-sm font-medium transition-opacity"
              style={{backgroundColor: 'var(--th-accent)', color: 'var(--th-accent-fg)'}}
            >
              Start Verification
            </button>
          </div>

          {/* Right - Illustration */}
          <div className="hidden lg:flex flex-1 max-w-md items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gray-100 dark:bg-gray-800 scale-110 blur-2xl opacity-60" />
              <img
                src="/placeholder.svg"
                alt="Verification illustration"
                className="relative w-72 h-72 object-contain"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ActivityTerms;
