import LogoWebsite, { HomeLogoWebsite } from "@/components/ui/LogoWebsite";
import React, { useEffect, useState } from "react";

// Vehicle types with their respective emojis and speeds
const VEHICLE_TYPES = [
  { type: "car", icon: "🚗", speed: 8 },
  { type: "truck", icon: "🚛", speed: 12 },
  { type: "bus", icon: "🚌", speed: 10 },
  { type: "bike", icon: "🏍️", speed: 6 },
  { type: "tractor", icon: "🚜", speed: 20 },
];

const Interchange = () => {
  const [vehicles, setVehicles] = useState([]);

  // Road paths (Simplified versions of the interchange loops)
  const paths = {
    horizontal: "M -100 250 L 1100 250",
    vertical: "M 500 -100 L 500 700",
    loopNW: "M 500 250 Q 350 250 350 100 Q 350 -50 500 -50",
    loopNE: "M 500 250 Q 650 250 650 100 Q 650 -50 500 -50",
    loopSW: "M 500 250 Q 350 250 350 400 Q 350 550 500 550",
    loopSE: "M 500 250 Q 650 250 650 400 Q 650 550 500 550",
  };

  useEffect(() => {
    // Generate random vehicles
    const interval = setInterval(() => {
      const type =
        VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
      const pathKeys = Object.keys(paths);
      const pathKey = pathKeys[Math.floor(Math.random() * pathKeys.length)];

      const newVehicle = {
        id: Date.now(),
        icon: type.icon,
        duration: type.speed + Math.random() * 5,
        path: paths[pathKey],
      };

      setVehicles((prev) => [...prev.slice(-20), newVehicle]); // Keep last 20 vehicles
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen bg-green-900 flex items-center justify-center overflow-hidden">
      <div className="absolute left-72 top-10 text-white text-center z-10">
        <div className="flex justify-center items-center w-20 h-20 max-w-60 max-h-60">
         <img src="https://api.builder.io/api/v1/image/assets/TEMP/871bfcdbcdbc969135e889b258ef410c6bcc2658?width=162" className="w-full h-full object-cover" alt="logo" />
        </div>
      </div>
      <div className="absolute right-72 top-10 text-white text-center z-10">
        <h1 className="text-5xl font-bold uppercase tracking-widest">404</h1>
        <p className="text-sm opacity-70">Page Not Found !</p>
        <a href="/" className="text-gray-500 hover:text-gray-700 bottom rounded-[10px] bg-white px-5 py-2 mt-5 inline-block">
          Return to Home
        </a>
      </div>

      <svg
        viewBox="0 0 1000 600"
        className="w-full h-full max-w-5xl shadow-2xl bg-gray-800 rounded-lg"
      >
        {/* Background Grass Textures */}
        <rect width="1000" height="600" fill="#2d5a27" />

        {/* Water bodies (from the image) */}
        <circle cx="400" cy="180" r="100" fill="#749DD8" />
        <circle cx="600" cy="180" r="100" fill="#749DD8" />
        <circle cx="400" cy="320" r="100" fill="#749DD8" />
        <circle cx="600" cy="320" r="110" fill="#749DD8" />

        {/* The Roads (Drawing the visual pavement) */}
        <g stroke="#4a5568" strokeWidth="30" fill="none" strokeLinecap="round">
          <path d={paths.horizontal} />
          <path d={paths.vertical} />
          <path d={paths.loopNW} />
          <path d={paths.loopNE} />
          <path d={paths.loopSW} />
          <path d={paths.loopSE} />
        </g>

        {/* Road Markings (White dashed lines) */}
        <g
          stroke="white"
          strokeWidth="1"
          fill="none"
          strokeDasharray="10,10"
          opacity="0.5"
        >
          <path d={paths.horizontal} />
          <path d={paths.vertical} />
          <path d={paths.loopNW} />
          <path d={paths.loopNE} />
          <path d={paths.loopSW} />
          <path d={paths.loopSE} />
        </g>

        {/* Animated Vehicles */}
        {vehicles.map((v) => (
          <text
            key={v.id}
            fontSize="24"
            style={{
              offsetPath: `path('${v.path}')`,
              animation: `move ${v.duration}s linear infinite`,
            }}
          >
            {v.icon}
          </text>
        ))}
      </svg>

      <style jsx>{`
        @keyframes move {
          from {
            offset-distance: 0%;
          }
          to {
            offset-distance: 100%;
          }
        }
        text {
          offset-rotate: auto 180deg;
          anchor-point: center;
        }
      `}</style>
    </div>
  );
};

export default Interchange;
