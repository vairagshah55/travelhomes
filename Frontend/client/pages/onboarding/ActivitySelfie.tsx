import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';

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
        audio: false 
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
      tracks.forEach(track => track.stop());
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
        
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
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
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    
    toast.success('Verification submitted successfully!');
    navigate('/onboarding/complete');
  };

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

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
      <div className="flex-1 px-25 py-8">
        <div className="flex flex-col items-center gap-8 min-h-[600px] w-full max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-black dark:text-white text-center">
            Verification
          </h1>
          
          <div className="flex flex-col items-center gap-7 w-full max-w-3xl">
            {/* Camera/Photo Display */}
            <div className="relative w-full max-w-2xl h-96 bg-gray-100 rounded-lg overflow-hidden">
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
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {!isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <Camera className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Capture Button */}
            {!capturedImage && isStreaming && (
              <div className="flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-18 h-18 bg-black border-2 border-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-white rounded-full"></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Action Buttons */}
      {capturedImage && (
        <div className="border-t border-gray-100 bg-white px-20 py-6 shadow-sm">
          <div className="flex items-center justify-end gap-3 w-full max-w-6xl mx-auto">
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
              className="px-8 py-3 dark:border dark:border-white bg-black text-white rounded-full hover:bg-gray-800"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      )}

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ActivitySelfie;
