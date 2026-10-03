import { Link } from "react-router";
import { Phone, Mail, MapPin, MessageCircle, FileText, ExternalLink } from "lucide-react";
import { SITE, waLink } from "@/lib/site";
import { trpc } from "@/providers/trpc";
import { Wordmark } from "./Header";

const DEFAULT_DESTINATIONS = [
  { name: "United Kingdom", slug: "united-kingdom" },
  { name: "United States", slug: "united-states" },
  { name: "Canada", slug: "canada" },
  { name: "Australia", slug: "australia" },
  { name: "Germany", slug: "germany" },
  { name: "Finland", slug: "finland" },
  { name: "Italy", slug: "italy" },
  { name: "Georgia", slug: "georgia" },
  { name: "France", slug: "france" },
  { name: "Portugal", slug: "portugal" },
  { name: "Serbia", slug: "serbia" },
  { name: "Romania", slug: "romania" },
  { name: "Turkey", slug: "turkey" },
  { name: "UAE", slug: "uae" },
  { name: "Russia", slug: "russia" },
  { name: "Kazakhstan", slug: "kazakhstan" },
  { name: "Kyrgyzstan", slug: "kyrgyzstan" },
  { name: "Tajikistan", slug: "tajikistan" },
];

const OFFICIAL_GUIDES = [
  { name: "Bank Statement Rules (2026)", to: "/bank-statements" },
  { name: "UKVI 28-Day Rule Explained", to: "/resources/ukvi-28-day-rule-explained-how-much-must-sit-in-the-bank-for-a-student-visa-2026" },
  { name: "Germany Sperrkonto (€11,904)", to: "/resources/germany-blocked-account-sperrkonto-2026-exact-amount-and-payout-rules" },
  { name: "Canada 10-Yr Visit Visa", to: "/resources/canada-10-year-multiple-entry-visit-visa-requirements-cost-and-timeline-2026" },
  { name: "Finland Student Permit (€9,600)", to: "/resources/finland-student-permit-why-9-600-covers-you-and-your-family-2026-guide" },
  { name: "IELTS 6.5 to 7.5 Plan", to: "/resources/how-to-move-from-band-6-5-to-7-5-in-ielts-academic-a-ten-week-plan" },
  { name: "Georgia MBBS Admissions", to: "/resources/georgia-mbbs-for-pakistani-students-fees-recognition-and-study-gaps-2026" },
  { name: "Italy Free Tuition Scholarships", to: "/resources/italy-free-tuition-scholarships-for-pakistani-students-eligibility-and-timelines" },
  { name: "UAE Golden Visa & Freelance", to: "/resources/uae-golden-visa-and-freelance-permit-which-category-actually-fits-you" },
  { name: "Australia Subclass 500 Capacity", to: "/resources/australia-subclass-500-financial-capacity-oshc-and-the-genuine-student-requirement" },
];

