import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Congratulations = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();

  useEffect(() => {
    // Mark onboarding as complete when user reaches congratulations page
    completeOnboarding();
  }, [completeOnboarding]);

  const handleBack = () => {
    navigate('/onboarding/selfie-verification');
  };

  const handleEdit = () => {
    navigate('/onboarding/caravan');
  };

  const handleBackToHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="onboarding-layout min-h-screen bg-background dark-transition">
      {/* Header */}
      <div className="onboarding-header">
        <div className="flex items-center justify-center h-[50px]">
          <div className="w-[266px] flex items-start">
            <img 
              src="https://api.builder.io/api/v1/image/assets/TEMP/f6f09b434677d6443a1c0584231cf8b7ddcb9a02?width=160" 
              alt="Travel Mines Logo" 
              className="w-20 h-14 object-contain"
            />
          </div>
          <div className="flex-1"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative min-h-[calc(100vh-178px)] flex items-center justify-center px-4 sm:px-8 lg:px-0">
        {/* Content Card */}
        <div className="congratulations-container animate-fade-in">
          <div className="congratulations-content">
            
            {/* Decorative Celebration Elements */}
            <div className="congratulations-decorative">
              
              {/* Celebration Stars and Confetti */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Top left star */}
                <div className="absolute top-4 left-[8%] sm:left-[20%] lg:left-[113px] w-3 h-[11px] transform rotate-[-45deg] animate-scale-in">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.962 3.88925L8.96202 6.38L5.33912 4.93821C5.08544 4.83725 4.83404 5.08865 4.93502 5.34231L6.37679 8.96519L3.88606 11.9652C3.71163 12.1753 3.87306 12.4921 4.1455 12.4744L8.03659 12.2227L10.1201 15.5186C10.266 15.7494 10.6172 15.6938 10.6846 15.4292L11.6476 11.6508L15.4261 10.6878C15.6906 10.6203 15.7462 10.2692 15.5154 10.1233L12.2195 8.0398L12.4712 4.1487C12.4889 3.87625 12.1721 3.71484 11.962 3.88925Z" fill="var(--congratulations-star-yellow)"/>
                    <path d="M6.65654 5.46252L5.3391 4.93823C5.08542 4.83727 4.83402 5.08867 4.93499 5.34233L6.37677 8.96521L3.88606 11.9652C3.71163 12.1753 3.87306 12.4921 4.1455 12.4744L8.03659 12.2227L10.1201 15.5186C10.266 15.7494 10.6172 15.6938 10.6846 15.4292L10.8128 14.9264C7.98158 11.0606 6.97778 7.14839 6.65654 5.46252Z" fill="var(--congratulations-star-orange)"/>
                  </svg>
                </div>

                {/* Green decorative lines */}
                <div className="absolute top-6 left-[5%] sm:left-[10%] lg:left-[39px] w-[15px] h-[3px] transform rotate-[-37deg] rounded-[1.5px] animate-slide-up" style={{backgroundColor: 'var(--congratulations-green)'}}></div>
                <div className="absolute top-4 right-[5%] sm:right-[10%] lg:right-[38px] w-[15px] h-[3px] transform rotate-[-37deg] rounded-[1.5px] animate-slide-up" style={{backgroundColor: 'var(--congratulations-green)'}}></div>
                <div className="absolute top-20 right-[2%] sm:right-[5%] lg:right-[14px] w-[15px] h-[3px] transform rotate-[-37deg] rounded-[1.5px] animate-scale-in" style={{backgroundColor: 'var(--congratulations-green)'}}></div>
                <div className="absolute top-24 left-[15%] sm:left-[18%] lg:left-[74px] w-[15px] h-[3px] transform rotate-[31deg] rounded-[1.5px] animate-scale-in" style={{backgroundColor: 'var(--congratulations-green)'}}></div>

                {/* Purple decorative elements */}
                <div className="absolute top-12 left-[20%] sm:left-[22%] lg:left-[88px] w-[10px] h-[2px] transform rotate-[67deg] rounded-[1.5px] animate-fade-in" style={{backgroundColor: 'var(--congratulations-purple)'}}></div>
                <div className="absolute top-12 left-[1%] sm:left-[2%] lg:left-[1px] w-[6px] h-[6px] transform rotate-[42deg] animate-scale-in" style={{backgroundColor: 'var(--congratulations-purple)'}}></div>
                <div className="absolute top-36 left-[8%] sm:left-[6%] lg:left-[22px] w-[6px] h-[6px] transform rotate-[70deg] animate-fade-in" style={{backgroundColor: 'var(--congratulations-purple)'}}></div>
                <div className="absolute top-24 left-[35%] sm:left-[40%] lg:left-[159px] w-[6px] h-[6px] transform rotate-[70deg] animate-scale-in" style={{backgroundColor: 'var(--congratulations-green)'}}></div>
                <div className="absolute bottom-4 right-[3%] sm:right-[5%] lg:right-[11px] w-[10px] h-[2px] transform rotate-[31deg] rounded-[1.5px] animate-slide-up" style={{backgroundColor: 'var(--congratulations-purple)'}}></div>
                <div className="absolute top-16 right-[25%] sm:right-[30%] lg:right-[86px] w-[10px] h-[2px] transform rotate-[138deg] rounded-[1.5px] animate-fade-in" style={{backgroundColor: 'var(--congratulations-purple)'}}></div>
              </div>

              {/* Party Emoji */}
              <div className="congratulations-emoji animate-scale-in">
                🎉
              </div>
              
              {/* Main Content */}
              <div className="w-full max-w-[965px] flex flex-col items-center gap-12 sm:gap-14">
                
                {/* Title and Description */}
                <div className="w-full max-w-[890px] flex flex-col items-center gap-2">
                  <h1 className="congratulations-title">
                    Congratulations!
                  </h1>
                  <p className="congratulations-subtitle">
                    Thank you for submitting your camper van listing! Our team is reviewing the details to ensure it meets our quality standards. We'll notify you via email as soon as your listing goes live.
                  </p>
                </div>
                
                {/* What Happens Next Section */}
                <div className="what-next-section">
                  <h2 className="what-next-title">
                    What happen next?
                  </h2>
                  <div className="what-next-content">
                    <p>
                      • Our team will review your listing within 24-48 hours. In some cases it may take up to seven working days
                    </p>
                    <p>
                      • Once approved, your camper van will be live and ready for bookings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Action Buttons */}
      <div className="onboarding-footer">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="auth-back-button hover:opacity-70 transition-opacity duration-200 order-2 sm:order-1"
            aria-label="Go back to previous step"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_0_9898)">
                <path d="M12.5 16.6L7.0667 11.1667C6.42503 10.525 6.42503 9.47499 7.0667 8.83333L12.5 3.39999" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_0_9898">
                  <rect width="20" height="20" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            <span className="text-base dark:text-gray-300 font-geist tracking-[-0.32px] leading-[160%]" style={{color: 'var(--congratulations-secondary-400)'}}>
              Back
            </span>
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 sm:gap-6 order-1 sm:order-2">
         
            <button
              onClick={handleBackToHome}
              className="flex items-center justify-center px-6 sm:px-8 py-[14px] h-[52px] hover:brightness-110 rounded-[60px] hover:shadow-lg transition-all duration-200 focus-ring"
              style={{backgroundColor: 'var(--th-accent)', color: 'var(--th-accent-fg)'}}
              aria-label="Go to dashboard"
            >
              <span className="text-sm sm:text-base font-medium font-geist tracking-[-0.32px] leading-[120%]">
                Back to Home
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Congratulations;
