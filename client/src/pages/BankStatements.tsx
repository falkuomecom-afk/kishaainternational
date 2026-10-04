import { Link } from "react-router";
import { Landmark, ArrowRight, ShieldCheck, Calculator, ExternalLink, AlertCircle, FileCheck, CheckCircle2 } from "lucide-react";
import { Seo, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { PageHero } from "@/components/site/blocks";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { getGuideThumbnail } from "@/lib/guide-images";

const STATUTORY_RULES = [
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    route: "Student Visa (Subclass 4)",
    amount: "£1,483/mo (London) or £1,136/mo (Outer)",
    currency: "GBP",
    period: "28 consecutive days",
    holdingRule: "Must sit unmoved in applicant or parent bank account; closing balance cannot drop by even £1 during 28 days.",
    authority: "UKVI / Home Office Appendix Finance",
    effectiveDate: "Jan 2026",
    status: "Verified",
    guideSlug: "ukvi-28-day-rule-explained-how-much-must-sit-in-the-bank-for-a-student-visa-2026",
    destinationSlug: "united-kingdom",
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    route: "Student Visa / Sperrkonto",
    amount: "€11,904 / year (€992 / month)",
    currency: "EUR",
    period: "12-month blocked escrow",
    holdingRule: "Deposited into an approved blocked account (Expatrio, Fintiba, Coracle) before visa appointment; pays out monthly in Germany.",
    authority: "Auswärtiges Amt (Federal Foreign Office)",
    effectiveDate: "2026 Intake",
    status: "Verified",
    guideSlug: "germany-blocked-account-sperrkonto-2026-exact-amount-and-payout-rules",
    destinationSlug: "germany",
  },
  {
    country: "Finland",
    flag: "🇫🇮",
    route: "Student Residence Permit",
    amount: "€9,600 / year (€800 / month)",
    currency: "EUR",
    period: "At application filing",
    holdingRule: "Must be in student's sole bank account at filing. Uniquely permits family accompaniment and path to permanent residency.",
    authority: "Finnish Immigration Service (Migri)",
    effectiveDate: "2026 Gazetted",
    status: "Verified",
    guideSlug: "finland-student-permit-why-9-600-covers-you-and-your-family-2026-guide",
    destinationSlug: "finland",
  },
  {
    country: "Canada",
    flag: "🇨🇦",
    route: "10-Year Visit / Study Permit",
    amount: "CAD 20,635 (Study) or PKR 2.5M–4M (Visit)",
    currency: "CAD / PKR",
    period: "4 to 6 months history",
    holdingRule: "Consistent daily balance with legitimate source of income (tax returns, employment, business turnover). No unexplained sudden deposits.",
    authority: "IRCC (Immigration, Refugees and Citizenship Canada)",
    effectiveDate: "Current 2026",
    status: "Verified",
    guideSlug: "canada-10-year-multiple-entry-visit-visa-requirements-cost-and-timeline-2026",
    destinationSlug: "canada",
  },
  {
    country: "Australia",
    flag: "🇦🇺",
    route: "Subclass 500 Student Visa",
    amount: "AUD 29,710 / year + tuition balance",
    currency: "AUD",
    period: "3 months documented funds",
    holdingRule: "Proof of financial capacity including annual living cost (AUD 29,710), 1st-year tuition balance, and AUD 2,000 return travel.",
    authority: "Department of Home Affairs",
    effectiveDate: "Indexed 2025/2026",
    status: "Verified",
    guideSlug: "australia-subclass-500-financial-capacity-oshc-and-the-genuine-student-requirement",
    destinationSlug: "australia",
  },
  {
    country: "Italy",
    flag: "🇮🇹",
    route: "National Visa Type D (Study)",
    amount: "PKR 4.5M–5.5M (approx. €6,000/yr)",
    currency: "EUR / PKR",
    period: "6 months continuous statements",
    holdingRule: "Parent or student bank statements accepted with family tree / FRC certification. Tuition is largely free upon regional scholarship award.",
    authority: "Italian Ministry of Foreign Affairs / Embassy",
    effectiveDate: "2026 Intake",
    status: "Verified",
    guideSlug: "italy-free-tuition-scholarships-for-pakistani-students-eligibility-and-timelines",
    destinationSlug: "italy",
  },
  {
    country: "United States",
    flag: "🇺🇸",
    route: "F-1 Academic Student Visa",
    amount: "Full I-20 Total ($22,000–$45,000)",
    currency: "USD",
    period: "Documented liquid funds",
    holdingRule: "Evidence that liquid funds cover 100% of year-one tuition and living expenses as shown on Form I-20, plus viable funding plan for subsequent years.",
    authority: "US Department of State / SEVP",
    effectiveDate: "Current 2026",
    status: "Verified",
    guideSlug: null,
    destinationSlug: "united-states",
  },
  {
    country: "Georgia",
    flag: "🇬🇪",
    route: "D3 Student Visa (MBBS / Tech)",
    amount: "$2,000–$4,000 living proof",
    currency: "USD",
    period: "Recent bank statement",
    holdingRule: "Low-barrier financial documentation. Tuition $4,000–$5,000/yr payable in instalments. High acceptance rate for Pakistani applicants.",
    authority: "Ministry of Foreign Affairs Georgia",
    effectiveDate: "Current 2026",
    status: "Verified",
    guideSlug: "georgia-mbbs-for-pakistani-students-fees-recognition-and-study-gaps-2026",
    destinationSlug: "georgia",
  },
  {
    country: "United Arab Emirates",
    flag: "🇦🇪",
    route: "Golden Visa & Freelance Permit",
    amount: "Category specific (AED 30,000/mo salary or investment)",
    currency: "AED",
    period: "6 months salary slips / bank statements",
    holdingRule: "Professionals, executives and investors processed via GDRFA/ICP. Freelance Green Visas require verified degree and proof of earnings.",
    authority: "GDRFA / ICP United Arab Emirates",
    effectiveDate: "2026 Gazetted",
    status: "Verified",
    guideSlug: "uae-golden-visa-and-freelance-permit-which-category-actually-fits-you",
    destinationSlug: "uae",
  },
];

