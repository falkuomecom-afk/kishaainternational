import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import {
  Calculator,
  Plane,
  Wallet,
  Landmark,
  ArrowRight,
  AlertTriangle,
  Info,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Seo, breadcrumbJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/site/blocks";

type Estimate = ReturnType<typeof buildEmpty> | null;
function buildEmpty() {
  return null as any;
}

export default function CostPlanner() {
  const [params] = useSearchParams();
  const { data: countries } = trpc.content.countries.list.useQuery();
  const [inputs, setInputs] = useState({
    countrySlug: params.get("country") ?? "united-kingdom",
    purpose: "study" as "study" | "visit" | "work" | "business",
    scenario: "standard" as "budget" | "standard" | "comfortable",
    stayMonths: 9,
    dependants: 0,
    origin: "LHE" as "DXB" | "LHE" | "ISB" | "KHI",
    cabin: "economy" as "economy" | "premium" | "business",
    travellers: 1,
    selfFunds: undefined as number | undefined,
  });
  const [result, setResult] = useState<Estimate>(null);

  const estimate = trpc.planner.estimate.useMutation({
    onSuccess: (data) => setResult(data),
  });

  useEffect(() => {
    if (countries?.length) estimate.mutate(inputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries?.length]);

  const set = (k: string, v: unknown) => setInputs((s) => ({ ...s, [k]: v }));
  const sel =
    "w-full border border-navy/20 bg-white px-4 py-3 text-[15px] text-navy outline-none focus:border-gold";
  const lbl = "mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-navy/60";

  return (
    <>
      <Seo
        title="Cost Planner — Flight Tickets, Living Costs & Bank Statement Calculator"
        description="Calculate flight tickets, monthly living costs and official embassy bank statement requirements for the UK, Italy, Finland, Georgia, Canada, Australia and more — itemised and separated."
        path="/cost-planner"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Cost Planner", path: "/cost-planner" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Kishaa Cost Planner",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            description:
              "Interactive planner for airline tickets, country living costs and official bank statement / maintenance funds rules.",
            provider: { "@id": "https://www.kishaainternational.com/#organization" },
          },
        ]}
      />
      <PageHero
        eyebrow="Cost Planner"
        title="Three numbers. Zero surprises."
        lede="Your flight ticket, your monthly living cost, and the official bank statement the embassy expects — calculated separately, because embassies do."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Inputs */}
          <div className="lg:col-span-5">
            <div className="space-y-5 border border-navy/10 bg-paper p-8">
              <div>
                <label className={lbl} htmlFor="cp-country">1 · Destination country</label>
                <select
                  id="cp-country"
                  className={sel}
                  value={inputs.countrySlug}
                  onChange={(e) => set("countrySlug", e.target.value)}
                >
                  {(countries ?? []).map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl} htmlFor="cp-purpose">2 · Visa purpose</label>
                <select
                  id="cp-purpose"
                  className={sel}
                  value={inputs.purpose}
                  onChange={(e) => set("purpose", e.target.value)}
                >
                  <option value="study">Study</option>
                  <option value="visit">Visit / Tourist</option>
                  <option value="work">Work</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl} htmlFor="cp-origin">Departure airport</label>
                  <select
                    id="cp-origin"
                    className={sel}
                    value={inputs.origin}
                    onChange={(e) => set("origin", e.target.value)}
                  >
                    <option value="LHE">Lahore (LHE)</option>
                    <option value="ISB">Islamabad (ISB)</option>
                    <option value="KHI">Karachi (KHI)</option>
                    <option value="DXB">Dubai (DXB)</option>
                  </select>
                </div>
                <div>
                  <label className={lbl} htmlFor="cp-cabin">Cabin</label>
                  <select
                    id="cp-cabin"
                    className={sel}
                    value={inputs.cabin}
                    onChange={(e) => set("cabin", e.target.value)}
                  >
                    <option value="economy">Economy</option>
                    <option value="premium">Premium</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl} htmlFor="cp-months">Stay (months)</label>
                  <input
                    id="cp-months"
                    type="number"
                    min={1}
                    max={60}
                    className={sel}
                    value={inputs.stayMonths}
                    onChange={(e) => set("stayMonths", Number(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className={lbl} htmlFor="cp-travellers">Travellers</label>
                  <input
                    id="cp-travellers"
                    type="number"
                    min={1}
                    max={9}
                    className={sel}
                    value={inputs.travellers}
                    onChange={(e) => set("travellers", Number(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div>
                <span className={lbl}>3 · Travel style</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["budget", "standard", "comfortable"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("scenario", s)}
                      className={`border px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                        inputs.scenario === s
                          ? "border-gold bg-gold text-navy"
                          : "border-navy/20 text-navy/60 hover:border-gold"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl} htmlFor="cp-dep">Dependants</label>
                  <input
                    id="cp-dep"
                    type="number"
                    min={0}
                    max={10}
                    className={sel}
                    value={inputs.dependants}
                    onChange={(e) => set("dependants", Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className={lbl} htmlFor="cp-funds">Your savings (optional)</label>
                  <input
                    id="cp-funds"
                    type="number"
                    min={0}
                    placeholder="e.g. 12000"
                    className={sel}
                    value={inputs.selfFunds ?? ""}
                    onChange={(e) =>
                      set("selfFunds", e.target.value === "" ? undefined : Number(e.target.value))
                    }
                  />
                </div>
              </div>
              <button
                onClick={() => estimate.mutate(inputs)}
                disabled={estimate.isPending}
                className="btn-fill w-full disabled:opacity-60"
              >
                <Calculator className="h-4 w-4" />
                {estimate.isPending ? "Calculating…" : "Calculate estimate"}
              </button>
              <p className="text-[12px] leading-relaxed text-navy/45">
                We never ask for bank account numbers or documents here. Figures are indicative
                until confirmed live with our counselors.
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-7">
            {!result && !estimate.isPending && (
              <div className="flex h-full min-h-64 flex-col items-center justify-center border border-dashed border-navy/20 p-10 text-center">
                <Calculator className="h-10 w-10 text-gold" strokeWidth={1.25} />
                <p className="mt-4 max-w-sm text-[15px] text-navy/60">
                  Configure your plan and calculate — the estimate appears here, fully itemised.
                </p>
              </div>
            )}
            {estimate.isPending && (
              <div className="flex h-full min-h-64 items-center justify-center text-navy/50">
                Calculating your estimate…
              </div>
            )}
            {result && !estimate.isPending && (
              <div className="space-y-6">
                <div className="flex items-baseline justify-between border-b-2 border-gold pb-3">
                  <h2 className="font-serif text-3xl font-medium text-navy">
                    {result.country.name} — {result.purpose} estimate
                  </h2>
                  <span className="text-[12px] uppercase tracking-[0.12em] text-navy/50">
                    {result.scenario} · {result.stayMonths} months
                  </span>
                </div>

                {result.moreInfoNeeded && (
                  <div className="flex items-start gap-3 border border-gold/50 bg-gold/10 p-5 text-[14px] text-navy">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                    More information needed — verified data for this route is being reviewed by our
                    team. A counselor will prepare your figures manually.
                  </div>
                )}

                {/* 1 — Flight */}
                {result.flight && (
                  <div className="border border-navy/10 bg-white p-7">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Plane className="h-5 w-5 text-gold-dark" />
                        <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                          1 · Flight ticket
                        </h3>
                      </div>
                      <span className="bg-navy/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-navy/50">
                        {result.flight.freshness}
                      </span>
                    </div>
                    <p className="mt-4 font-serif text-4xl text-navy">
                      {result.flight.currency} {result.flight.min != null ? Number(result.flight.min).toLocaleString() : "—"} –{" "}
                      {result.flight.max != null ? Number(result.flight.max).toLocaleString() : "—"}
                    </p>
                    <p className="mt-2 text-[13px] text-navy/55">
                      Return, from {result.flight.from}, incl. taxes & seasonal adjustment.{" "}
                      {result.flight.note}
                    </p>
                  </div>
                )}

                {/* 2 — Living */}
                {result.living && (
                  <div className="border border-navy/10 bg-white p-7">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-gold-dark" />
                        <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                          2 · Living costs
                        </h3>
                      </div>
                      <span className="bg-navy/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-navy/50">
                        {result.living.freshness}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
                      <p className="font-serif text-4xl text-navy">
                        {result.living.currency} {result.living.monthly != null ? Number(result.living.monthly).toLocaleString() : "—"}
                        <span className="text-lg text-navy/50"> /month</span>
                      </p>
                      <p className="font-serif text-2xl text-navy/75">
                        {result.living.currency}{" "}
                        {result.living.stayTotal != null ? Number(result.living.stayTotal + (result.living.dependantUplift || 0)).toLocaleString() : "—"}
                        <span className="text-sm text-navy/50"> total for stay</span>
                      </p>
                    </div>
                    <p className="mt-2 text-[13px] text-navy/55">
                      Rent, groceries, transit, health cover, utilities & contingency.
                      {(result.living.dependantUplift ?? 0) > 0 &&
                        ` Includes dependant uplift of ${result.living.currency} ${Number(result.living.dependantUplift).toLocaleString()}.`}
                    </p>
                  </div>
                )}

                {/* 3 — Funds */}
                {result.funds && (
                  <div className="border-2 border-gold/50 bg-paper p-7">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-gold-dark" />
                        <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                          3 · Official bank statement
                        </h3>
                      </div>
                      <span className="bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold-dark">
                        {result.funds.freshness} rule
                      </span>
                    </div>
                    <p className="mt-4 font-serif text-4xl text-navy">
                      {result.funds.currency} {result.funds.dependantTotal != null ? Number(result.funds.dependantTotal).toLocaleString() : "—"}
                    </p>
                    <p className="mt-2 text-[13px] text-navy/60">
                      {result.funds.note}
                      {result.funds.holderRule ? ` Holder: ${result.funds.holderRule}.` : ""}{" "}
                      Effective {result.funds.effectiveDate}.
                    </p>
                    {result.gap !== null && (
                      <p
                        className={`mt-4 border-t border-navy/10 pt-4 text-[15px] font-semibold ${
                          result.gap > 0 ? "text-red-700" : "text-green-700"
                        }`}
                      >
                        {result.gap > 0
                          ? `Indicative gap to close: ${result.funds.currency} ${Number(result.gap).toLocaleString()}`
                          : `Your stated savings meet the requirement.`}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-3 border border-navy/10 bg-white p-5 text-[13px] text-navy/55">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                  {result.disclaimer}
                </div>

                <div className="bg-navy p-7 text-white">
                  <h3 className="font-serif text-2xl font-medium">
                    Download your complete budget guide
                  </h3>
                  <p className="mt-2 text-[14px] text-white/65">
                    A counselor will email your itemised {result.country.name} budget — flight,
                    living and official funds — with the verified rule sources attached.
                  </p>
                  <Link
                    to={`/contact?program=${encodeURIComponent(
                      `Cost Planner — ${result.country.name} (${result.purpose})`,
                    )}`}
                    className="btn-gold mt-5"
                  >
                    Discuss this estimate <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
