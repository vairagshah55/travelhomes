import React from "react";
import { Heart } from "lucide-react";
import { RiShareCircleFill } from "react-icons/ri";
import toast from "react-hot-toast";

interface ShareSaveButtonsProps {
  isAuthenticated: boolean;
  isFavorite: boolean;
  setIsFavorite: (v: boolean) => void;
  onShareClick: () => void;
  /** Called when an unauthenticated user clicks Save — typically opens the login modal. */
  onLoginRequired: () => void;
}

/**
 * Share + Save button pair shown next to the title on product detail pages.
 * Save toggles favorite state with a toast; guests are routed to the login
 * modal via `onLoginRequired` instead.
 */
export function ShareSaveButtons({
  isAuthenticated,
  isFavorite,
  setIsFavorite,
  onShareClick,
  onLoginRequired,
}: ShareSaveButtonsProps) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={onShareClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#14709F] transition-colors text-sm text-gray-700 dark:text-gray-300"
      >
        <RiShareCircleFill className="w-4 h-4 -rotate-45" />
        <span className="hidden sm:inline">Share</span>
      </button>
      <button
        onClick={() => {
          if (!isAuthenticated) {
            onLoginRequired();
            return;
          }
          setIsFavorite(!isFavorite);
          toast.success(isFavorite ? "Removed from favorites" : "Added to favorites!");
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 text-sm ${
          isFavorite
            ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#14709F] text-gray-700 dark:text-gray-300"
        }`}
      >
        <Heart
          className={`w-4 h-4 transition-all duration-300 ${
            isFavorite ? "fill-red-500 text-red-500 scale-110" : ""
          }`}
        />
        <span className="hidden sm:inline">{isFavorite ? "Saved" : "Save"}</span>
      </button>
    </div>
  );
}

export default ShareSaveButtons;
