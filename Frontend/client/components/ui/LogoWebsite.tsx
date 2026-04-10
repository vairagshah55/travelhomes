import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from '../ThemeProvider'
import { useAuth } from "@/contexts/AuthContext";
import { settingsApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

const LogoWebsite = () => {
     const { theme } = useTheme(); // or just: const theme = useTheme();
    // console.log(theme);
    const { user } = useAuth();
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
                const res = await settingsApi.getSeo('logo');
                if (res.success && res.data) {
                    setLogoUrl(res.data.logoUrl || "");
                    setLogoDarkUrl(res.data.logoDarkUrl || "");
                }
            } catch (error) {
                console.error("Failed to fetch logo:", error);
            }
        };
        fetchLogo();
    }, []);

    const has = user?.vendorStatus === "approved" || user?.vendorStatus === "active" || user?.userType === "vendor";
    
    // Default logos
    const lightLogo = "https://api.builder.io/api/v1/image/assets/TEMP/ef12e49186360c5f295a30497de96e3fcb05f7d8?width=160"; // Black text
    const darkLogo = "https://api.builder.io/api/v1/image/assets/TEMP/871bfcdbcdbc969135e889b258ef410c6bcc2658?width=162"; // White text
    
    // Determine which logo to show
    let logoSrc;
    if (effectiveTheme === 'light') {
        // Light theme (white background) -> Use Light Theme Logo (Black)
        logoSrc = logoUrl ? getImageUrl(logoUrl) : lightLogo;
    } else {
        // Dark theme (black background) -> Use Dark Theme Logo (White)
        logoSrc = logoDarkUrl ? getImageUrl(logoDarkUrl) : darkLogo;
    }
    
  return (
    <div>
        <Link to={`${has ? "/dashboard" : "/"}`  }>
        <img
            src={logoSrc}
            alt="Travel Homes Logo"
            className="h-16 w-auto max-w-[200px] object-contain"
          />
          </Link>
    </div>
  );
};

export function HomeLogoWebsite({ variant = "auto" }: { variant?: "auto" | "light" | "dark" }){
     const { theme } = useTheme(); // or just: const theme = useTheme();
    // console.log(theme);
    const { user } = useAuth();
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
                const res = await settingsApi.getSeo('logo');
                 if (res.success && res.data) {
                    setLogoUrl(res.data.logoUrl || "");
                    setLogoDarkUrl(res.data.logoDarkUrl || "");
                }
            } catch (error) {
                console.error("Failed to fetch logo:", error);
            }
        };
        fetchLogo();
    }, []);

    const has = user?.vendorStatus === "approved" || user?.vendorStatus === "active" || user?.userType === "vendor";

    const lightLogo = "https://api.builder.io/api/v1/image/assets/TEMP/ef12e49186360c5f295a30497de96e3fcb05f7d8?width=160"; // Black text
    const darkLogo = "https://api.builder.io/api/v1/image/assets/TEMP/871bfcdbcdbc969135e889b258ef410c6bcc2658?width=162"; // White text

    const resolvedTheme = variant === "dark" ? "dark" : variant === "light" ? "light" : effectiveTheme;

    let logoSrc;
    if (resolvedTheme === 'dark') {
         logoSrc = logoDarkUrl ? getImageUrl(logoDarkUrl) : darkLogo;
    } else {
         logoSrc = logoUrl ? getImageUrl(logoUrl) : lightLogo;
    }
    
  return (
    <div>
        <Link to={`${has ? "/dashboard" : "/"}`}>
        <img
            src={logoSrc}
            alt="Travel Homes Logo"
            className="h-16 w-auto max-w-[200px] object-contain"
          />
          </Link>
      </div>
  );
};

export default LogoWebsite;
