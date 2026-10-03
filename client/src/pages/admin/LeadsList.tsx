import { useState } from "react";
import { Link } from "react-router";
import { Search, Download } from "lucide-react";
import { trpc } from "@/providers/trpc";

const STAGES = ["all", "new", "contacted", "qualified", "consultation", "enrolled", "closed"];
const STAGE_BADGE: Record<string, string> = {
  new: "bg-gold/15 text-gold-dark",
  contacted: "bg-blue-50 text-blue-700",
  qualified: "bg-emerald-50 text-emerald-700",
  consultation: "bg-purple-50 text-purple-700",
  enrolled: "bg-green-100 text-green-800",
  closed: "bg-navy/5 text-navy/50",
};

export default function LeadsList() {
  const [stage, setStage] = useState("all");
  const [q, setQ] = useState("");
  const { data: leads } = trpc.leads.list.useQuery({ stage, q });
  const exportCsv = trpc.leads.exportCsv.useQuery(undefined, { enabled: false });
  const { data: me } = trpc.auth.me.useQuery();

  async function downloadCsv() {
    const res = await exportCsv.refetch();
    if (!res.data?.csv) return;
    const blob = new Blob([res.data.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kishaa-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium text-navy">Leads</h1>
          <p className="mt-1 text-[14px] text-navy/55">
            Every enquiry, owned and tracked — New → Contacted → Qualified → Consultation → Outcome.
          </p>
        </div>
        {me?.role === "admin" && (
          <button onClick={downloadCsv} className="btn-frame !py-2">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/35" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, ref, email, phone…"
            className="w-72 border border-navy/15 bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none focus:border-gold"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                stage === s
                  ? "border-navy bg-navy text-white"
                  : "border-navy/15 bg-white text-navy/60 hover:border-navy/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto border border-navy/10 bg-white">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-navy/10 text-[11px] uppercase tracking-[0.12em] text-navy/45">
              <th className="px-5 py-3">Ref</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3">Interest</th>
              <th className="px-5 py-3">Source</th>
              <th className="px-5 py-3">Stage</th>
              <th className="px-5 py-3">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((l) => {
              const overdue =
                l.nextFollowUp && new Date(l.nextFollowUp) < new Date() && !["enrolled", "closed"].includes(l.stage);
              return (
                <tr key={l.id} className="border-b border-navy/5 last:border-0 hover:bg-paper/60">
                  <td className="px-5 py-3">
                    <Link to={`/admin/leads/${l.id}`} className="font-medium text-gold-dark">
                      {l.ref}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-medium text-navy">{l.name}</td>
                  <td className="px-5 py-3 text-navy/65">
                    {l.contactPref === "email" ? l.email : l.phone}
                    <span className="ml-1 text-[11px] uppercase text-navy/40">({l.contactPref})</span>
                  </td>
                  <td className="max-w-48 truncate px-5 py-3 text-navy/65">{l.program ?? l.interest}</td>
                  <td className="px-5 py-3 text-navy/50">{l.source}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 text-[11px] font-semibold uppercase ${STAGE_BADGE[l.stage]}`}>
                      {l.stage}
                    </span>
                  </td>
                  <td className={`px-5 py-3 ${overdue ? "font-semibold text-red-600" : "text-navy/50"}`}>
                    {l.nextFollowUp ? new Date(l.nextFollowUp).toLocaleDateString() : "—"}
                    {overdue && " · overdue"}
                  </td>
                </tr>
              );
            })}
            {(leads ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-navy/45">
                  No leads match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
