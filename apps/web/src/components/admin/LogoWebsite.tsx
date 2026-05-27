import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "./ThemeProvider";
import { settingsService } from "@/services/api";
import { getImageUrl } from "@/lib/adminUtils";


const LogoWebsite = () => {
     const { theme } = useTheme(); // or just: const theme = useTheme();
    // console.log(theme);
    const [logoUrl, setLogoUrl] = useState<string>("");
    const [logoDarkUrl, setLogoDarkUrl] = useState<string>("");
    const [effectiveTheme, setEffectiveTheme] = useState<'light'|'dark'>('light');

    useEffect(() => {
        if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setEffectiveTheme(isDark ? 'dark' : 'light');
        } else {
            setEffectiveTheme(theme);
        }
    }, [theme]);

     useEffect(() => {
        const fetchLogo = async () => {
            try {
                const data = await settingsService.getSeo('logo');
                if (data) {
                    setLogoUrl(data.logoUrl || "");
                    setLogoDarkUrl(data.logoDarkUrl || "");
                }
            } catch (error) {
                console.error("Failed to fetch logo", error);
            }
        };
        fetchLogo();
     }, []);

    // width=400 gives a crisp 2x render at the ~190px display width (retina).
    const lightLogo = "https://api.builder.io/api/v1/image/assets/TEMP/ef12e49186360c5f295a30497de96e3fcb05f7d8?width=400"; // Black text
    const darkLogo = "https://api.builder.io/api/v1/image/assets/TEMP/871bfcdbcdbc969135e889b258ef410c6bcc2658?width=400"; // White text
    
    // Background White (light theme) -> Black Logo (logoUrl)
    // Background Black (dark theme) -> White Logo (logoDarkUrl)
    let logoSrc;
    if (effectiveTheme === 'light') {
        logoSrc = logoUrl ? getImageUrl(logoUrl) : lightLogo;
    } else {
        logoSrc = logoDarkUrl ? getImageUrl(logoDarkUrl) : darkLogo;
    }
    
  return (
    <Link to={"/"} className="inline-flex items-center">
      {/* Size by height, let width scale to preserve the logo's aspect ratio.
          object-left keeps it flush with the sidebar's left padding instead
          of floating centered in a too-narrow box. */}
      <img
        src={logoSrc}
        alt="Travel Homes Logo"
        className="h-12 w-auto max-w-[190px] object-contain object-left"
      />
    </Link>
  );
};

export default LogoWebsite;
