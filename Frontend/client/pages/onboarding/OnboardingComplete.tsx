import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const OnboardingComplete = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();

  const handleBack = () => {
    navigate('/onboarding/service-selection');
  };

  const handleEdit = () => {
    // Navigate back to previous onboarding step for editing
    navigate('/onboarding/service-selection');
  };

  const handleBackToHome = () => {
    completeOnboarding(); // Mark onboarding as complete
    navigate('/');
  };

  return (
 <div className="onboarding-layout min-h-screen flex flex-col dark-transition">

  {/* ================= Header ================= */}
  <header className="flex-none border-b border-gray-100 dark:border-gray-800">
    <div className="flex items-center h-14 px-6 lg:px-16">
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/f6f09b434677d6443a1c0584231cf8b7ddcb9a02?width=160"
        alt="Travel Mines Logo"
        className="w-20 h-12 object-contain"
      />
    </div>
  </header>

  {/* ================= Main Content ================= */}
  <main className="flex-1 flex items-center justify-center px-4 sm:px-8 overflow-y-auto">
    <div className="max-w-[965px] w-full text-center">

      {/* Emoji */}
      <div className="text-6xl mb-8 animate-scale-in">🎉</div>

      {/* Title */}
      <h1 className="congratulations-title mb-2">
        Congratulations!
      </h1>

      <p className="congratulations-subtitle max-w-[880px] mx-auto">
        Thank you for submitting your camper van listing! Our team is
        reviewing the details to ensure it meets our quality standards.
        We'll notify you via email as soon as your listing goes live.
      </p>

      {/* What Next */}
      <div className="mt-10">
        <h2 className="what-next-title mb-3">
          What happens next?
        </h2>

        <div className="space-y-2 text-base">
          <p>• Our team will review your listing within 24–48 hours.  
            In some cases, it may take up to seven working days.</p>
          <p>• Once approved, your camper van will be live and ready for bookings.</p>
        </div>
      </div>

    </div>
  </main>

  {/* ================= Footer ================= */}
  <footer className="flex-none border-t border-gray-100 dark:border-gray-800 px-6 lg:px-16 py-4">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

      {/* Back */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors order-2 sm:order-1"
      >
        ← Back
      </button>

      {/* Actions */}
      <div className="flex items-center gap-3 order-1 sm:order-2">
        <button
          onClick={handleEdit}
          className="h-11 px-8 text-sm border border-gray-200 dark:border-gray-600 rounded-full hover:border-gray-400 transition-colors"
        >
          Edit
        </button>

        <button
          onClick={handleBackToHome}
          className="h-11 px-8 text-sm hover:brightness-110 font-semibold rounded-full transition-opacity"
          style={{backgroundColor: 'var(--th-accent)', color: 'var(--th-accent-fg)'}}
        >
          Back to Home
        </button>
      </div>

    </div>
  </footer>

</div>

  );
};

export default OnboardingComplete;