const FAQS = [
  {
    question: "Can I borrow funds for a few days to show in my bank statement?",
    answer: "No. Emigration and visa authorities (especially UKVI, IRCC Canada, and Australian Home Affairs) scrutinise sudden, unexplained lump-sum deposits ('parking funds'). Sudden spikes in the closing balance without documented provenance (such as property sale deeds, verified gratuity, or documented business income) lead to outright visa refusals under false financial declaration rules.",
  },
  {
    question: "What is the UKVI 28-day rule?",
    answer: "For a UK Student Visa, the required maintenance funds (£1,483/month in London or £1,136/month outside London for 9 months, plus outstanding tuition) must sit continuously in your or your parents' bank account for at least 28 consecutive days. The closing balance must not fall below the required threshold for even a single day during that window.",
  },
  {
    question: "How does Germany's Sperrkonto work?",
    answer: "Unlike an ordinary savings account, a German blocked account locks €11,904 before your embassy appointment. Once you arrive and register in Germany, the bank automatically unblocks €992 each month into your local current account to cover living expenses, ensuring you never run out of funds.",
  },
  {
    question: "Are sponsor statements from uncles or friends accepted?",
    answer: "It depends strictly on the country. The UK and Finland strictly require funds in the student's or biological parents' names. Canada and the US permit third-party sponsors with notarised affidavits of support and proof of financial relationship. Germany accepts only a Sperrkonto or an official formal obligation letter (Verpflichtungserklärung).",
  },
];

