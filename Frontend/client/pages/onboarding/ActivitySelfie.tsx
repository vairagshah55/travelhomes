import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import LogoWebsite from '@/components/ui/LogoWebsite';

const ActivitySelfie = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const submitPhoto = async () => {
    if (!capturedImage) {
      toast.error('Please capture a photo first.');
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    toast.success('Verification submitted successfully!');
    navigate('/onboarding/complete', { state: { type: 'activity' } });
  };

  React.useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, [startCamera, stopCamera]);

  return (
    <div className="onboarding-layout h-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden">

      {/* Header */}
      <div className="flex h-14 w-full items-center justify-start px-6 lg:px-16 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <LogoWebsite />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center px-6 py-8 overflow-hidden pb-28">
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Identity Check
            </span>
            <h1 className="text-2xl lg:text-3xl font-semibold text-black dark:text-white text-center">
              Take a selfie to verify
            </h1>
          </div>

          {/* Camera / Preview */}
          <div className="relative w-full h-80 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured selfie" className="w-full h-full object-cover" />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <Camera className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Capture button */}
          {!capturedImage && isStreaming && (
            <button
              onClick={capturePhoto}
              className="w-16 h-16 border-4 border-white dark:border-gray-900 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{backgroundColor: 'var(--th-accent)'}}
            >
              <div className="w-9 h-9 bg-white rounded-full" />
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      {capturedImage && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-6 lg:px-16 py-4 z-50">
          <div className="flex items-center justify-end gap-3 max-w-4xl mx-auto w-full">
            <Button
              onClick={retakePhoto}
              variant="outline"
              className="h-11 px-8 text-sm border-gray-200 dark:border-gray-600 rounded-full hover:border-gray-400 transition-colors"
            >
              Retake
            </Button>
            <Button
              onClick={submitPhoto}
              disabled={isLoading}
              className="h-11 px-8 text-sm hover:brightness-110 font-semibold rounded-full transition-opacity disabled:opacity-50"
              style={{backgroundColor: 'var(--th-accent)', color: 'var(--th-accent-fg)'}}
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ActivitySelfie;
