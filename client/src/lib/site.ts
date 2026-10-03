export const SITE = {
  name: "Kishaa International",
  tagline: "Gateway to Global Careers",
  slogan: "One Company, Global Solutions",
  domain: "https://www.kishaainternational.com",
  phoneUAE: "+971 58 682 6099",
  phonePK: "+92 312 552 6099",
  email: "kishaainternational@gmail.com",
  whatsappUAE: "971586826099",
  whatsappPK: "923125526099",
  addressUAE: "Dubai, UAE (Headquarters)",
  addressPK: "Pakistan",
} as const;

export const NAV = [
  { label: "Career Counseling", to: "/career-counseling" },
  { label: "Immigration Consultancy", to: "/immigration-consultancy" },
  { label: "Cambridge Courses", to: "/cambridge-courses" },
  { label: "Destinations & Costs", to: "/destinations" },
  { label: "Meet Zeb Khan", to: "/team/zeb-khan" },
  { label: "Reviews", to: "/reviews" },
  { label: "Contact", to: "/contact" },
] as const;

export function waLink(message: string, region: "uae" | "pk" = "uae") {
  const num = region === "uae" ? SITE.whatsappUAE : SITE.whatsappPK;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function newIdempotencyKey() {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
