import { useEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Menu, X, Phone, Calendar, ArrowRight } from "lucide-react";
import { SITE } from "@/lib/site";

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-1.5 xl:gap-2 shrink-0" aria-label="Kishaa International — home">
      <img
        src="/img/logo.png"
        alt="Kishaa International"
        width={32}
        height={32}
        className="h-7.5 w-7.5 xl:h-8 xl:w-8 object-contain rounded-full shadow-[0_0_8px_rgba(201,162,39,0.3)] shrink-0"
      />
      <div className="leading-tight">
        <span className={`block font-serif text-[12px] xl:text-[13px] 2xl:text-[14px] font-semibold tracking-tight whitespace-nowrap ${light ? "text-white" : "text-navy"}`}>
          Kishaa International
        </span>
        <span className={`block text-[6px] xl:text-[6.5px] uppercase tracking-[0.16em] font-semibold mt-0.5 whitespace-nowrap ${light ? "text-[#93a7c3]" : "text-navy/60"}`}>
          Gateway to Global Careers
        </span>
      </div>
    </Link>
  );
}

function WhatsAppIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.974.53 1.761.815 2.796.815 3.181 0 5.767-2.586 5.768-5.766.001-3.182-2.585-5.768-5.768-5.768zm3.374 8.167c-.14.394-.712.75-1.004.793-.283.042-.647.07-1.047-.06-.251-.082-.572-.191-1.018-.385-1.89-.824-3.123-2.73-3.218-2.855-.094-.126-.763-1.017-.763-1.94 0-.923.483-1.378.654-1.565.172-.187.375-.234.5-.234.125 0 .25.002.359.007.115.006.27-.044.421.32.156.376.532 1.3.579 1.394.047.094.078.204.016.33-.063.125-.094.204-.188.314-.094.11-.198.245-.283.33-.094.094-.192.196-.083.383.11.188.487.804 1.045 1.302.718.64 1.324.839 1.512.932.188.094.297.079.407-.047.11-.125.469-.548.594-.736.125-.188.25-.157.422-.094.172.063 1.094.516 1.282.61.188.094.313.141.359.219.047.079.047.454-.093.848z" />
    </svg>
  );
}

