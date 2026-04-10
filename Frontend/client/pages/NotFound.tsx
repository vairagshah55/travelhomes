import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import LogoWebsite from "@/components/ui/LogoWebsite";
import Interchange from "./raod";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Interchange />
    </div>
  </>
  );
};

export default NotFound;
