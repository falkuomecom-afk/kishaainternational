import { useMemo, useRef, useState } from "react";
import { useLocation, Link } from "react-router";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { newIdempotencyKey } from "@/lib/site";

const INTERESTS = [
  "Career Counseling / University Admissions",
  "Immigration & Visit Visas (Canada LOI, UAE, Schengen)",
  "Cambridge / IELTS Training",
  "Cost Planning & Bank Statements",
  "Other",
];

/**
 * Contextual enquiry form — implements the specification:
 * server validation, honeypot, idempotency token, consent notice,
 * error summary with focus management, values retained on error.
 */
export function EnquiryForm({
  interest,
  program,
  country,
  source = "Website",
  dark = false,
  title = "Request a Consultation",
}: {
  interest?: string;
  program?: string;
  country?: string;
  source?: string;
  dark?: boolean;
  title?: string;
}) {
  const location = useLocation();
  const idem = useMemo(() => newIdempotencyKey(), []);
  const errorRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    interest: interest ?? INTERESTS[0],
    contactPref: "whatsapp" as "phone" | "whatsapp" | "email",
    message: "",
    consentNotice: false,
    marketingConsent: false,
    website: "", // honeypot
  });
  const [clientError, setClientError] = useState<string | null>(null);

  const submit = trpc.leads.submit.useMutation({
    onError: (e) => {
      setClientError(e.message);
      setTimeout(() => errorRef.current?.focus(), 50);
    },
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setClientError(null);
    if (form.name.trim().length < 2) {
      setClientError("Please enter your full name.");
      return;
    }
    if (form.contactPref !== "email" && !form.phone.trim()) {
      setClientError("Please provide your phone / WhatsApp number for this contact method.");
      return;
    }
    if (form.contactPref === "email" && !form.email.trim()) {
      setClientError("Please provide your email address for email contact.");
      return;
    }
    if (!form.consentNotice) {
      setClientError("Please acknowledge the privacy notice to continue.");
      return;
    }
    submit.mutate({
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      interest: form.interest,
      contactPref: form.contactPref,
      message: form.message.trim() || undefined,
      country,
      program,
      source,
      page: location.pathname,
      consentNotice: true,
      marketingConsent: form.marketingConsent,
      idempotencyKey: idem,
      website: form.website,
    });
  }

  const inputCls = `w-full border px-4 py-3 text-[15px] outline-none transition-colors focus:border-gold ${
    dark
      ? "border-white/20 bg-white/5 text-white placeholder:text-white/40"
      : "border-navy/20 bg-white text-navy placeholder:text-navy/35"
  }`;
  const labelCls = `mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.14em] ${
    dark ? "text-white/60" : "text-navy/60"
  }`;

  if (submit.isSuccess) {
    return (
      <div
        className={`border p-8 text-center ${
          dark ? "border-gold/40 bg-white/5" : "border-gold/40 bg-paper"
        }`}
        role="status"
      >
        <CheckCircle2 className="mx-auto h-10 w-10 text-gold" />
        <h3 className={`mt-4 font-serif text-2xl ${dark ? "text-white" : "text-navy"}`}>
          Thank you{submit.data.duplicate ? " — already received" : ""}.
        </h3>
        <p className={`mt-3 text-[15px] leading-relaxed ${dark ? "text-white/70" : "text-navy/70"}`}>
          Your enquiry <span className="font-semibold">{submit.data.ref}</span> has been received by
          Kishaa International. Our team will use your selected contact method to discuss the next
          step. A consultation time is confirmed only after the team agrees it with you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {title && (
        <h3 className={`font-serif text-2xl font-medium ${dark ? "text-white" : "text-navy"}`}>
          {title}
        </h3>
      )}

      {(clientError || submit.isError) && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 outline-none"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {clientError ?? "Something went wrong. Please try again."}
        </div>
      )}

      {/* Honeypot — invisible to humans */}
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="eq-name" className={labelCls}>
            Full name *
          </label>
          <input
            id="eq-name"
            className={inputCls}
            autoComplete="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="eq-phone" className={labelCls}>
            Phone / WhatsApp {form.contactPref === "email" ? "" : "*"}
          </label>
          <input
            id="eq-phone"
            className={inputCls}
            type="tel"
            autoComplete="tel"
            placeholder="+92 3xx xxxxxxx"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="eq-email" className={labelCls}>
            Email {form.contactPref === "email" ? "*" : "(optional)"}
          </label>
          <input
            id="eq-email"
            className={inputCls}
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="eq-interest" className={labelCls}>
            I am interested in *
          </label>
          <select
            id="eq-interest"
            className={inputCls}
            value={form.interest}
            onChange={(e) => set("interest", e.target.value)}
          >
            {INTERESTS.map((i) => (
              <option key={i} value={i} className="text-navy">
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={labelCls}>Preferred contact method *</legend>
        <div className="flex flex-wrap gap-3">
          {(["whatsapp", "phone", "email"] as const).map((m) => (
            <label
              key={m}
              className={`cursor-pointer border px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                form.contactPref === m
                  ? "border-gold bg-gold text-navy"
                  : dark
                    ? "border-white/20 text-white/70 hover:border-gold"
                    : "border-navy/20 text-navy/70 hover:border-gold"
              }`}
            >
              <input
                type="radio"
                name="contactPref"
                className="sr-only"
                checked={form.contactPref === m}
                onChange={() => set("contactPref", m)}
              />
              {m}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="eq-message" className={labelCls}>
          Message (optional)
        </label>
        <textarea
          id="eq-message"
          className={`${inputCls} min-h-24`}
          maxLength={2000}
          placeholder="Tell us briefly about your goals — target country, course or timeline. Please don't share identity documents or financial account details."
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 text-[13px] leading-relaxed">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-[#c9a227]"
            checked={form.consentNotice}
            onChange={(e) => set("consentNotice", e.target.checked)}
          />
          <span className={dark ? "text-white/70" : "text-navy/70"}>
            I have read the{" "}
            <Link to="/privacy" className="text-gold-dark underline underline-offset-2">
              privacy notice
            </Link>{" "}
            and agree to be contacted about my enquiry. *
          </span>
        </label>
        <label className="flex items-start gap-3 text-[13px] leading-relaxed">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 accent-[#c9a227]"
            checked={form.marketingConsent}
            onChange={(e) => set("marketingConsent", e.target.checked)}
          />
          <span className={dark ? "text-white/50" : "text-navy/50"}>
            I would also like to receive occasional program updates (optional).
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submit.isPending}
        className="btn-gold w-full disabled:opacity-60"
      >
        {submit.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          "Submit Enquiry"
        )}
      </button>
    </form>
  );
}