export function Footer() {
  const { data: countries } = trpc.content.countries.list.useQuery();
  const destinationsList = (countries && countries.length > 0) ? countries.slice(0, 18) : DEFAULT_DESTINATIONS;

  return (
    <footer className="bg-ink text-white">
      {/* CTA band */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
          <div>
            <p className="eyebrow-light">Ready when you are</p>
            <h2 className="mt-3 font-serif text-3xl font-medium md:text-4xl">
              One company. Global solutions.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/contact" className="btn-gold">
              Request Consultation
            </Link>
            <a
              href={waLink("Hello Kishaa International — I would like to request a consultation.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-frame-light"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-5">
        {/* Col 1: Brand */}
        <div className="lg:col-span-1">
          <Wordmark light />
          <p className="mt-5 text-sm leading-relaxed text-white/60">
            Career counseling, immigration consultancy and Cambridge courses training — with
            destination intelligence, transparent cost planning and verified results.
          </p>
          <div className="mt-6 border-t border-white/10 pt-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gold">Executive Trainer</span>
            <p className="mt-1 text-xs text-white/70">Zeb Khan · British Council Certified</p>
          </div>
        </div>

        {/* Col 2: Contact */}
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">Contact</h3>
          <ul className="mt-5 space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {SITE.addressUAE}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {SITE.addressPK}
            </li>
            <li>
              <a className="flex items-center gap-2 hover:text-gold" href={`tel:${SITE.phoneUAE.replace(/\s/g, "")}`}>
                <Phone className="h-4 w-4 text-gold" /> {SITE.phoneUAE}
              </a>
            </li>
            <li>
              <a className="flex items-center gap-2 hover:text-gold" href={`tel:${SITE.phonePK.replace(/\s/g, "")}`}>
                <Phone className="h-4 w-4 text-gold" /> {SITE.phonePK}
              </a>
            </li>
            <li>
              <a className="flex items-center gap-2 hover:text-gold" href={`mailto:${SITE.email}`}>
                <Mail className="h-4 w-4 text-gold" /> {SITE.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3: Explore */}
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">Explore</h3>
          <ul className="mt-5 space-y-2.5 text-sm text-white/70">
            {[
              ["Career Counseling", "/career-counseling"],
              ["Immigration Consultancy", "/immigration-consultancy"],
              ["Cambridge Courses & IELTS", "/cambridge-courses"],
              ["Destinations & Costs", "/destinations"],
              ["Cost Planner", "/cost-planner"],
              ["Bank Statement Rules", "/bank-statements"],
              ["Meet Zeb Khan", "/team/zeb-khan"],
              ["Verified Reviews", "/reviews"],
              ["Resources & FAQs", "/resources"],
              ["About Us", "/about-us"],
              ["Contact", "/contact"],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="hover:text-gold">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Official Guides & Rules */}
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">
            Guides & Rules
          </h3>
          <ul className="mt-5 space-y-2.5 text-sm text-white/70">
            {OFFICIAL_GUIDES.map((g) => (
              <li key={g.to}>
                <Link to={g.to} className="hover:text-gold line-clamp-1">
                  {g.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/resources" className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gold hover:underline mt-2">
                All 14 Guides →
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 5: Destinations */}
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">
            Destinations
          </h3>
          <ul className="mt-5 grid grid-cols-2 gap-x-2 gap-y-2.5 text-sm text-white/70">
            {destinationsList.map((c) => (
              <li key={c.slug}>
                <Link to={`/destinations/${c.slug}`} className="hover:text-gold line-clamp-1">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Statutory Rules Quick Ribbon */}
      <div className="border-t border-white/10 bg-white/5 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-white/60 sm:px-6">
          <span className="font-semibold uppercase tracking-wider text-gold">Statutory Intelligence:</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/70">
            <Link to="/bank-statements" className="hover:text-gold">Proof of Funds Register</Link>
            <span>·</span>
            <Link to="/cost-planner" className="hover:text-gold">Interactive Cost Planner</Link>
            <span>·</span>
            <Link to="/resources/ukvi-28-day-rule-explained-how-much-must-sit-in-the-bank-for-a-student-visa-2026" className="hover:text-gold">UKVI 28 Days</Link>
            <span>·</span>
            <Link to="/resources/germany-blocked-account-sperrkonto-2026-exact-amount-and-payout-rules" className="hover:text-gold">Germany €11,904</Link>
            <span>·</span>
            <Link to="/resources/finland-student-permit-why-9-600-covers-you-and-your-family-2026-guide" className="hover:text-gold">Finland €9,600</Link>
            <span>·</span>
            <Link to="/resources/canada-10-year-multiple-entry-visit-visa-requirements-cost-and-timeline-2026" className="hover:text-gold">Canada 10-Yr LOI</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 text-[12px] text-white/40 sm:px-6 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} Kishaa International. Advisory and official fees are always
            itemised separately. Visa decisions rest solely with the respective authorities.
          </p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-gold">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-gold">
              Terms of Service
            </Link>
            <a href="/admin" className="hover:text-gold">
              Staff Sign-in
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
