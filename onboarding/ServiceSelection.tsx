import React, { useState, useEffect } from "react";
import { GoChevronLeft } from "react-icons/go";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { getOnboardingData, cmsPublicApi } from "../../lib/api";

type ServiceType = "caravan" | "stay" | "activity";

const ServiceSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedService, setSelectedService] =
    useState<ServiceType | null>("caravan");
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    'camper-van': true,
    'unique-stays': true,
    'best-activity': true,
  });
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [pendingServiceType, setPendingServiceType] = useState<string | null>(null);

  useEffect(() => {
    const checkPendingApp = async () => {
      if (user?.vendorStatus === 'pending') {
        try {
          const data = await getOnboardingData();
          // Only treat as pending if there is an actual submission with 'pending' status
          if (data && data.doc && data.doc.status === 'pending') {
             setHasPendingApplication(true);
             setPendingServiceType(data.type);
          } else {
             setHasPendingApplication(false);
             setPendingServiceType(null);
          }
        } catch (e) {
          console.error("Failed to check onboarding status", e);
          setHasPendingApplication(false);
          setPendingServiceType(null);
        }
      } else {
        setHasPendingApplication(false);
        setPendingServiceType(null);
      }
    };
    checkPendingApp();
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const fetchSections = async () => {
      try {
        const sections = await cmsPublicApi.listHomepageSections();
        if (mounted && sections && sections.length > 0) {
          const nextState: Record<string, boolean> = {};
          sections.forEach((s: any) => {
             nextState[s.sectionKey] = s.isVisible;
          });
          setVisibleSections(prev => ({...prev, ...nextState}));
        }
      } catch (error) {
        console.error("Failed to load sections visibility", error);
      }
    };
    fetchSections();
    return () => { mounted = false; };
  }, []);

  // Update selected service if currently selected one is disabled
  useEffect(() => {
    const serviceMap: Record<string, string> = {
      'caravan': 'camper-van',
      'stay': 'unique-stays',
      'activity': 'best-activity'
    };

    if (selectedService && visibleSections[serviceMap[selectedService]] === false) {
      // Find first available service
      const availableService = Object.keys(serviceMap).find(key => visibleSections[serviceMap[key]] !== false);
      if (availableService) {
        setSelectedService(availableService as ServiceType);
      } else {
        setSelectedService(null);
      }
    }
  }, [visibleSections, selectedService]);

  useEffect(() => {
    if (user?.vendorStatus === 'rejected') {
      const checkPrevious = async () => {
        const data = await getOnboardingData();
        if (data?.type) {
          toast.info("Please update your rejected application");
          navigate(`/onboarding/${data.type}`);
        }
      };
      checkPrevious();
    }
  }, [user, navigate]);

  const handleBack = () => navigate("/");

  const handleContinue = () => {
    if (hasPendingApplication) {
      if (selectedService !== pendingServiceType) {
        toast.error("Your vendor application is pending approval. You cannot create a new service.");
        return;
      }
    }

    if (!selectedService) {
      toast.error("Please select a service to continue");
      return;
    }

    sessionStorage.setItem("onboardingType", selectedService);

    if (selectedService === "activity") {
      sessionStorage.setItem("activityID", "activity1");
      sessionStorage.setItem("id", "activity1");
    } else if (selectedService === "caravan") {
      sessionStorage.setItem("camperVanID", "camperVan2");
      sessionStorage.setItem("id", "camperVan2");
    } else {
      sessionStorage.setItem("stayID", "stay3");
      sessionStorage.setItem("id", "stay3");
    }

    navigate(`/onboarding/${selectedService}`);
  };

  const getIllustrationImage = () => {
    if (selectedService === "stay")
      return "https://api.builder.io/api/v1/image/assets/TEMP/8e762f2f0679274541ddec18f7f1325791c712e7";
    if (selectedService === "activity")
      return "https://api.builder.io/api/v1/image/assets/TEMP/ac3af7014c1557f3fdf25509200649edd541b7e3";
    return "https://api.builder.io/api/v1/image/assets/TEMP/b0d5bf84a04251328fd3565624ad1b2b09a5cd43";
  };

  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-gray-900 flex items-center justify-center px-4 lg:px-16">
      <div className="w-full h-full max-w-[1280px] flex max-lg:flex-col items-center justify-between gap-6">

        {/* LEFT */}
        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center gap-5">

          {/* HEADER */}
          <div>
            <button
              onClick={handleBack}
              className="flex  text-sm font-medium text-black dark:text-white mb-2"
            >
         <GoChevronLeft size={18} className="mt-0.5"/>  Back
            </button>

            <h1 className="text-2xl lg:text-[28px] font-semibold text-black dark:text-white">
              Which service you are offering
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Let’s get you set up so you can access your account
            </p>
          </div>

          {/* OPTIONS */}
          <div className="flex flex-col gap-3 max-h-[60vh]">

            {/* CARAVAN */}
            {visibleSections['camper-van'] !== false && (
            <ServiceCard
              title="Caravan Rental"
              active={selectedService === "caravan"}
              onClick={() => setSelectedService("caravan")}
              icon={
               <svg 
                      width="72" 
                      height="72" 
                      viewBox="0 0 72 72" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0 p-1 max-sm:w-12"
                    >
                      <path 
                        d="M20.2775 27.0794H17.079L14.833 31.6976H18.044M20.2775 27.0794L18.044 31.6976M20.2775 27.0794H20.1058H25.5673V31.6976H17.8598H18.044M20.9316 23.3385H56.4155C59.2758 23.3385 62.1639 25.6925 62.3676 29.041C62.3829 29.2921 62.3994 29.5414 62.4368 29.7903C62.606 30.9167 63.0833 34.3846 62.9874 37.0871C62.876 40.227 62.0026 45.0718 62.0026 45.0718H60.0586C60.0586 45.0718 59.507 42.6731 56.29 41.6713H49.1697C47.4599 42.3193 47.0788 43.4698 46.5027 45.0718H26.4908C26.4908 41.9787 23.4471 39.9396 20.9306 39.9396C18.414 39.9396 15.1787 42.1225 15.1787 45.0718H11.4467C4.8038 45.0718 13.696 27.6599 14.5791 26.1849L15.0134 25.5415H13.2876C13.6875 24.6675 14.5791 23.3497 20.9316 23.3385ZM23.7519 45.7797C23.7519 47.3713 22.4616 48.6616 20.8701 48.6616C19.2785 48.6616 17.9882 47.3713 17.9882 45.7797C17.9882 44.1881 19.2785 42.8979 20.8701 42.8979C22.4616 42.8979 23.7519 44.1881 23.7519 45.7797ZM55.9582 45.7797C55.9582 47.3713 54.668 48.6616 53.0764 48.6616C51.4848 48.6616 50.1945 47.3713 50.1945 45.7797C50.1945 44.1881 51.4848 42.8979 53.0764 42.8979C54.668 42.8979 55.9582 44.1881 55.9582 45.7797ZM28.7488 27.0794H33.367V31.6976H28.7488V27.0794ZM36.551 27.0794H41.1691V31.6976H36.551V27.0794ZM44.3508 27.0794H48.969V31.6976H44.3508V27.0794ZM52.1507 27.0794H56.7688V31.6976H52.1507V27.0794Z" 
                        stroke="#353535" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
              }
               rightElement={
    selectedService === "caravan" ? (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect
          x="0.6"
          y="0.6"
          width="22.8"
          height="22.8"
          rx="11.4"
          fill="white"
          stroke="black"
          strokeWidth="1.2"
        />
        <circle cx="12" cy="12" r="4.8" fill="black" />
      </svg>
    ) : (
      <div className="w-6 h-6 rounded-full border border-gray-400" />
    )
  }
            />
            )}

            {/* STAY */}
            {visibleSections['unique-stays'] !== false && (
            <ServiceCard
              title="Stays"
              active={selectedService === "stay"}
              onClick={() => setSelectedService("stay")}
              icon={
                 <svg 
                      width="72" 
                      height="72" 
                      viewBox="0 0 72 72" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0 p-1 max-sm:w-12"
                    >
                      <path 
                        d="M9 51.0452V47.9745H10.2502L16.0895 39.0683M16.0895 39.0683C15.2047 41.9588 14.1578 44.9775 14.1578 47.9745L25.0808 52.1792H46.0121L57.5009 47.9745C57.5009 45.0245 56.5095 41.9955 55.5063 39.0683M16.0895 39.0683C19.2925 28.6048 27.04 19.8208 35.3485 19.8208C43.5963 19.8208 51.9944 28.8209 55.5063 39.0683M63 51.0452V47.9745H61.7498L55.5063 39.0683M31.4164 29.5564H35.1256C38.2921 29.5564 39.9162 30.8351 40.767 33.8851L44.1476 44.6971C44.5658 46.1962 43.4386 47.1449 41.8823 47.1449H29.62C28.0918 47.1449 26.9695 46.2461 27.3374 44.7628L31.4164 29.5564Z" 
                        stroke="#353535" 
                        strokeWidth={selectedService === 'stay' ? "2" : "1.6875"} 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
              }
               rightElement={
    selectedService === "stay" ? (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect
          x="0.6"
          y="0.6"
          width="22.8"
          height="22.8"
          rx="11.4"
          fill="white"
          stroke="black"
          strokeWidth="1.2"
        />
        <circle cx="12" cy="12" r="4.8" fill="black" />
      </svg>
    ) : (
      <div className="w-6 h-6 rounded-full border border-gray-400" />
    )
  }
            />
            )}

            {/* ACTIVITY */}
           {visibleSections['best-activity'] !== false && (
           <ServiceCard
  title="Activity"
  active={selectedService === "activity"}
  onClick={() => setSelectedService("activity")}
  icon={
   <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 p-1 max-sm:w-12" > <path d="M22.323 42.9009H21.2793C20.0367 42.9009 19.0293 41.8936 19.0293 40.6509L19.0293 27.4377C19.0293 26.195 20.0367 25.1877 21.2793 25.1877H22.323M49.6768 25.2886H50.7205C51.9631 25.2886 52.9705 26.296 52.9705 27.5386V40.7519C52.9705 41.9945 51.9631 43.0019 50.7205 43.0019H49.6768M49.6768 43.0019V25.9768V24.3978C49.6768 23.5217 49.1759 22.7624 48.4449 22.3909M49.6768 43.0019V47.6C49.6768 48.403 49.2561 49.1077 48.6232 49.5059M23.5539 22.3913C22.8234 22.7631 22.323 23.522 22.323 24.3978V25.9775V43.0012V47.6C22.323 48.4025 22.7432 49.1069 23.3755 49.5052M23.5539 22.3913C24.0984 24.2641 25.8271 25.6327 27.8755 25.6327H44.1232C46.1718 25.6327 47.9006 24.2638 48.4449 22.3909M23.5539 22.3913C23.4378 21.9919 23.3755 21.5696 23.3755 21.1327V15.3803C23.3755 14.1376 24.3829 13.1303 25.6255 13.1303H46.3732C47.6158 13.1303 48.6232 14.1376 48.6232 15.3803V21.1327C48.6232 21.5694 48.561 21.9916 48.4449 22.3909M48.6232 49.5059V49.338C48.6232 48.0954 47.6158 47.088 46.3732 47.088H25.6255C24.3829 47.088 23.3755 48.0954 23.3755 49.338V49.5052M48.6232 49.5059V56.6197C48.6232 57.8624 47.6158 58.8697 46.3732 58.8697H25.6255C24.3829 58.8697 23.3755 57.8624 23.3755 56.6197V49.5052M29.084 20.8405V33.7384M42.4719 20.8405V33.7384M40.2441 44.5138V49.7389M31.7537 44.5138V49.7389M28.9379 19.151C29.2468 20.2135 30.2276 20.99 31.3897 20.99H40.6078C41.77 20.99 42.7509 20.2134 43.0597 19.1508" stroke={selectedService === 'activity' ? 'black' : '#353535'} strokeWidth={selectedService === 'activity' ? "2" : "1.6875"} strokeLinecap="round" strokeLinejoin="round" /> </svg>
  }
  rightElement={
    selectedService === "activity" ? (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect
          x="0.6"
          y="0.6"
          width="20"
          height="22.8"
          rx="11.4"
          fill="white"
          stroke="black"
          strokeWidth="1.2"
        />
        <circle cx="12" cy="12" r="4.8" fill="black" />
      </svg>
    ) : (
      <div className="w-6 h-6 rounded-full border border-gray-400" />
    )
  }
/>
           )}

         
          </div>

          {/* BUTTON */}
          <button
            onClick={handleContinue}
            className="h-[48px] w-fit px-8 rounded-full bg-black text-white hover:bg-gray-800 transition"
          >
            Click here to continue
          </button>
        </div>

        {/* RIGHT IMAGE */}
        <div className="hidden lg:flex w-1/2 h-full items-center justify-center">
          <img
            src={getIllustrationImage()}
            alt="illustration"
            className="w-[420px] h-[420px] xl:w-[520px] xl:h-[520px] object-contain"
          />
        </div>
      </div>
    </div>
  );
};

/* REUSABLE CARD */
const   ServiceCard = ({
  title,
  icon,
  active,
  onClick,
  rightElement,
}: {
  title: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
   rightElement: React.ReactNode;
}) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-2 rounded-xl cursor-pointer transition-all
      ${
        active
          ? "border-2 border-black dark:border-white"
          : "border border-gray-300 dark:border-gray-600"
      }`}
  >
    <div className="flex items-center gap-4">
      <div className="text-black  dark:text-white">{icon}</div>
      <div className="gap-2">
        <h3 className="font-semibold text-lg text-black dark:text-white">{title}</h3>
        <p className=" text-gray-600 text-sm dark:text-gray-400">
          Lorem ipsum text for better UX
        </p>
      </div>
    </div>

     {rightElement}
  </div>
);

export default ServiceSelection;
 