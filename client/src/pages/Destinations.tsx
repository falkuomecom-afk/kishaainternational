import { Link } from "react-router";
import { ArrowRight, Plane } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, breadcrumbJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import { PageHero } from "@/components/site/blocks";

export default function Destinations() {
  const { data: countries } = trpc.content.countries.list.useQuery();
  useReveal(countries);
  const regions = [...new Set((countries ?? []).map((c) => c.region))];

  return (
    <>
      <Seo
        title="Destinations & Costs — Country Guides for Study, Work & Visits"
        description="Country-wise intelligence for the UK, Italy, Finland, Georgia, Germany, France, Portugal, Serbia, Romania, Canada, USA, Australia, Turkey, UAE, Russia and Central Asia — living costs, bank statement rules and flight guides."
        path="/destinations"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Destinations & Costs", path: "/destinations" },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Destinations & Costs"
        title="Country intelligence, verified and dated."
        lede="Every guide carries living-cost profiles, official bank statement rules with effective dates, and indicative flight ranges — so you compare destinations on evidence, not promises."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {regions.map((region) => (
          <div key={region} className="mb-14">
            <h2 className="border-b-2 border-gold pb-3 font-serif text-2xl font-medium text-navy">
              {region}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(countries ?? [])
                .filter((c) => c.region === region)
                .map((c) => {
                  let living: { currency?: string; budget?: number } | null = null;
                  try {
                    living = c.livingCosts ? (typeof c.livingCosts === "string" ? JSON.parse(c.livingCosts) : c.livingCosts) : null;
                  } catch {
                    living = null;
                  }
                  return (
                    <Link
                      key={c.slug}
                      to={`/destinations/${c.slug}`}
                      className="reveal group border border-navy/10 bg-white p-6 transition-all hover:border-gold hover:shadow-[0_12px_40px_rgba(6,22,45,0.08)]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{c.flag}</span>
                        {c.featured && (
                          <span className="bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-dark">
                            Flagship
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 font-serif text-xl font-medium text-navy">{c.name}</h3>
                      <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-navy/60">
                        {c.summary}
                      </p>
                      {living && living.budget != null && (
                        <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-gold-dark">
                          From {living.currency || ""} {Number(living.budget).toLocaleString()}/month
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-navy group-hover:text-gold-dark">
                        View guide <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
        <div className="reveal flex flex-col items-center gap-4 border border-navy/10 bg-paper p-10 text-center">
          <Plane className="h-8 w-8 text-gold" strokeWidth={1.5} />
          <h2 className="font-serif text-2xl font-medium text-navy">
            Compare two destinations side by side
          </h2>
          <p className="max-w-lg text-[15px] text-navy/65">
            Use the cost planner to generate a full itemised estimate — flight, living and official
            funds — for any destination above.
          </p>
          <Link to="/cost-planner" className="btn-fill">
            Open the Cost Planner
          </Link>
        </div>
      </section>
    </>
  );
}