export default function BankStatements() {
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Bank Statement Rules", path: "/bank-statements" },
    ]),
    faqJsonLd(FAQS),
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Kishaa International Statutory Proof of Funds & Bank Statement Rules 2026",
      description:
        "Official statutory maintenance-funds requirements, holding durations, and gazetted authorities for study and visit visas across the UK, Germany, Finland, Canada, Australia, Italy, USA, and UAE.",
      creator: {
        "@type": "Organization",
        name: "Kishaa International",
        url: "https://www.kishaainternational.com",
      },
      temporalCoverage: "2026",
      license: "https://creativecommons.org/licenses/by/4.0/",
      variableMeasured: [
        "Statutory Maintenance Rate",
        "Mandated Holding Period",
        "Issuing Government Authority",
        "Gazette Effective Date",
      ],
    },
  ];

  return (
    <>
      <Seo
        title="Bank Statement & Proof of Funds Rules by Country (2026)"
        description="Statutory proof-of-funds rules for the UK, Germany, Finland, Italy, Canada, Australia, Georgia and UAE — each with issuing authority, mandated holding period (28 days vs 6 months), and official gazette dates."
        path="/bank-statements"
        jsonLd={jsonLd}
      />

      <PageHero
        eyebrow="Statutory Proof of Funds"
        title="Official bank statement rules, with the source printed beside every number."
        lede="These are the exact legal amounts that must sit in an approved bank account, held for the mandated statutory duration — completely isolated from your daily travel and flight spending."
      />

      {/* Answer-First AEO Box */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="border border-gold/40 bg-gold/5 p-6 sm:p-8 rounded-sm">
          <div className="flex items-start gap-3.5">
            <ShieldCheck className="h-6 w-6 text-gold-dark shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Official Standard · Answer-First Rule
              </p>
              <h2 className="mt-1 font-serif text-xl sm:text-2xl font-medium text-navy">
                How much money must sit in the bank for a student or visit visa?
              </h2>
              <p className="mt-3 text-[15px] sm:text-[16px] leading-relaxed text-navy/80">
                It depends strictly on destination statutory rules. The <strong>UK</strong> requires £1,483/month (London) or £1,136/month (outside London) for 9 months, held strictly for <strong>28 consecutive days</strong>. <strong>Germany</strong> mandates <strong>€11,904</strong> in a locked blocked account (Sperrkonto). <strong>Finland</strong> requires <strong>€9,600</strong> in your own account. <strong>Canada</strong> expects 4 to 6 months of legitimate banking history. <strong>Australia</strong> indexes living capacity at <strong>AUD 29,710</strong>.
              </p>
              <p className="mt-2 text-sm text-navy/60">
                Advisory rule: Never deposit borrowed lump-sums without documented provenance. Visa officers require documented origin of funds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statutory Rules Table */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b-2 border-gold pb-4 mb-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-navy">
              Statutory Maintenance Register (2026)
            </h2>
            <p className="mt-1 text-sm text-navy/65">
              Source-checked against official immigration gazettes and diplomatic missions.
            </p>
          </div>
          <Link
            to="/cost-planner"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-dark hover:text-navy transition-colors"
          >
            <Calculator className="h-4 w-4" /> Calculate live budget in Cost Planner
          </Link>
        </div>

        <div className="overflow-x-auto rounded-sm border border-navy/10 bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-navy text-white text-[12px] uppercase tracking-wider">
                <th className="py-4 px-4 font-semibold">Destination</th>
                <th className="py-4 px-4 font-semibold">Visa Pathway</th>
                <th className="py-4 px-4 font-semibold">Statutory Amount</th>
                <th className="py-4 px-4 font-semibold">Mandated Holding Period</th>
                <th className="py-4 px-4 font-semibold">Issuing Authority</th>
                <th className="py-4 px-4 font-semibold text-right">In-Depth Guide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 text-navy/80">
              {STATUTORY_RULES.map((rule, idx) => (
                <tr key={rule.country} className={idx % 2 === 0 ? "bg-white" : "bg-paper/50"}>
                  <td className="py-4 px-4 font-medium text-navy flex items-center gap-2">
                    <span className="text-xl">{rule.flag}</span>
                    <Link to={`/destinations/${rule.destinationSlug}`} className="hover:text-gold-dark underline-offset-2 hover:underline">
                      {rule.country}
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-xs font-medium">{rule.route}</td>
                  <td className="py-4 px-4 font-semibold text-navy">
                    {rule.amount}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-gold/15 text-gold-dark mb-1">
                      {rule.period}
                    </span>
                    <p className="text-[12px] text-navy/60 max-w-xs">{rule.holdingRule}</p>
                  </td>
                  <td className="py-4 px-4 text-xs text-navy/70">
                    <span className="block font-medium text-navy">{rule.authority}</span>
                    <span className="text-[11px] text-navy/50">{rule.effectiveDate}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {rule.guideSlug ? (
                      <Link
                        to={`/resources/${rule.guideSlug}`}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-gold-dark hover:text-navy group"
                      >
                        Read guide <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ) : (
                      <Link
                        to={`/destinations/${rule.destinationSlug}`}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-navy/60 hover:text-navy"
                      >
                        View country <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Editorial Guides Strip */}
      <section className="bg-paper py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <p className="eyebrow text-gold-dark font-semibold text-[11px] uppercase tracking-[0.2em]">
                Pillar Intelligence
              </p>
              <h2 className="mt-1 font-serif text-3xl font-medium text-navy">
                Essential Proof of Funds & Visa Guides
              </h2>
            </div>
            <Link to="/resources" className="text-sm font-semibold uppercase tracking-wider text-navy hover:text-gold-dark">
              View all 14 guides →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Link
              to="/resources/ukvi-28-day-rule-explained-how-much-must-sit-in-the-bank-for-a-student-visa-2026"
              className="group bg-white border border-navy/10 hover:border-gold hover:shadow-lg transition-all rounded-[4px] flex flex-col justify-between overflow-hidden"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-navy/95 border-b border-navy/10">
                <img
                  src={getGuideThumbnail("ukvi-28-day-rule-explained-how-much-must-sit-in-the-bank-for-a-student-visa-2026")}
                  alt="UKVI 28-Day Rule"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider text-[#ECC248] bg-navy/90 backdrop-blur-md px-2 py-0.5 rounded border border-gold/30">
                  UK 2026 Regulation
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-medium text-navy group-hover:text-gold-dark transition-colors">
                    UKVI 28-Day Rule: How Much Must Sit in the Bank
                  </h3>
                  <p className="mt-2 text-sm text-navy/65 line-clamp-3">
                    London (£1,483/mo) vs outer (£1,136/mo), acceptable financial institutions in Pakistan, parent consent letters, and the 31-day statement date limit.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-navy group-hover:text-gold-dark transition-colors">
                  Read UK guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            <Link
              to="/resources/germany-blocked-account-sperrkonto-2026-exact-amount-and-payout-rules"
              className="group bg-white border border-navy/10 hover:border-gold hover:shadow-lg transition-all rounded-[4px] flex flex-col justify-between overflow-hidden"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-navy/95 border-b border-navy/10">
                <img
                  src={getGuideThumbnail("germany-blocked-account-sperrkonto-2026-exact-amount-and-payout-rules")}
                  alt="Germany Blocked Account Sperrkonto"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider text-[#ECC248] bg-navy/90 backdrop-blur-md px-2 py-0.5 rounded border border-gold/30">
                  Germany Sperrkonto
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-medium text-navy group-hover:text-gold-dark transition-colors">
                    Germany Blocked Account 2026: €11,904 Payout Rules
                  </h3>
                  <p className="mt-2 text-sm text-navy/65 line-clamp-3">
                    Why €11,904 is required, comparing Expatrio vs Fintiba vs Coracle, health insurance bundling, and tax id verification upon arrival.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-navy group-hover:text-gold-dark transition-colors">
                  Read Germany guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            <Link
              to="/resources/finland-student-permit-why-9-600-covers-you-and-your-family-2026-guide"
              className="group bg-white border border-navy/10 hover:border-gold hover:shadow-lg transition-all rounded-[4px] flex flex-col justify-between overflow-hidden"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-navy/95 border-b border-navy/10">
                <img
                  src={getGuideThumbnail("finland-student-permit-why-9-600-covers-you-and-your-family-2026-guide")}
                  alt="Finland Student Permit"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider text-[#ECC248] bg-navy/90 backdrop-blur-md px-2 py-0.5 rounded border border-gold/30">
                  Finland Family & PR
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-medium text-navy group-hover:text-gold-dark transition-colors">
                    Finland Student Permit: Why €9,600 Covers You & Family
                  </h3>
                  <p className="mt-2 text-sm text-navy/65 line-clamp-3">
                    Migri statutory threshold (€800/mo), spouse work permit rights without quota restrictions, children education, and permanent residency rules.
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-navy group-hover:text-gold-dark transition-colors">
                  Read Finland guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Notice on Verification */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="border-l-4 border-navy bg-paper p-6 rounded-r-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-navy shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-navy text-sm uppercase tracking-wider">
                Why Some Rules Are Flagged For Counselor Verification
              </h3>
              <p className="mt-1 text-sm text-navy/70 leading-relaxed">
                When a statutory amount is reported in foreign parliamentary gazettes but not yet updated on local embassy checklists, we withhold automated calculation and require our admissions counselors to review your specific profile. A published figure that is outdated is worse than no figure at all.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 border-t border-navy/10">
        <h2 className="font-serif text-3xl font-medium text-navy mb-8">
          Bank Statement Frequently Asked Questions
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {FAQS.map((faq) => (
            <div key={faq.question} className="border border-navy/10 p-6 bg-white rounded-sm">
              <h3 className="font-serif text-lg font-medium text-navy mb-2 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold-dark shrink-0 mt-1" />
                {faq.question}
              </h3>
              <p className="text-sm leading-relaxed text-navy/70 pl-6">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Consultation Section */}
      <section className="bg-navy text-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="eyebrow-light">Expert Verification</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-medium">
              Have our senior counselors audit your bank statement
            </h2>
            <p className="mt-3 text-white/70 max-w-xl mx-auto text-sm sm:text-base">
              Avoid refusals. We inspect your closing balances, source documentation, transaction frequencies, and timeline alignment before you lodge.
            </p>
          </div>
          <div className="bg-white text-navy p-6 sm:p-8 rounded-sm shadow-xl">
            <EnquiryForm variant="full" />
          </div>
        </div>
      </section>
    </>
  );
}
