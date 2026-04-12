import React, { useState, useEffect } from "react";
import { GoChevronLeft } from "react-icons/go";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { getOnboardingData, cmsPublicApi } from "../../lib/api";

// ─── Brand tokens ────────────────────────────────────────────────────────────
const TEAL        = "#07e4e4";
const TEAL_DARK   = "#05c4c4";
const TEAL_BG     = "rgba(7, 228, 228, 0.07)";
const TEAL_GLOW   = "rgba(7, 228, 228, 0.18)";
const TEAL_BORDER = "rgba(7, 228, 228, 0.35)";
const BLACK       = "#131313";
const GRAY_600    = "#555555";
const GRAY_400    = "#9a9a9a";
const GRAY_200    = "#e8e8e8";
const GRAY_100    = "#f5f5f5";
const WHITE       = "#ffffff";

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
  const [selectedService, setSelectedService] = useState<ServiceType | null>("caravan");
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    "camper-van": true,
    "unique-stays": true,
    "best-activity": true,
  });
  const [hasPendingApplication, setHasPendingApplication] = useState(false);
  const [pendingServiceType, setPendingServiceType] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<any>(null);
  const [showError, setShowError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    const checkPendingApp = async () => {
      try {
        const data = await getOnboardingData();
        if (data && data.doc && data.doc.status === "pending") {
          setHasPendingApplication(true);
          setPendingServiceType(data.type);
          setPendingData(data.doc);
        } else {
          setHasPendingApplication(false);
          setPendingServiceType(null);
          setPendingData(null);
        }
      } catch (e) {
        console.error("Failed to check onboarding status", e);
        setHasPendingApplication(false);
        setPendingServiceType(null);
        setPendingData(null);
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
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const serviceMap: Record<string, string> = {
      caravan: "camper-van",
      stay: "unique-stays",
      activity: "best-activity",
    };
    if (selectedService && visibleSections[serviceMap[selectedService]] === false) {
      const availableService = Object.keys(serviceMap).find(
        (key) => visibleSections[serviceMap[key]] !== false
      );
      setSelectedService(availableService ? (availableService as ServiceType) : null);
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
      toast.error("Your vendor application is pending approval. You cannot create a new service.");
      return;
    }
    if (!selectedService) {
      setShowError(true);
      setShakeKey(k => k + 1);
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

  const visibleServices: ServiceType[] = (["caravan", "stay", "activity"] as ServiceType[]).filter((s) => {
    const keyMap: Record<ServiceType, string> = {
      caravan: "camper-van",
      stay: "unique-stays",
      activity: "best-activity",
    };
    return visibleSections[keyMap[s]] !== false;
  });

  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: WHITE, color: BLACK }}>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{
          height: 64,
          padding: "0 48px",
          backgroundColor: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${GRAY_200}`,
        }}
      >
        <img
          src="https://travelhomes.in/wp-content/uploads/2022/03/th-logo.png"
          srcSet="https://travelhomes.in/wp-content/uploads/2022/03/th-logo-300x209.png 300w, https://travelhomes.in/wp-content/uploads/2022/03/th-logo.png 384w"
          sizes="(max-width: 300px) 300px, 384px"
          alt="TravelHomes"
          className="h-9 w-auto object-contain"
          draggable={false}
        />

        {/* Step progress */}
        <div className="hidden sm:flex items-center gap-2">
          {[
            { n: 1, label: "Select Service", done: true },
            { n: 2, label: "Details", done: false },
            { n: 3, label: "Verify", done: false },
          ].map((step, i) => (
            <React.Fragment key={step.n}>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center text-[11px] font-bold"
                  style={{
                    width: 26, height: 26, borderRadius: "50%",
                    backgroundColor: step.done ? TEAL : GRAY_100,
                    color: step.done ? BLACK : GRAY_400,
                    transition: "all 0.2s",
                  }}
                >
                  {step.done ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke={BLACK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : step.n}
                </div>
                <span
                  className="text-[12px] whitespace-nowrap"
                  style={{
                    fontWeight: step.done ? 600 : 400,
                    color: step.done ? BLACK : GRAY_400,
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < 2 && (
                <div style={{ width: 28, height: 1, backgroundColor: GRAY_200 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* ─── Main ────────────────────────────────────────────────────────────── */}
      <div
        className="w-full max-w-7xl mx-auto flex max-lg:flex-col items-stretch min-h-screen"
        style={{ paddingTop: 64, paddingLeft: 48, paddingRight: 48 }}
      >
        {/* ── Left ── */}
        <div
          className="w-full lg:w-[55%] flex flex-col justify-center py-12 lg:pr-16"
        >
          {/* Back */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 w-fit mb-10 transition-colors"
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontSize: 13, fontWeight: 500, color: GRAY_400,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = BLACK)}
            onMouseLeave={e => (e.currentTarget.style.color = GRAY_400)}
          >
            <GoChevronLeft size={17} />
            Back to home
          </button>

          {/* Step label */}
          <div className="flex items-center gap-2.5 mb-5">
            <div style={{ width: 32, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: GRAY_400 }}>
              Step 1 of 3
            </span>
          </div>

          {/* Heading */}
          <h1
            className="mb-3"
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 800,
              color: BLACK,
              lineHeight: 1.12,
              letterSpacing: "-0.025em",
            }}
          >
            Which service are
            <br className="hidden sm:block" /> you offering?
          </h1>
          <p className="mb-10" style={{ fontSize: 15, color: GRAY_600, lineHeight: 1.65, maxWidth: 420 }}>
            Choose the type of listing you'd like to add to TravelHomes.
            You can always expand your offerings later.
          </p>

          {/* ── Pending application banner ── */}
          {hasPendingApplication && pendingData && (
            <div
              className="mb-8 p-5 rounded-2xl flex items-start gap-3"
              style={{
                backgroundColor: "#fffbeb",
                border: "1.5px solid #fcd34d",
              }}
            >
              <span className="text-xl mt-0.5">⏳</span>
              <div className="flex-1">
                <h3 className="font-semibold text-sm" style={{ color: "#92400e" }}>
                  Your {pendingServiceType ? SERVICE_META[pendingServiceType as ServiceType]?.title : "listing"} is under review
                </h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#b45309" }}>
                  Submitted{" "}
                  {new Date(pendingData.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                  . Our team will review within 24–48 hours.
                </p>
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full mt-3"
                  style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: "#f59e0b" }}
                  />
                  Pending Review
                </span>
              </div>
            </div>
          )}

          {/* ── Service cards ── */}
          <div className="flex flex-col gap-3 mb-6">
            {visibleServices.map((service, index) => (
              <div
                key={service}
                className="ss-card-enter"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <ServiceCard
                  service={service}
                  title={SERVICE_META[service].title}
                  description={SERVICE_META[service].description}
                  tag={SERVICE_META[service].tag}
                  icon={SERVICE_ICONS[service]}
                  active={selectedService === service}
                  onClick={() => { setSelectedService(service); setShowError(false); }}
                />
              </div>
            ))}
          </div>

          {/* Validation error */}
          {showError && !selectedService && (
            <div className="flex items-center gap-2 mb-4">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M7 4.5v2.5M7 9h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 500 }}>
                Please select a service to continue
              </p>
            </div>
          )}

          {/* ── CTA ── */}
          <button
            key={shakeKey}
            onClick={handleContinue}
            className={`ss-cta-btn flex items-center justify-center gap-2${showError && !selectedService ? " ss-cta-shake" : ""}`}
            style={{
              height: 52,
              padding: "0 44px",
              borderRadius: 99,
              border: "none",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              backgroundColor: TEAL,
              color: BLACK,
              boxShadow: `0 8px 28px ${TEAL_GLOW}`,
              width: "fit-content",
            }}
          >
            Continue
            <svg
              width="17" height="17" viewBox="0 0 17 17" fill="none"
              className="ss-cta-arrow"
            >
              <path
                d="M6.5 4.5l4.5 4-4.5 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* ── Right — Illustration ── */}
        <div className="hidden lg:flex lg:w-[45%] items-center justify-center relative">
          {/* Teal glow blob */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 440, height: 440,
              borderRadius: "50%",
              backgroundColor: TEAL,
              opacity: 0.07,
              filter: "blur(90px)",
            }}
          />
          {/* Secondary glow — offset */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 220, height: 220,
              top: "25%", right: "10%",
              borderRadius: "50%",
              backgroundColor: TEAL,
              opacity: 0.05,
              filter: "blur(60px)",
            }}
          />

          {/* Illustration */}
          <img
            key={selectedService}
            src={getIllustrationImage()}
            alt="Service illustration"
            className="ss-img-fade relative z-10"
            style={{ width: 420, height: 420, objectFit: "contain" }}
          />

          {/* Floating badge — bottom left */}
          <div
            className="absolute z-20 ss-badge-enter"
            style={{ bottom: 80, left: 12, animationDelay: "350ms" }}
          >
            <div
              className="flex items-center gap-3"
              style={{
                backgroundColor: WHITE,
                borderRadius: 14,
                padding: "11px 16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.09)",
                border: `1px solid ${GRAY_200}`,
              }}
            >
              <span style={{ fontSize: 18 }}>🛡️</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: BLACK }}>Verified Hosts</p>
                <p style={{ fontSize: 10, color: GRAY_400 }}>Identity verified</p>
              </div>
            </div>
          </div>

          {/* Floating badge — top right */}
          <div
            className="absolute z-20 ss-badge-enter"
            style={{ top: 100, right: 12, animationDelay: "500ms" }}
          >
            <div
              className="flex items-center gap-3"
              style={{
                backgroundColor: WHITE,
                borderRadius: 14,
                padding: "11px 16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.09)",
                border: `1px solid ${GRAY_200}`,
              }}
            >
              <span style={{ fontSize: 18 }}>⚡</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: BLACK }}>Quick Setup</p>
                <p style={{ fontSize: 10, color: GRAY_400 }}>List in minutes</p>
              </div>
            </div>
          </div>

          {/* Teal accent dot pattern */}
          <div
            className="absolute bottom-32 right-8 pointer-events-none"
            style={{ opacity: 0.35 }}
          >
            <DotGrid />
          </div>
        </div>
      </div>

      <style>{`
        /* Card entrance */
        @keyframes ssCardEnter {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ss-card-enter {
          animation: ssCardEnter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Badge entrance */
        @keyframes ssBadgeEnter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ss-badge-enter {
          animation: ssBadgeEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Illustration fade + scale */
        @keyframes ssImgFade {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .ss-img-fade {
          animation: ssImgFade 0.4s ease-out both;
        }

        /* CTA button hover */
        .ss-cta-btn {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .ss-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px ${TEAL_GLOW} !important;
        }
        .ss-cta-btn:active {
          transform: translateY(0);
        }
        .ss-cta-btn:hover .ss-cta-arrow {
          transform: translateX(3px);
        }
        .ss-cta-arrow {
          transition: transform 0.18s ease;
        }
        /* Shake on validation error */
        @keyframes ssCTAShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .ss-cta-shake {
          animation: ssCTAShake 0.35s ease both;
        }
      `}</style>
    </div>
  );
};

/* ─── Dot grid decoration ────────────────────────────────────────────────── */
const DotGrid = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
    {[0, 18, 36, 54].map(cy =>
      [0, 18, 36, 54].map(cx => (
        <circle key={`${cx}-${cy}`} cx={cx + 6} cy={cy + 6} r="2.5" fill={TEAL} />
      ))
    )}
  </svg>
);

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const SERVICE_ICONS: Record<ServiceType, React.ReactNode> = {
  caravan: (
    <svg width="26" height="26" viewBox="0 0 72 72" fill="none">
      <path
        d="M20.2775 27.0794H17.079L14.833 31.6976H18.044M20.2775 27.0794L18.044 31.6976M20.2775 27.0794H20.1058H25.5673V31.6976H17.8598H18.044M20.9316 23.3385H56.4155C59.2758 23.3385 62.1639 25.6925 62.3676 29.041C62.3829 29.2921 62.3994 29.5414 62.4368 29.7903C62.606 30.9167 63.0833 34.3846 62.9874 37.0871C62.876 40.227 62.0026 45.0718 62.0026 45.0718H60.0586C60.0586 45.0718 59.507 42.6731 56.29 41.6713H49.1697C47.4599 42.3193 47.0788 43.4698 46.5027 45.0718H26.4908C26.4908 41.9787 23.4471 39.9396 20.9306 39.9396C18.414 39.9396 15.1787 42.1225 15.1787 45.0718H11.4467C4.8038 45.0718 13.696 27.6599 14.5791 26.1849L15.0134 25.5415H13.2876C13.6875 24.6675 14.5791 23.3497 20.9316 23.3385ZM23.7519 45.7797C23.7519 47.3713 22.4616 48.6616 20.8701 48.6616C19.2785 48.6616 17.9882 47.3713 17.9882 45.7797C17.9882 44.1881 19.2785 42.8979 20.8701 42.8979C22.4616 42.8979 23.7519 44.1881 23.7519 45.7797ZM55.9582 45.7797C55.9582 47.3713 54.668 48.6616 53.0764 48.6616C51.4848 48.6616 50.1945 47.3713 50.1945 45.7797C50.1945 44.1881 51.4848 42.8979 53.0764 42.8979C54.668 42.8979 55.9582 44.1881 55.9582 45.7797ZM28.7488 27.0794H33.367V31.6976H28.7488V27.0794ZM36.551 27.0794H41.1691V31.6976H36.551V27.0794ZM44.3508 27.0794H48.969V31.6976H44.3508V27.0794ZM52.1507 27.0794H56.7688V31.6976H52.1507V27.0794Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  ),
  stay: (
    <svg width="26" height="26" viewBox="0 0 72 72" fill="none">
      <path
        d="M9 51.0452V47.9745H10.2502L16.0895 39.0683M16.0895 39.0683C15.2047 41.9588 14.1578 44.9775 14.1578 47.9745L25.0808 52.1792H46.0121L57.5009 47.9745C57.5009 45.0245 56.5095 41.9955 55.5063 39.0683M16.0895 39.0683C19.2925 28.6048 27.04 19.8208 35.3485 19.8208C43.5963 19.8208 51.9944 28.8209 55.5063 39.0683M63 51.0452V47.9745H61.7498L55.5063 39.0683M31.4164 29.5564H35.1256C38.2921 29.5564 39.9162 30.8351 40.767 33.8851L44.1476 44.6971C44.5658 46.1962 43.4386 47.1449 41.8823 47.1449H29.62C28.0918 47.1449 26.9695 46.2461 27.3374 44.7628L31.4164 29.5564Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  ),
  activity: (
    <svg width="26" height="26" viewBox="0 0 72 72" fill="none">
      <path
        d="M22.323 42.9009H21.2793C20.0367 42.9009 19.0293 41.8936 19.0293 40.6509L19.0293 27.4377C19.0293 26.195 20.0367 25.1877 21.2793 25.1877H22.323M49.6768 25.2886H50.7205C51.9631 25.2886 52.9705 26.296 52.9705 27.5386V40.7519C52.9705 41.9945 51.9631 43.0019 50.7205 43.0019H49.6768M49.6768 43.0019V25.9768V24.3978C49.6768 23.5217 49.1759 22.7624 48.4449 22.3909M49.6768 43.0019V47.6C49.6768 48.403 49.2561 49.1077 48.6232 49.5059M23.5539 22.3913C22.8234 22.7631 22.323 23.522 22.323 24.3978V25.9775V43.0012V47.6C22.323 48.4025 22.7432 49.1069 23.3755 49.5052M23.5539 22.3913C24.0984 24.2641 25.8271 25.6327 27.8755 25.6327H44.1232C46.1718 25.6327 47.9006 24.2638 48.4449 22.3909M23.5539 22.3913C23.4378 21.9919 23.3755 21.5696 23.3755 21.1327V15.3803C23.3755 14.1376 24.3829 13.1303 25.6255 13.1303H46.3732C47.6158 13.1303 48.6232 14.1376 48.6232 15.3803V21.1327C48.6232 21.5694 48.561 21.9916 48.4449 22.3909M48.6232 49.5059V49.338C48.6232 48.0954 47.6158 47.088 46.3732 47.088H25.6255C24.3829 47.088 23.3755 48.0954 23.3755 49.338V49.5052M48.6232 49.5059V56.6197C48.6232 57.8624 47.6158 58.8697 46.3732 58.8697H25.6255C24.3829 58.8697 23.3755 57.8624 23.3755 56.6197V49.5052M29.084 20.8405V33.7384M42.4719 20.8405V33.7384M40.2441 44.5138V49.7389M31.7537 44.5138V49.7389M28.9379 19.151C29.2468 20.2135 30.2276 20.99 31.3897 20.99H40.6078C41.77 20.99 42.7509 20.2134 43.0597 19.1508"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  ),
};

/* ─── Service Card ───────────────────────────────────────────────────────── */
const ServiceCard = ({
  title, description, tag, icon, active, onClick,
}: {
  service: ServiceType;
  title: string;
  description: string;
  tag: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "17px 20px",
        borderRadius: 16,
        cursor: "pointer",
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
        border: active
          ? `2px solid ${TEAL}`
          : hovered
          ? `1.5px solid ${TEAL_BORDER}`
          : `1.5px solid ${GRAY_200}`,
        backgroundColor: active
          ? TEAL_BG
          : hovered
          ? "rgba(7,228,228,0.025)"
          : WHITE,
        boxShadow: active
          ? `0 4px 24px ${TEAL_GLOW}`
          : hovered
          ? "0 2px 12px rgba(0,0,0,0.06)"
          : "0 1px 4px rgba(0,0,0,0.04)",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Active tag */}
      {active && tag && (
        <span
          style={{
            position: "absolute", top: 10, right: 10,
            fontSize: 9, fontWeight: 800, letterSpacing: "0.09em",
            textTransform: "uppercase",
            padding: "3px 9px",
            borderRadius: 99,
            backgroundColor: TEAL,
            color: BLACK,
          }}
        >
          {tag}
        </span>
      )}

      {/* Icon container */}
      <div
        style={{
          width: 50, height: 50,
          borderRadius: 14,
          flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: active ? TEAL : hovered ? "rgba(7,228,228,0.1)" : GRAY_100,
          color: active ? BLACK : hovered ? TEAL : GRAY_400,
          transition: "all 0.2s",
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: BLACK,
            marginBottom: 4,
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: active ? GRAY_600 : GRAY_400,
            margin: 0,
            transition: "color 0.2s",
          }}
        >
          {description}
        </p>
      </div>

      {/* Radio indicator */}
      <div style={{ flexShrink: 0, marginLeft: 4 }}>
        <div
          style={{
            width: 22, height: 22,
            borderRadius: "50%",
            border: active ? `2px solid ${TEAL}` : `2px solid ${GRAY_200}`,
            backgroundColor: active ? TEAL : WHITE,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {active && (
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M2 5.5L4.5 8L9 3"
                stroke={BLACK}
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
};

export default ServiceSelection;
