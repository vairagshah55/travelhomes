import React, { useState, useEffect } from "react";
import { GoChevronLeft } from "react-icons/go";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { getOnboardingData, cmsPublicApi } from "../../lib/api";

type ServiceType = "caravan" | "stay" | "activity";

const SERVICE_META: Record<
  ServiceType,
  { title: string; description: string; tag: string }
> = {
  caravan: {
    title: "Caravan Rental",
    description:
      "Rent out your camper van or motorhome to adventure seekers looking for the open road.",
    tag: "Popular",
  },
  stay: {
    title: "Unique Stays",
    description:
      "Host travelers in your villa, cabin, farmhouse, or any unique accommodation space.",
    tag: "Trending",
  },
  activity: {
    title: "Activities & Experiences",
    description:
      "Guide outdoor adventures, tours, workshops, and unforgettable local experiences.",
    tag: "New",
  },
};

const ServiceSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    "caravan"
  );
  const [visibleSections, setVisibleSections] = useState<
    Record<string, boolean>
  >({
    "camper-van": true,
    "unique-stays": true,
    "best-activity": true,
  });
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [pendingServiceType, setPendingServiceType] = useState<string | null>(
    null
  );
  const [showError, setShowError] = useState(false);
  const [hoveredService, setHoveredService] = useState<ServiceType | null>(
    null
  );

  useEffect(() => {
    const checkPendingApp = async () => {
      if (user?.vendorStatus === "pending") {
        try {
          const data = await getOnboardingData();
          if (data && data.doc && data.doc.status === "pending") {
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
          setVisibleSections((prev) => ({ ...prev, ...nextState }));
        }
      } catch (error) {
        console.error("Failed to load sections visibility", error);
      }
    };
    fetchSections();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const serviceMap: Record<string, string> = {
      caravan: "camper-van",
      stay: "unique-stays",
      activity: "best-activity",
    };
    if (
      selectedService &&
      visibleSections[serviceMap[selectedService]] === false
    ) {
      const availableService = Object.keys(serviceMap).find(
        (key) => visibleSections[serviceMap[key]] !== false
      );
      setSelectedService(
        availableService ? (availableService as ServiceType) : null
      );
    }
  }, [visibleSections, selectedService]);

  useEffect(() => {
    if (user?.vendorStatus === "rejected") {
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
    if (hasPendingApplication && selectedService !== pendingServiceType) {
      toast.error(
        "Your vendor application is pending approval. You cannot create a new service."
      );
      return;
    }
    if (!selectedService) {
      setShowError(true);
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

  const visibleServices: ServiceType[] = (
    ["caravan", "stay", "activity"] as ServiceType[]
  ).filter((s) => {
    const keyMap: Record<ServiceType, string> = {
      caravan: "camper-van",
      stay: "unique-stays",
      activity: "best-activity",
    };
    return visibleSections[keyMap[s]] !== false;
  });

  return (
    <div className="onboarding-layout min-h-screen overflow-hidden bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="flex h-16 w-full z-30 fixed top-0 items-center justify-between px-6 lg:px-16 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <img
          src="https://travelhomes.in/wp-content/uploads/2022/03/th-logo.png"
          srcSet="https://travelhomes.in/wp-content/uploads/2022/03/th-logo-300x209.png 300w, https://travelhomes.in/wp-content/uploads/2022/03/th-logo.png 384w"
          sizes="(max-width: 300px) 300px, 384px"
          alt="TravelHomes Logo"
          className="h-10 w-auto object-contain"
          draggable={false}
        />
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: "var(--th-accent)" }}>1</span>
            <span className="font-medium" style={{ color: "var(--th-accent)" }}>Select Service</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">2</span>
            <span>Details</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">3</span>
            <span>Verify</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto flex max-lg:flex-col items-stretch min-h-screen pt-16 px-6 lg:px-16">
        {/* LEFT SIDE */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center py-10 lg:py-16 lg:pr-12">
          {/* Back */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-fit mb-8"
          >
            <GoChevronLeft size={18} />
            Back to home
          </button>

          {/* Heading */}
          <div className="flex flex-col gap-3 mb-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: "var(--th-accent)" }} />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
                Step 1 of 3
              </span>
            </div>
            <h1 className="text-3xl lg:text-[40px] font-bold text-gray-900 dark:text-white leading-[1.15] tracking-tight">
              Which service are{" "}
              <br className="hidden sm:block" />
              you offering?
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
              Choose the type of service you'd like to list on TravelHomes.
              You can always add more later.
            </p>
          </div>

          {/* Service Cards */}
          <div className="flex flex-col gap-3 mb-4">
            {visibleServices.map((service, index) => (
              <div
                key={service}
                onClick={() => {
                  setSelectedService(service);
                  setShowError(false);
                }}
                onMouseEnter={() => setHoveredService(service)}
                onMouseLeave={() => setHoveredService(null)}
                className="animate-fadeInUp"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <ServiceCard
                  service={service}
                  title={SERVICE_META[service].title}
                  description={SERVICE_META[service].description}
                  tag={SERVICE_META[service].tag}
                  active={selectedService === service}
                  hovered={hoveredService === service}
                  icon={SERVICE_ICONS[service]}
                />
              </div>
            ))}
          </div>

          {/* Validation error */}
          {showError && !selectedService && (
            <div className="flex items-center gap-2 mb-4 px-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5"/>
                <path d="M8 5v3M8 10.5v.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-sm text-red-500 font-medium">
                Please select a service to continue
              </p>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedService}
            className="group h-14 w-full sm:w-fit sm:px-12 rounded-full text-base font-semibold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              backgroundColor: "var(--th-accent)",
              color: "var(--th-accent-fg)",
              boxShadow: selectedService ? "0 4px 20px rgba(59, 217, 218, 0.25)" : "none",
            }}
          >
            Continue
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              <path
                d="M7 4.5l4.5 4.5L7 13.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* RIGHT SIDE — Illustration */}
        <div className="hidden lg:flex w-[45%] items-center justify-center relative">
          {/* Background decoration */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-[500px] h-[500px] rounded-full opacity-[0.07] blur-3xl"
              style={{ backgroundColor: "var(--th-accent)" }}
            />
          </div>
          <div
            className="absolute top-1/4 right-12 w-20 h-20 rounded-2xl rotate-12 opacity-[0.06]"
            style={{ backgroundColor: "var(--th-accent)" }}
          />
          <div
            className="absolute bottom-1/4 left-8 w-14 h-14 rounded-xl -rotate-12 opacity-[0.08]"
            style={{ backgroundColor: "var(--th-accent)" }}
          />

          {/* Main illustration */}
          <div className="relative">
            <div
              className="absolute -inset-6 rounded-[32px] opacity-10 blur-2xl"
              style={{ backgroundColor: "var(--th-accent)" }}
            />
            <img
              key={selectedService}
              src={getIllustrationImage()}
              alt="Service illustration"
              className="relative w-[420px] h-[420px] xl:w-[480px] xl:h-[480px] object-contain animate-fadeIn"
            />
          </div>

          {/* Floating trust badges */}
          <div className="absolute bottom-20 left-4 flex flex-col gap-2 animate-fadeInUp" style={{ animationDelay: "400ms" }}>
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2 border border-gray-100 dark:border-gray-700">
              <span className="text-lg">🛡️</span>
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Verified Hosts</p>
                <p className="text-[10px] text-gray-400">Identity verified</p>
              </div>
            </div>
          </div>
          <div className="absolute top-28 right-4 animate-fadeInUp" style={{ animationDelay: "600ms" }}>
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2 border border-gray-100 dark:border-gray-700">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Quick Setup</p>
                <p className="text-[10px] text-gray-400">List in minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out both;
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out both;
        }
      `}</style>
    </div>
  );
};

/* ─── Icons ──────────────────────────────────────────────────────── */

const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  caravan: (
    <svg
      width="28"
      height="28"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.2775 27.0794H17.079L14.833 31.6976H18.044M20.2775 27.0794L18.044 31.6976M20.2775 27.0794H20.1058H25.5673V31.6976H17.8598H18.044M20.9316 23.3385H56.4155C59.2758 23.3385 62.1639 25.6925 62.3676 29.041C62.3829 29.2921 62.3994 29.5414 62.4368 29.7903C62.606 30.9167 63.0833 34.3846 62.9874 37.0871C62.876 40.227 62.0026 45.0718 62.0026 45.0718H60.0586C60.0586 45.0718 59.507 42.6731 56.29 41.6713H49.1697C47.4599 42.3193 47.0788 43.4698 46.5027 45.0718H26.4908C26.4908 41.9787 23.4471 39.9396 20.9306 39.9396C18.414 39.9396 15.1787 42.1225 15.1787 45.0718H11.4467C4.8038 45.0718 13.696 27.6599 14.5791 26.1849L15.0134 25.5415H13.2876C13.6875 24.6675 14.5791 23.3497 20.9316 23.3385ZM23.7519 45.7797C23.7519 47.3713 22.4616 48.6616 20.8701 48.6616C19.2785 48.6616 17.9882 47.3713 17.9882 45.7797C17.9882 44.1881 19.2785 42.8979 20.8701 42.8979C22.4616 42.8979 23.7519 44.1881 23.7519 45.7797ZM55.9582 45.7797C55.9582 47.3713 54.668 48.6616 53.0764 48.6616C51.4848 48.6616 50.1945 47.3713 50.1945 45.7797C50.1945 44.1881 51.4848 42.8979 53.0764 42.8979C54.668 42.8979 55.9582 44.1881 55.9582 45.7797ZM28.7488 27.0794H33.367V31.6976H28.7488V27.0794ZM36.551 27.0794H41.1691V31.6976H36.551V27.0794ZM44.3508 27.0794H48.969V31.6976H44.3508V27.0794ZM52.1507 27.0794H56.7688V31.6976H52.1507V27.0794Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  stay: (
    <svg
      width="28"
      height="28"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 51.0452V47.9745H10.2502L16.0895 39.0683M16.0895 39.0683C15.2047 41.9588 14.1578 44.9775 14.1578 47.9745L25.0808 52.1792H46.0121L57.5009 47.9745C57.5009 45.0245 56.5095 41.9955 55.5063 39.0683M16.0895 39.0683C19.2925 28.6048 27.04 19.8208 35.3485 19.8208C43.5963 19.8208 51.9944 28.8209 55.5063 39.0683M63 51.0452V47.9745H61.7498L55.5063 39.0683M31.4164 29.5564H35.1256C38.2921 29.5564 39.9162 30.8351 40.767 33.8851L44.1476 44.6971C44.5658 46.1962 43.4386 47.1449 41.8823 47.1449H29.62C28.0918 47.1449 26.9695 46.2461 27.3374 44.7628L31.4164 29.5564Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  activity: (
    <svg
      width="28"
      height="28"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.323 42.9009H21.2793C20.0367 42.9009 19.0293 41.8936 19.0293 40.6509L19.0293 27.4377C19.0293 26.195 20.0367 25.1877 21.2793 25.1877H22.323M49.6768 25.2886H50.7205C51.9631 25.2886 52.9705 26.296 52.9705 27.5386V40.7519C52.9705 41.9945 51.9631 43.0019 50.7205 43.0019H49.6768M49.6768 43.0019V25.9768V24.3978C49.6768 23.5217 49.1759 22.7624 48.4449 22.3909M49.6768 43.0019V47.6C49.6768 48.403 49.2561 49.1077 48.6232 49.5059M23.5539 22.3913C22.8234 22.7631 22.323 23.522 22.323 24.3978V25.9775V43.0012V47.6C22.323 48.4025 22.7432 49.1069 23.3755 49.5052M23.5539 22.3913C24.0984 24.2641 25.8271 25.6327 27.8755 25.6327H44.1232C46.1718 25.6327 47.9006 24.2638 48.4449 22.3909M23.5539 22.3913C23.4378 21.9919 23.3755 21.5696 23.3755 21.1327V15.3803C23.3755 14.1376 24.3829 13.1303 25.6255 13.1303H46.3732C47.6158 13.1303 48.6232 14.1376 48.6232 15.3803V21.1327C48.6232 21.5694 48.561 21.9916 48.4449 22.3909M48.6232 49.5059V49.338C48.6232 48.0954 47.6158 47.088 46.3732 47.088H25.6255C24.3829 47.088 23.3755 48.0954 23.3755 49.338V49.5052M48.6232 49.5059V56.6197C48.6232 57.8624 47.6158 58.8697 46.3732 58.8697H25.6255C24.3829 58.8697 23.3755 57.8624 23.3755 56.6197V49.5052M29.084 20.8405V33.7384M42.4719 20.8405V33.7384M40.2441 44.5138V49.7389M31.7537 44.5138V49.7389M28.9379 19.151C29.2468 20.2135 30.2276 20.99 31.3897 20.99H40.6078C41.77 20.99 42.7509 20.2134 43.0597 19.1508"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* ─── Service Card ────────────────────────────────────────────────── */

const ServiceCard = ({
  title,
  description,
  tag,
  icon,
  active,
  hovered,
}: {
  service: ServiceType;
  title: string;
  description: string;
  tag: string;
  icon: React.ReactNode;
  active: boolean;
  hovered: boolean;
}) => (
  <div
    className={`group relative flex items-center gap-5 px-5 py-5 rounded-2xl cursor-pointer transition-all duration-300 select-none overflow-hidden
      ${
        active
          ? "border-2 shadow-md"
          : "border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
      }`}
    style={
      active
        ? {
            borderColor: "var(--th-accent)",
            backgroundColor: "var(--th-accent-subtle)",
            boxShadow: "0 4px 24px rgba(59, 217, 218, 0.12)",
          }
        : undefined
    }
  >
    {/* Accent glow on active */}
    {active && (
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ backgroundColor: "var(--th-accent)" }}
      />
    )}

    {/* Tag badge */}
    {tag && active && (
      <span
        className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
        style={{
          backgroundColor: "var(--th-accent)",
          color: "var(--th-accent-fg)",
        }}
      >
        {tag}
      </span>
    )}

    {/* Icon */}
    <div
      className={`relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
      ${
        active
          ? ""
          : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 group-hover:text-gray-600 dark:group-hover:text-gray-300"
      }`}
      style={
        active
          ? {
              backgroundColor: "var(--th-accent)",
              color: "var(--th-accent-fg)",
            }
          : undefined
      }
    >
      {icon}
    </div>

    {/* Text */}
    <div className="flex-1 min-w-0">
      <h3
        className={`font-bold text-base leading-tight transition-colors duration-200
        ${active ? "" : "text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white"}`}
        style={active ? { color: "var(--th-accent)" } : undefined}
      >
        {title}
      </h3>
      <p
        className={`text-sm mt-1 leading-relaxed transition-colors duration-200 ${
          active
            ? "text-gray-600 dark:text-gray-300"
            : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
        }`}
      >
        {description}
      </p>
    </div>

    {/* Custom radio */}
    <div className="flex-shrink-0 ml-1">
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
          active ? "" : "border-gray-300 dark:border-gray-600 group-hover:border-gray-400"
        }`}
        style={
          active
            ? { borderColor: "var(--th-accent)", backgroundColor: "var(--th-accent)" }
            : undefined
        }
      >
        {active && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="animate-fadeIn"
          >
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="var(--th-accent-fg)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  </div>
);

export default ServiceSelection;
