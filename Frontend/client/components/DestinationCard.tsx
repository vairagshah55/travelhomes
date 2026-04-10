import React from "react";
import { ArrowRight } from "lucide-react";

function DestinationCard({
  image,
  title,
  className = "",
}: {
  image: string;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden group cursor-pointer ${className}`}
    >
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-4 left-4">
        <h3 className="text-white text-2xl md:text-3xl font-semibold">
          {title}
        </h3>
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
