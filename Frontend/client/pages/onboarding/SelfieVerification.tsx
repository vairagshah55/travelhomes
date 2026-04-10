import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Camera, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import LogoWebsite from '@/components/ui/LogoWebsite';
import { submitSelfieVerification } from '@/lib/api';
import { onboardingService } from '@/lib/onboardingService';

const ActivitySelfie = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track current camera mode
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const listVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vids = devices.filter((d) => d.kind === "videoinput");
      setVideoDevices(vids);
      setHasMultipleCameras(vids.length > 1);
      return vids;
    } catch {
      setVideoDevices([]);
      setHasMultipleCameras(false);
      return [] as MediaDeviceInfo[];
    }
  }, []);

  // Start Camera with robust fallbacks and clearer errors
  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Camera not supported or insecure context. Use HTTPS or localhost.");
        return;
      }

      const tryConstraints = async (c: MediaStreamConstraints) => {
        return await navigator.mediaDevices.getUserMedia(c);
      };

      // Refresh device list first (after a dummy permission ask if necessary)
      let vids = await listVideoDevices();
      if (!vids.length) {
        // Some browsers require an initial prompt before enumerateDevices returns labels
        try {
          const tmp = await tryConstraints({ video: true, audio: false });
          tmp.getTracks().forEach(t => t.stop());
        } catch {}
        vids = await listVideoDevices();
      }

      let stream: MediaStream | null = null;
      // If we have deviceIds, try by deviceId first using selection
      if (vids.length) {
        const idx = Math.min(currentDeviceIndex, vids.length - 1);
        const deviceId = vids[idx].deviceId;
        try {
          stream = await tryConstraints({ video: { deviceId }, audio: false });
        } catch (_e) {
          // fallback to facingMode, then generic
          try {
            stream = await tryConstraints({ video: { facingMode }, audio: false });
          } catch {
            stream = await tryConstraints({ video: true, audio: false });
          }
        }
      } else {
        // No devices, try generic (will throw NotFoundError)
        stream = await tryConstraints({ video: true, audio: false });
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      const name = error?.name;
      if (name === "NotAllowedError") {
        toast.error("Camera permission denied. Allow access in browser settings.");
      } else if (name === "NotFoundError") {
        // Give a more actionable message
        toast.error("No camera found or it's in use. Check permissions or another app using camera.");
      } else if (name === "OverconstrainedError") {
        toast.error("Requested camera not available. Cycling devices...");
        // Try cycling device index once automatically
        if (videoDevices.length > 1) {
          setCurrentDeviceIndex((prev) => (prev + 1) % videoDevices.length);
          setTimeout(() => startCamera(), 0);
          return;
        }
      } else if (name === "SecurityError") {
        toast.error("Camera requires HTTPS or localhost.");
      } else {
        toast.error("Unable to access camera.");
      }
    }
  }, [facingMode]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Select file as selfie (fallback)
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Allow any file type for testing DB save
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // base64 data URL
      setCapturedImage(result);
      setIsStreaming(false);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  // Submit photo (send to backend for DB save)
  const submitPhoto = async () => {
    if (!capturedImage) {
      toast.error("Please capture or select a file first.");
      return;
    }

    try {
      setIsLoading(true);
      // Determine which onboarding flow user completed
      const onboarding = onboardingService.getAnyId();

      if (!onboarding || !onboarding.id) {
        toast.error("Onboarding session not found. Please try again.");
        return;
      }

      const { type, id } = onboarding;
      const result = await submitSelfieVerification(type, id, capturedImage);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} verification saved successfully!`);
      
      // Clear ids after success to avoid cross-flow confusion
      onboardingService.clearAll();
      navigate("/onboarding/complete");
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save selfie verification');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle camera (front ↔ back) or cycle through devices when available
  const switchCamera = useCallback(async () => {
    stopCamera();
    // If multiple devices, cycle by device index; else flip facingMode as a hint
    if (videoDevices.length > 1) {
      setCurrentDeviceIndex((prev) => {
        const next = (prev + 1) % videoDevices.length;
        // restart with new device after state updates
        setTimeout(() => startCamera(), 0);
        return next;
      });
    } else {
      setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
      setTimeout(() => startCamera(), 0);
    }
  }, [stopCamera, videoDevices.length, startCamera]);

  // Effect: Guard - ensure we have an onboarding id from any flow (run once on mount)
  useEffect(() => {
    const onboarding = onboardingService.getAnyId();
    if (!onboarding) {
      toast.error('Please complete an onboarding form first.');
      navigate('/onboarding/service-selection');
    } else if (onboarding.id) {
      // Store IDs in session storage as requested
      sessionStorage.setItem('onboardingId', onboarding.id);
      sessionStorage.setItem('onboardingType', onboarding.type);
      sessionStorage.setItem('id', onboarding.id);
    }
  }, [navigate]);

  // Effect: start camera on mount & cleanup on unmount
  useEffect(() => {
    // Only attempt to start camera if we have an ID
    const onboarding = onboardingService.getAnyId();
    if (onboarding && onboarding.id) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
     <div className="h-screen overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
      {/* ================= Header ================= */}
      <div className="flex items-center justify-center px-20 py-2 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-6 w-full max-w-6xl">
          <LogoWebsite />
        </div>
      </div>

      {/* ================= Main Content ================= */}
      <div className="flex-1 px-6 py-4 overflow-hidden pb-32">
        <div className="flex flex-col items-center gap-4 h-full w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-black dark:text-white text-center">
            Verification
          </h1>

          <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
            {/* Camera / Image Preview */}
            <div className="relative w-full max-w-2xl h-80 bg-gray-100 rounded-lg overflow-hidden">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured selfie"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      facingMode === "user" ? "scale-x-[-1]" : ""
                    }`}
                  />

                  {!isStreaming && (
                    <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center bg-gray-200">
                      <Camera className="w-12 h-12 text-gray-400" />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 rounded-full bg-black text-white hover:bg-gray-800"
                        >
                          Start Camera
                        </button>

                        <label className="px-4 py-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
                          Select File
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelected}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Capture & Switch Buttons */}
            {!capturedImage && isStreaming && (
              <div className="flex items-center justify-center gap-6 mt-2">
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-black border-4 border-white rounded-full flex items-center justify-center hover:bg-gray-800 transition"
                >
                  <div className="w-10 h-10 bg-white rounded-full" />
                </button>

                {hasMultipleCameras && (
                  <button
                    onClick={switchCamera}
                    className="p-4 rounded-full bg-gray-600 hover:bg-gray-300 transition"
                    title="Switch Camera"
                  >
                    <RefreshCcw className="w-6 h-6 text-gray-800" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= Fixed Footer ================= */}
      {capturedImage && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 px-20 py-4 shadow-lg z-50">
          <div className="flex items-center justify-end gap-4 w-full max-w-6xl mx-auto">
            <Button
              onClick={retakePhoto}
              variant="outline"
              className="px-8 py-3 border border-black text-[#363F5E] rounded-full"
            >
              Retake
            </Button>

            <Button
              onClick={submitPhoto}
              disabled={isLoading}
              className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      )}

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ActivitySelfie;
