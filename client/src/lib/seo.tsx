import { useEffect } from "react";
import { SITE } from "./site";

type JsonLd = Record<string, unknown>;

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Per-page SEO + AEO/GEO/AIO head manager.
 * Sets title, description, canonical, Open Graph and injects JSON-LD
 * structured data (schema.org) for search engines and AI answer engines.
 */
export function Seo({
  title,
  description,
  path = "/",
  jsonLd = [],
  noindex = false,
}: {
  title: string;
  description: string;
  path?: string;
  jsonLd?: JsonLd[];
  noindex?: boolean;
}) {
  useEffect(() => {
    const fullTitle = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`;
    document.title = fullTitle;
    upsertMeta("name", "description", description);
    upsertMeta(
      "name",
      "robots",
      noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    );
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", `${SITE.domain}${path}`);
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${SITE.domain}${path}`);

    const injected: HTMLScriptElement[] = [];
    jsonLd.forEach((obj, i) => {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.textContent = JSON.stringify(obj);
      el.dataset.seo = `ld-${i}`;
      document.head.appendChild(el);
      injected.push(el);
    });
    return () => injected.forEach((el) => el.remove());
  }, [title, description, path, noindex, JSON.stringify(jsonLd)]);
  return null;
}

/* ------------------------- shared schema.org blocks ------------------------ */

export const orgJsonLd: JsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${SITE.domain}/#organization`,
  name: SITE.name,
  alternateName: "Kishaa International Consultancy",
  slogan: `${SITE.tagline} | ${SITE.slogan}`,
  url: SITE.domain,
  email: SITE.email,
  telephone: SITE.phoneUAE,
  description:
    "Career counseling, immigration consultancy and Cambridge courses training with destination intelligence, cost planning and verified reviews.",
  address: [
    {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressCountry: "AE",
      name: "Kishaa International Headquarters",
    },
    { "@type": "PostalAddress", addressCountry: "PK", name: "Kishaa International Pakistan" },
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: SITE.phoneUAE,
      contactType: "admissions",
      areaServed: ["AE", "PK"],
      availableLanguage: ["English", "Urdu"],
    },
    {
      "@type": "ContactPoint",
      telephone: SITE.phonePK,
      contactType: "admissions",
      areaServed: "PK",
      availableLanguage: ["English", "Urdu"],
    },
  ],
  sameAs: [SITE.domain],
};

export const zebJsonLd: JsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE.domain}/team/zeb-khan#person`,
  name: "Zeb Khan",
  jobTitle: "Senior Consultant & Executive Trainer",
  worksFor: { "@id": `${SITE.domain}/#organization` },
  telephone: SITE.phoneUAE,
  email: SITE.email,
  knowsLanguage: ["English", "Urdu"],
  hasCredential: [
    { "@type": "EducationalOccupationalCredential", name: "MA English" },
    { "@type": "EducationalOccupationalCredential", name: "MEd" },
    { "@type": "EducationalOccupationalCredential", name: "PGD TEFL" },
    { "@type": "EducationalOccupationalCredential", name: "Dip EPM" },
    { "@type": "EducationalOccupationalCredential", name: "British Council Certified Trainer" },
  ],
};

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE.domain}${it.path}`,
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function courseJsonLd(p: {
  name: string;
  description?: string | null;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: p.name,
    description: p.description ?? p.name,
    provider: { "@id": `${SITE.domain}/#organization` },
  };
}
