import { Link } from "react-router";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
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
  { name: "Ireland", slug: "ireland" },
  { name: "New Zealand", slug: "new-zealand" },
  { name: "France", slug: "france" },
  { name: "Malaysia", slug: "malaysia" },
  { name: "Turkey", slug: "turkey" },
  { name: "UAE", slug: "uae" },
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

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark light />
          <p className="mt-5 text-sm leading-relaxed text-white/60">
            Career counseling, immigration consultancy and Cambridge courses training — with
            destination intelligence, transparent cost planning and verified results.
          </p>
        </div>
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
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">Explore</h3>
          <ul className="mt-5 space-y-2.5 text-sm text-white/70">
            {[
              ["Career Counseling", "/career-counseling"],
              ["Immigration Consultancy", "/immigration-consultancy"],
              ["Cambridge Courses & IELTS", "/cambridge-courses"],
              ["Destinations & Costs", "/destinations"],
              ["Cost Planner", "/cost-planner"],
              ["Meet Zeb Khan", "/team/zeb-khan"],
              ["Reviews", "/reviews"],
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
        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">
            Destinations
          </h3>
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-white/70">
            {destinationsList.map((c) => (
              <li key={c.slug}>
                <Link to={`/destinations/${c.slug}`} className="hover:text-gold">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
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
