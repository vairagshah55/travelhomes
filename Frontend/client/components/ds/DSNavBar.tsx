import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface DSNavBarProps {
  logoSrc?: string;
  user?: { name: string; avatarUrl?: string } | null;
  onLogin?: () => void;
  onRegister?: () => void;
  onListProperty?: () => void;
  className?: string;
}

const NAV_LINKS = [
  { label: "Explore", to: "/" },
  { label: "Stays", to: "/search?filter=unique-stays" },
  { label: "Activities", to: "/search?filter=activity" },
  { label: "Camper Vans", to: "/search?filter=camper-van" },
] as const;

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Logo({ logoSrc }: { logoSrc?: string }) {
  if (logoSrc) {
    return <img src={logoSrc} alt="TravelHomes logo" className="w-32 object-contain" />;
  }
  return (
    <span className="font-serif text-[22px] text-ds-navy font-medium leading-none select-none">
      TravelHomes
    </span>
  );
}

export default function DSNavBar({
  logoSrc,
  user,
  onLogin,
  onRegister,
  onListProperty,
  className = "",
}: DSNavBarProps) {
  const [open, setOpen] = useState(false);

  const navLinkClass =
    "text-ds-charcoal text-[15px] hover:text-ds-deep transition-colors duration-150 font-medium font-sans";

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm ${className}`}
      style={{ borderColor: "var(--ds-pebble)" }}
    >
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-16">
        {/* Left — Logo */}
        <Link to="/" className="shrink-0">
          <Logo logoSrc={logoSrc} />
        </Link>

        {/* Center — Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right — Actions */}
        <div className="flex items-center gap-2">
          {/* List property */}
          <button
            type="button"
            onClick={onListProperty}
            className="
              hidden sm:inline-flex items-center
              border text-ds-charcoal text-sm font-medium font-sans
              rounded-full px-4 h-9
              hover:bg-ds-linen
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ocean focus-visible:ring-offset-2
            "
            style={{ borderColor: "var(--ds-pebble)" }}
          >
            List your property
          </button>

          {user == null ? (
            <>
              <button
                type="button"
                onClick={onLogin}
                className="
                  hidden sm:inline-flex items-center
                  text-ds-charcoal text-sm font-medium font-sans
                  rounded-full px-4 h-9
                  hover:bg-ds-linen
                  transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ocean focus-visible:ring-offset-2
                "
              >
                Log in
              </button>
              <button
                type="button"
                onClick={onRegister}
                className="
                  hidden sm:inline-flex items-center
                  bg-ds-deep hover:bg-ds-navy
                  text-white text-sm font-medium font-sans
                  rounded-full px-4 h-9
                  transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ocean focus-visible:ring-offset-2
                "
              >
                Register
              </button>
            </>
          ) : (
            /* Avatar */
            <div
              className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center overflow-hidden font-sans font-semibold text-[14px] select-none"
              style={{ background: "var(--ds-sky)", color: "var(--ds-deep)" }}
              aria-label={`${user.name}'s account`}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(user.name)
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="
                  md:hidden flex items-center justify-center
                  w-9 h-9 rounded-full
                  text-ds-charcoal hover:bg-ds-linen
                  transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ocean
                "
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-0 pt-12 font-sans">
              {/* Mobile nav links */}
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="
                      text-ds-charcoal text-[16px] font-medium
                      hover:text-ds-deep hover:bg-ds-linen
                      rounded-lg px-3 py-2.5
                      transition-colors duration-150
                    "
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div
                className="border-t my-4"
                style={{ borderColor: "var(--ds-pebble)" }}
              />

              {/* Mobile auth */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { onListProperty?.(); setOpen(false); }}
                  className="
                    w-full h-10 rounded-lg border
                    text-ds-charcoal text-sm font-medium
                    hover:bg-ds-linen transition-all duration-200
                  "
                  style={{ borderColor: "var(--ds-pebble)" }}
                >
                  List your property
                </button>
                {user == null ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { onLogin?.(); setOpen(false); }}
                      className="
                        w-full h-10 rounded-lg border
                        text-ds-charcoal text-sm font-medium
                        hover:bg-ds-linen transition-all duration-200
                      "
                      style={{ borderColor: "var(--ds-pebble)" }}
                    >
                      Log in
                    </button>
                    <button
                      type="button"
                      onClick={() => { onRegister?.(); setOpen(false); }}
                      className="
                        w-full h-10 rounded-lg
                        bg-ds-deep hover:bg-ds-navy
                        text-white text-sm font-medium
                        transition-all duration-200
                      "
                    >
                      Register
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[14px] select-none overflow-hidden shrink-0"
                      style={{ background: "var(--ds-sky)", color: "var(--ds-deep)" }}
                    >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <span className="text-ds-charcoal text-[15px] font-medium">{user.name}</span>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
