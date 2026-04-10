import React from "react";

interface FullPageLoaderProps {
  fullPage?: boolean;
  message?: string;
}

const FullPageLoader: React.FC<FullPageLoaderProps> = ({ 
  fullPage = true, 
  message = "Loading..." 
}) => {
  const containerClasses = fullPage 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
    : "flex items-center justify-center w-full h-full min-h-[400px] bg-transparent";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};





interface InlineLoaderProps {
  size?: number; // diameter of spinner
  text?: string;
}

const InlineLoader: React.FC<InlineLoaderProps> = ({ size = 24, text }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <div
        className="border-4 border-t-blue-500 border-gray-300 rounded-full animate-spin"
        style={{ width: size, height: size }}
      ></div>
      {text && <span className="text-gray-700 dark:text-gray-200">{text}</span>}
    </div>
  );
};


export default FullPageLoader;