import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '','']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const pasteOtp = pasteData.slice(0, 5).split('');
    
    const newOtp = [...otp];
    pasteOtp.forEach((char, index) => {
      if (index < 5 && /^\d$/.test(char)) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
    
    // Focus the next empty input or last input
    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    const focusIndex = nextEmptyIndex === -1 ? 4 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 5) {
      toast.error('Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    try {
      const success = await verifyOTP(otpCode);
      if (success) {
        toast.success('OTP verified successfully!');
        navigate('/onboarding/service-selection');
      } else {
        toast.error('Invalid OTP. Please try again.');
        // Clear OTP on error
        setOtp(['', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
      setOtp(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    // Simulate resend API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setResendLoading(false);
    toast.success('OTP resent successfully!');
  };

  const handleBack = () => {
    navigate('/register');
  };

  return (
    <div className="auth-layout ">
      {/* Left side - Image gallery */}
      <div className="auth-image-gallery">
        <div className="flex flex-col gap-5 flex-1">
          <img 
            src="https://api.builder.io/api/v1/image/assets/TEMP/b85a174d73e23c66bc3315c90718740d54f6a815?width=641" 
            alt="Travel destination" 
            className="flex-1 rounded-[20px] object-cover"
          />
          <img 
            src="https://api.builder.io/api/v1/image/assets/TEMP/c3d61f456ed7d675a05311cbee859a54922fae15?width=641" 
            alt="Travel destination" 
            className="flex-1 rounded-[20px] object-cover"
          />
          <img 
            src="https://api.builder.io/api/v1/image/assets/TEMP/35e201b656cfa241c03e3280e3bf67ec0b0f6d87?width=641" 
            alt="Travel destination" 
            className="flex-1 rounded-[20px] object-cover"
          />
        </div>
        <div className="flex flex-col justify-center gap-5 flex-1">
          <img 
            src="https://api.builder.io/api/v1/image/assets/TEMP/b9c3c4635b522e51c991a0b4dc045218d6d9168a?width=641" 
            alt="Travel destination" 
            className="flex-1 rounded-[20px] object-cover"
          />
          <img 
            src="https://api.builder.io/api/v1/image/assets/TEMP/76e92c1f16f6a4fc58280175233debd228ea6fb4?width=641" 
            alt="Travel destination" 
            className="flex-1 rounded-[20px] object-cover"
          />
        </div>
      </div>

      {/* Right side - OTP verification form */}
      <div className="auth-form-container max-md:mt-0 max-md:p-0 lg:mt-48  ">
        <div className="auth-form">
          {/* Back button and header */}
          <div className="space-y-8 max-md:mt-[-350px]">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-[#131313] dark:text-white hover:opacity-80 transition-opacity"
            >
              <ArrowLeft size={24} />
              <span className="text-sm font-medium font-['Plus_Jakarta_Sans']">
                Back to login
              </span>
            </button>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-black dark:text-white font-['Inter']">
                Verify code
              </h1>
              <p className="text-base text-[#112211] dark:text-gray-300 opacity-75 font-['Plus_Jakarta_Sans']">
                An authentication code has been sent to your email.
              </p>
            </div>
          </div>

          {/* Demo OTP notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Demo OTP</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">Use this OTP to test verification:</p>
            <div className="text-sm font-mono">
              {/* <div><strong>OTP:</strong> {DEMO_CREDENTIALS.otp}</div> */}
            </div>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-base text-[#222] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                  Enter Code
                </label>
                
                <div className="flex gap-2 sm:gap-3 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="otp-input w-[48px] sm:w-[52px] focus:outline-none"
                      placeholder="2"
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#717171] dark:text-gray-400 font-['Plus_Jakarta_Sans']">
                    Didn't receive a code?
                  </span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-sm text-[#121] dark:text-white font-bold hover:underline disabled:opacity-50 font-['Plus_Jakarta_Sans']"
                  >
                    {resendLoading ? 'Sending...' : 'Resend'}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.join('').length !== 5}
              className="w-full h-12 bg-[#131313] hover:bg-gray-800 text-white rounded-[60px] text-base font-medium transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
