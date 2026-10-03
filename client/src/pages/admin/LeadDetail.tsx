import { useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Phone, Mail, MessageCircle } from "lucide-react";
import { trpc } from "@/providers/trpc";

const STAGES = ["new", "contacted", "qualified", "consultation", "enrolled", "closed"] as const;

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const leadId = Number(id);
  const utils = trpc.useUtils();
  const { data } = trpc.leads.detail.useQuery({ id: leadId });
  const [note, setNote] = useState("");
  const [closeReason, setCloseReason] = useState("");
  const [followUp, setFollowUp] = useState("");

  const stage = trpc.leads.updateStage.useMutation({
    onSuccess: () => utils.leads.detail.invalidate({ id: leadId }),
  });
  const addNote = trpc.leads.addNote.useMutation({
    onSuccess: () => {
      setNote("");
      utils.leads.detail.invalidate({ id: leadId });
    },
  });

  if (!data) return <div className="text-navy/50">Loading lead…</div>;
  const { lead, activities } = data;

  return (
    <div>
      <Link
        to="/admin/leads"
        className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-navy/50 hover:text-gold-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Pipeline
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="border border-navy/10 bg-white p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] uppercase tracking-[0.14em] text-navy/45">{lead.ref}</p>
                <h1 className="mt-1 font-serif text-3xl font-medium text-navy">{lead.name}</h1>
              </div>
              <span className="bg-navy px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-gold">
                {lead.stage}
              </span>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["Interest", lead.interest],
                ["Program", lead.program ?? "—"],
                ["Country", lead.country ?? "—"],
                ["Source", `${lead.source}${lead.page ? ` · ${lead.page}` : ""}`],
                ["Marketing consent", lead.marketingConsent ? "Opted in" : "No"],
                ["Received", lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-navy/45">{k}</dt>
                  <dd className="mt-0.5 text-[14px] text-navy">{v}</dd>
                </div>
              ))}
            </dl>
            {lead.message && (
              <div className="mt-6 border-l-2 border-gold bg-paper p-4 text-[14px] text-navy/75">
                {lead.message}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2.5">
              {lead.phone && (
                <>
                  <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="btn-frame !px-4 !py-2">
                    <Phone className="h-4 w-4" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-frame !px-4 !py-2"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="btn-frame !px-4 !py-2">
                  <Mail className="h-4 w-4" /> Email
                </a>
              )}
            </div>
          </div>

          {/* Stage workflow */}
          <div className="mt-6 border border-navy/10 bg-white p-7">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-navy/55">
              Update stage
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s}
                  disabled={stage.isPending || lead.stage === s}
                  onClick={() =>
                    stage.mutate({
                      id: leadId,
                      stage: s,
                      note: note || undefined,
                      closeReason: s === "closed" ? closeReason : undefined,
                      nextFollowUp: followUp ? new Date(followUp).toISOString() : undefined,
                    })
                  }
                  className={`border px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                    lead.stage === s
                      ? "border-navy bg-navy text-white"
                      : "border-navy/15 text-navy/60 hover:border-navy"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="datetime-local"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className="border border-navy/15 px-3 py-2.5 text-[14px] outline-none focus:border-gold"
                aria-label="Next follow-up date"
              />
              {lead.stage !== "closed" && (
                <input
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="Close reason (if closing)"
                  className="border border-navy/15 px-3 py-2.5 text-[14px] outline-none focus:border-gold"
                />
              )}
            </div>
          </div>
        </div>

        {/* Activity timeline */}
        <div className="lg:col-span-5">
          <div className="border border-navy/10 bg-white p-7">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-navy/55">
              Activity timeline
            </h2>
            <div className="mt-5 space-y-5">
              {activities.map((a) => (
                <div key={a.id} className="border-l-2 border-gold/50 pl-4">
                  <p className="text-[13px] font-semibold text-navy">
                    {a.type === "stage_change"
                      ? `${a.priorStage} → ${a.newStage}`
                      : a.type === "created"
                        ? "Enquiry received"
                        : "Note"}
                    <span className="ml-2 font-normal text-navy/40">by {a.actor}</span>
                  </p>
                  {a.note && <p className="mt-1 text-[13px] text-navy/65">{a.note}</p>}
                  <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-navy/35">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-navy/10 pt-5">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Record a contact attempt, outcome or note…"
                className="min-h-20 w-full border border-navy/15 px-3 py-2.5 text-[14px] outline-none focus:border-gold"
              />
              <button
                onClick={() => note.trim() && addNote.mutate({ id: leadId, note: note.trim() })}
                disabled={addNote.isPending || !note.trim()}
                className="btn-fill mt-3 !py-2 disabled:opacity-50"
              >
                Add note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
