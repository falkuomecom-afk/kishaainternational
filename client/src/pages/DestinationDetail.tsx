import { useParams, Link } from "react-router";
import { ArrowLeft, ArrowRight, Plane, Wallet, Landmark, ExternalLink } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, breadcrumbJsonLd } from "@/lib/seo";
import { useReveal } from "@/lib/reveal";
import NotFound from "./NotFound";

export default function DestinationDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: c, isLoading } = trpc.content.countries.bySlug.useQuery({ slug: slug ?? "" });
  useReveal(c);

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-navy/50">Loading destination…</div>;
  }
  if (!c) return <NotFound />;

  let living: any = null;
  let funds: any = null;
  let flights: any[] = [];
  try {
    living = c.livingCosts ? (typeof c.livingCosts === "string" ? JSON.parse(c.livingCosts) : c.livingCosts) : null;
  } catch {
    living = null;
  }
  try {
    funds = c.fundsRule ? (typeof c.fundsRule === "string" ? JSON.parse(c.fundsRule) : c.fundsRule) : null;
  } catch {
    funds = null;
  }
  try {
    flights = c.flightGuide ? (typeof c.flightGuide === "string" ? JSON.parse(c.flightGuide) : c.flightGuide) : [];
  } catch {
    flights = [];
  }

  return (
    <>
      <Seo
        title={c.seoTitle ?? `${c.name} — Study, Visa, Living Costs & Bank Statement Guide`}
        description={c.seoDescription ?? (c.summary ?? `${c.name} destination guide`)}
        path={`/destinations/${c.slug}`}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Destinations", path: "/destinations" },
            { name: c.name, path: `/destinations/${c.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${c.name} — Study, Visa & Cost Guide`,
            about: { "@type": "Country", name: c.name },
            author: { "@id": "https://www.kishaainternational.com/#organization" },
          },
        ]}
      />

      <section className="bg-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <Link
            to="/destinations"
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-white/60 hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" /> All destinations
          </Link>
          <div className="mt-6 flex items-center gap-4">
            <span className="text-5xl">{c.flag}</span>
            <div>
              <p className="eyebrow-light">{c.region}</p>
              <h1 className="mt-1 font-serif text-4xl font-medium md:text-6xl">{c.name}</h1>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">{c.summary}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Visa & tuition */}
          <div className="space-y-8 lg:col-span-2">
            <div className="reveal">
              <h2 className="border-b-2 border-gold pb-3 font-serif text-2xl font-medium text-navy">
                Visa pathway
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-navy/75">{c.visaInfo}</p>
            </div>
            <div className="reveal">
              <h2 className="border-b-2 border-gold pb-3 font-serif text-2xl font-medium text-navy">
                Tuition & fees
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-navy/75">{c.tuitionInfo}</p>
            </div>
            {living && (
              <div className="reveal">
                <h2 className="border-b-2 border-gold pb-3 font-serif text-2xl font-medium text-navy">
                  Monthly living costs
                </h2>
                <div className="mt-5 grid gap-px bg-navy/10 sm:grid-cols-3">
                  {(["budget", "standard", "comfortable"] as const).map((tier) => (
                    <div key={tier} className="bg-white p-6 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/50">
                        {tier}
                      </p>
                      <p className="mt-2 font-serif text-3xl text-navy">
                        {living.currency || ""} {living[tier] != null ? Number(living[tier]).toLocaleString() : "—"}
                      </p>
                    </div>
                  ))}
                </div>
                {living.note && (
                  <p className="mt-3 text-[13px] text-navy/50">
                    Indicative statistical estimate — {living.note}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: funds + flights + CTA */}
          <aside className="space-y-6">
            {funds && (
              <div className="reveal border border-gold/40 bg-paper p-7">
                <div className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-gold-dark" />
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                    Official bank statement rule
                  </h3>
                </div>
                <p className="mt-4 font-serif text-4xl text-navy">
                  {funds.currency || ""} {funds.amount != null ? Number(funds.amount).toLocaleString() : "—"}
                </p>
                {funds.months && (
                  <p className="mt-1 text-[13px] text-navy/60">{funds.months}-month requirement</p>
                )}
                <p className="mt-4 border-t border-navy/10 pt-4 text-[14px] leading-relaxed text-navy/75">
                  {funds.note}
                </p>
                {funds.holderRule && (
                  <p className="mt-3 text-[13px] font-medium text-navy">
                    Holder: {funds.holderRule}
                  </p>
                )}
                <p className="mt-4 text-[11px] uppercase tracking-[0.1em] text-navy/40">
                  Official rule · effective {funds.effectiveDate}
                </p>
                {funds.sourceUrl && (
                  <a
                    href={funds.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-gold-dark hover:underline"
                  >
                    Government source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
            {flights.length > 0 && (
              <div className="reveal border border-navy/10 bg-white p-7">
                <div className="flex items-center gap-2">
                  <Plane className="h-5 w-5 text-gold-dark" />
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                    Indicative flight ranges
                  </h3>
                </div>
                <ul className="mt-4 space-y-3">
                  {flights
                    .filter((f: any) => f.priceMax > 0)
                    .map((f: any) => (
                      <li
                        key={f.from}
                        className="flex items-center justify-between text-[14px] text-navy/80"
                      >
                        <span>From {f.from}</span>
                        <span className="font-semibold text-navy">
                          {f.currency} {f.priceMin}–{f.priceMax}
                        </span>
                      </li>
                    ))}
                </ul>
                <p className="mt-4 text-[12px] text-navy/45">
                  Live fares are confirmed by our team via the airline search API at consultation.
                </p>
              </div>
            )}
            <div className="reveal bg-navy p-7 text-white">
              <Wallet className="h-6 w-6 text-gold" />
              <h3 className="mt-3 font-serif text-xl font-medium">
                Calculate your full {c.name} budget
              </h3>
              <p className="mt-2 text-[14px] text-white/65">
                Flight + living + official funds, itemised and separated.
              </p>
              <Link to={`/cost-planner?country=${c.slug}`} className="btn-gold mt-5 w-full">
                Plan my budget <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
