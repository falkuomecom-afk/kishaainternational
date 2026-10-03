import { BadgeCheck, Globe2, Languages, Mail, Phone } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, zebJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { SITE, waLink } from "@/lib/site";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import NotFound from "./NotFound";

export default function TeamZebKhan() {
  const { data: zeb, isLoading } = trpc.content.team.bySlug.useQuery({ slug: "zeb-khan" });
  useReveal(zeb);

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-24 text-navy/50">Loading…</div>;
  if (!zeb) return <NotFound />;

  return (
    <>
      <Seo
        title="Zeb Khan — Senior Consultant & Executive Trainer"
        description="Zeb Khan, Senior Consultant & Executive Trainer at Kishaa International — MA English, MEd, PGD TEFL, Dip EPM, British Council Certified Trainer. Career counseling, admissions, visas and IELTS training in Dubai & Pakistan."
        path="/team/zeb-khan"
        jsonLd={[
          zebJsonLd,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Zeb Khan", path: "/team/zeb-khan" },
          ]),
        ]}
      />

      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <div className="overflow-hidden rounded-2xl border border-gold/30 bg-[#021226]/80 p-6 sm:p-8 text-center shadow-2xl">
              <div className="relative mx-auto mb-6 h-64 w-52 sm:h-72 sm:w-60 overflow-hidden rounded-2xl border-2 border-gold/40 shadow-[0_4px_30px_rgba(201,162,39,0.3)]">
                <img
                  src="/img/zeb-khan.png"
                  alt={zeb.name}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <h1 className="font-serif text-3xl font-medium text-white">{zeb.name}</h1>
              <p className="mt-2 text-[13px] uppercase tracking-[0.16em] text-[#ECC248] font-semibold">
                {zeb.role}
              </p>
            </div>
            <div className="mt-6 space-y-2.5 text-[14px] text-white/70">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold" /> {SITE.phoneUAE} / {SITE.phonePK}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" /> {zeb.email ?? SITE.email}
              </p>
              <p className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-gold" /> {zeb.languages ?? "English, Urdu"}
              </p>
              <p className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-gold" /> Dubai, UAE (HQ) & Pakistan · online worldwide
              </p>
            </div>
          </div>
          <div className="lg:col-span-8">
            <p className="eyebrow-light">Senior Consultant & Executive Trainer</p>
            <h2 className="mt-4 font-serif text-4xl font-medium leading-tight md:text-5xl">
              Guidance backed by credentials — not slogans.
            </h2>
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/75">{zeb.bio}</p>

            <h3 className="mt-10 text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">
              Verified qualifications
            </h3>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {(zeb.credentials ?? "").split("\n").filter(Boolean).map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-2 border border-gold/40 px-4 py-2 text-[13px] font-medium text-gold"
                >
                  <BadgeCheck className="h-4 w-4" /> {c}
                </span>
              ))}
            </div>

            <h3 className="mt-10 text-[12px] font-semibold uppercase tracking-[0.2em] text-gold">
              Core expertise
            </h3>
            <ul className="mt-4 grid max-w-2xl gap-2.5 sm:grid-cols-2">
              {(zeb.expertise ?? "").split("\n").filter(Boolean).map((e) => (
                <li key={e} className="flex items-start gap-2.5 text-[15px] text-white/75">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" /> {e}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Work directly with Zeb Khan</p>
          <h2 className="mt-3 font-serif text-4xl font-medium text-navy">
            Counseling & training, one to one.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed text-navy/70">
            Whether you are choosing between the UK and Finland, preparing a Canada LOI application,
            or pushing your IELTS writing from 6.0 to 7.5 — sessions with Zeb Khan are structured
            around your profile, timeline and budget.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              ["Admissions strategy", "University shortlisting, scholarships, deposits and MOI routes."],
              ["Visa planning", "Canada LOI, UAE PRO/GDRFA, Turkey, Schengen — milestone-based and transparent."],
              ["IELTS & Cambridge", "Diagnostic assessment and a personalized band-improvement roadmap."],
            ].map(([t, d]) => (
              <li key={t} className="border-l-2 border-gold pl-5">
                <p className="font-serif text-xl text-navy">{t}</p>
                <p className="mt-1 text-[14px] text-navy/60">{d}</p>
              </li>
            ))}
          </ul>
          <a
            href={waLink("Hello — I'd like to enquire about counseling & training with Zeb Khan.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-frame mt-8"
          >
            WhatsApp Zeb Khan's team
          </a>
        </div>
        <div className="border border-navy/10 bg-paper p-8 md:p-10">
          <EnquiryForm
            source="Zeb Khan Profile"
            title="Enquire about counseling & training with Zeb Khan"
            program="Zeb Khan — direct consultation"
          />
        </div>
      </section>
    </>
  );
}