const NAV_ITEMS = [
  { label: "Home", to: "/" },
  { label: "Career Counselling", to: "/career-counseling" },
  { label: "Immigration Consultancy", to: "/immigration-consultancy" },
  { label: "Cambridge Courses", to: "/cambridge-courses" },
  { label: "Destinations & Costs", to: "/destinations" },
  { label: "Meet Zeb Khan", to: "/team/zeb-khan" },
  { label: "Reviews", to: "/reviews" },
  { label: "Contact", to: "/contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    setVisible(true);
  }, [location.pathname]);

  // Smart reveal-on-scroll-up behavior:
  // - While scrolling DOWN: header hides ("while scrolling it never shows")
  // - While scrolling UP even slightly: header reveals immediately ("suddenly shows")
  // - At the very top: always visible
  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 30) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY.current + 8) {
        // Scrolling down -> hide header
        setVisible(false);
        setOpen(false);
      } else if (currentScrollY < lastScrollY.current - 5) {
        // Scrolling up -> show header suddenly!
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full bg-gradient-to-r from-[#021226] via-[#051c3c] to-[#031428] border-b border-[#163a69]/30 transition-transform duration-300 ease-in-out ${
          visible ? "translate-y-0 shadow-[0_4px_25px_rgba(2,12,28,0.5)]" : "-translate-y-full"
        }`}
      >
        <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-3 xl:px-5">
          <div className="flex h-14 sm:h-15 xl:h-16 items-center justify-between gap-1 xl:gap-2">
            {/* Left: Brand with official circular logo */}
            <Wordmark light />

            {/* Center: All 8 Navigation Links */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0" aria-label="Primary">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `relative px-1 xl:px-1.5 2xl:px-2 py-0.5 text-[8.5px] lg:text-[9px] xl:text-[9.5px] 2xl:text-[10.5px] font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "text-white font-semibold"
                        : "text-white/80 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-3 rounded-full bg-[#E5B54F]" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Right Action Area: Phone Capsule & Request Consultation Button */}
            <div className="hidden md:flex items-center gap-1 xl:gap-1.5 2xl:gap-2 shrink-0">
              {/* Phone Capsule */}
              <div className="flex items-center gap-1 rounded-full bg-[#020b18]/85 border border-white/10 px-1.5 xl:px-2 py-0.5 text-[8px] xl:text-[8.5px] 2xl:text-[9px] text-white/95 whitespace-nowrap shadow-inner">
                <a
                  href="tel:+971588828099"
                  className="flex items-center gap-1 hover:text-[#ECC248] transition-colors font-medium"
                  title="Call UAE Office: +971 58 882 8099"
                >
                  <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#E5A922] text-[#06162D] shrink-0">
                    <Phone className="h-1.5 w-1.5 fill-current" />
                  </span>
                  <span>+971 58 882 8099</span>
                </a>

                <span className="h-2 w-px bg-white/20" />

                <a
                  href="https://wa.me/923125526099"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-green-300 transition-colors font-medium"
                  title="WhatsApp Pakistan Office: +92 312 552 6099"
                >
                  <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#25D366] text-white shrink-0">
                    <WhatsAppIcon className="h-1.5 w-1.5" />
                  </span>
                  <span className="hidden xl:inline">+92 312 552 6099</span>
                  <span className="xl:hidden">WhatsApp</span>
                </a>
              </div>

              {/* Request Consultation Pill Button */}
              <Link
                to="/contact"
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#F5C344] via-[#F1BE3B] to-[#E5A720] px-2 xl:px-2.5 2xl:px-3 py-1 text-[8.5px] lg:text-[9px] xl:text-[9.5px] 2xl:text-[10px] font-bold text-[#06162D] shadow-[0_2px_10px_rgba(245,195,68,0.25)] hover:brightness-105 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
              >
                <Calendar className="h-2.5 w-2.5 xl:h-3 xl:w-3 text-[#06162D] shrink-0" />
                <span>Request Consultation</span>
                <ArrowRight className="h-2.5 w-2.5 xl:h-3 xl:w-3 stroke-[2.5] text-[#06162D] shrink-0" />
              </Link>
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#F5C344] to-[#E5A720] px-3 py-1.5 text-[11px] font-bold text-[#06162D]"
              >
                <Calendar className="h-3 w-3" />
                <span>Consult</span>
              </Link>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white"
                onClick={() => setOpen(!open)}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Navigation */}
          {open && (
            <nav
              className="border-t border-[#163a69] bg-[#021226] p-5 shadow-2xl lg:hidden animate-in fade-in duration-200"
              aria-label="Mobile Navigation"
            >
              <div className="space-y-1 border-b border-white/10 pb-4">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                        isActive
                          ? "bg-white/10 text-[#ECC248] font-semibold"
                          : "text-white/80 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    <span>{item.label}</span>
                    {location.pathname === item.to && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ECC248]" />
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Mobile Contact Numbers */}
              <div className="space-y-2 pt-4 text-[13px] text-white">
                <a
                  href="tel:+971588828099"
                  className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2 text-white hover:bg-white/10 transition-colors"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E5A922] text-[#06162D]">
                    <Phone className="h-3 w-3 fill-current" />
                  </span>
                  <span>+971 58 882 8099 (Dubai HQ)</span>
                </a>
                <a
                  href="https://wa.me/923125526099"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2 text-white hover:bg-white/10 transition-colors"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] text-white">
                    <WhatsAppIcon className="h-3 w-3" />
                  </span>
                  <span>+92 312 552 6099 (WhatsApp PK)</span>
                </a>

                <Link
                  to="/contact"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F5C344] to-[#E5A720] py-3 text-[13px] font-bold text-[#06162D] shadow-md"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Request Consultation</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
