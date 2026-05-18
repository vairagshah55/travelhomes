import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

const FALLBACK_GRADIENTS: Record<string, string> = {
  delhi:   "from-orange-800 to-amber-600",
  kolkata: "from-teal-800 to-emerald-600",
  bombay:  "from-blue-800 to-indigo-600",
  mumbai:  "from-blue-800 to-indigo-600",
  kerala:  "from-green-800 to-lime-600",
};

function DestinationCard({
  image,
  title,
  className = "",
}: {
  image: string;
  title: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const gradientKey = title.toLowerCase();
  const gradient = FALLBACK_GRADIENTS[gradientKey] ?? "from-gray-700 to-gray-500";

  return (
    <div className={`relative rounded-2xl overflow-hidden group cursor-pointer ${className}`}>
      {!imgError ? (
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute bottom-4 left-4">
        <h3 className="text-white text-2xl md:text-3xl font-semibold">{title}</h3>
      </div>
      <div className="absolute top-4 right-4">
        <div className="w-11 h-11 bg-white/12 backdrop-blur-[12px] rounded-full flex items-center justify-center">
          <ArrowRight className="w-5 h-5 text-white transform rotate-[-35deg]" />
        </div>
      </div>
    </div>
  );
}

export default DestinationCard;
