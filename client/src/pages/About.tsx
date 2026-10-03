import { Link } from "react-router";
import { Building2, Compass, ShieldCheck } from "lucide-react";
import { Seo, orgJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { PageHero } from "@/components/site/blocks";
import { SITE } from "@/lib/site";

export default function About() {
  useReveal();
  return (
    <>
      <Seo
        title="About Us — Dubai HQ & Pakistan"
        description="Kishaa International — career counseling, immigration consultancy and Cambridge courses training from Dubai, UAE (Headquarters) and Pakistan. Gateway to Global Careers. One Company, Global Solutions."
        path="/about-us"
        jsonLd={[
          orgJsonLd,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About Us", path: "/about-us" },
          ]),
        ]}
      />
      <PageHero
        eyebrow="About Kishaa International"
        title="Gateway to Global Careers."
        lede="One company, global solutions — an authoritative consultancy platform uniting career counseling, immigration consultancy and Cambridge courses training."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Compass,
              t: "Counsel first, sell never",
              d: "We tell you when a cheaper or faster route fits your profile — even when it earns us less. No invented guarantees, no countdown timers, no pressure.",
            },
            {
              icon: ShieldCheck,
              t: "Transparent money",
              d: "Advisory fees, official embassy fees, tuition and test fees are itemised separately. Milestone payments mean you never pay everything upfront.",
            },
            {
              icon: Building2,
              t: "Dual presence",
              d: `Headquartered in Dubai, UAE and operating in Pakistan — one team, two offices, a single standard of work.`,
            },
          ].map((x) => (
            <div key={x.t} className="reveal border border-navy/10 bg-white p-8">
              <x.icon className="h-8 w-8 text-gold-dark" strokeWidth={1.5} />
              <h2 className="mt-5 font-serif text-2xl font-medium text-navy">{x.t}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-navy/65">{x.d}</p>
            </div>
          ))}
        </div>

        <div className="reveal mt-16 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Leadership</p>
            <h2 className="mt-3 font-serif text-4xl font-medium text-navy">Led by Zeb Khan.</h2>
            <p className="mt-5 text-[16px] leading-relaxed text-navy/70">
              Zeb Khan — Senior Consultant & Executive Trainer — holds MA English, MEd, PGD TEFL and
              Dip EPM qualifications and is a British Council Certified Trainer. He leads both the
              training practice and the consultancy's advisory standards.
            </p>
            <Link to="/team/zeb-khan" className="btn-fill mt-7">
              Meet Zeb Khan
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-px bg-navy/10">
            {[
              ["Dubai, UAE", "Headquarters", SITE.phoneUAE],
              ["Pakistan", "Regional office", SITE.phonePK],
              ["2 offices", "One team, one standard", SITE.email],
              ["EN / UR", "English & Urdu service", SITE.domain],
            ].map(([a, b, c]) => (
              <div key={a} className="bg-white p-7">
                <p className="font-serif text-2xl text-navy">{a}</p>
                <p className="mt-1 text-[13px] text-navy/55">{b}</p>
                <p className="mt-3 text-[13px] font-medium text-gold-dark">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
