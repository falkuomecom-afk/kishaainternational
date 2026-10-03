import { Link } from "react-router";
import { Inbox, Clock, FileText, Globe2, AlertTriangle } from "lucide-react";
import { trpc } from "@/providers/trpc";

const STAGE_BADGE: Record<string, string> = {
  new: "bg-gold/15 text-gold-dark",
  contacted: "bg-blue-50 text-blue-700",
  qualified: "bg-emerald-50 text-emerald-700",
  consultation: "bg-purple-50 text-purple-700",
  enrolled: "bg-green-100 text-green-800",
  closed: "bg-navy/5 text-navy/50",
};

export default function Dashboard() {
  const { data } = trpc.content.admin.dashboard.useQuery();

  return (
    <div>
      <h1 className="font-serif text-3xl font-medium text-navy">Dashboard</h1>
      <p className="mt-1 text-[14px] text-navy/55">
        New enquiries, follow-ups due and content status.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Inbox, label: "New enquiries", value: data?.leadStats?.newCount ?? 0, gold: true },
          { icon: Clock, label: "Total leads", value: data?.leadStats?.total ?? 0 },
          { icon: AlertTriangle, label: "Follow-ups overdue", value: data?.leadStats?.overdue ?? 0 },
          { icon: FileText, label: "Published content", value: (data?.content?.pages ?? 0) + (data?.content?.posts ?? 0) + (data?.content?.programs ?? 0) },
        ].map((s) => (
          <div key={s.label} className="border border-navy/10 bg-white p-6">
            <s.icon className={`h-5 w-5 ${s.gold ? "text-gold-dark" : "text-navy/40"}`} />
            <p className="mt-3 font-serif text-4xl text-navy">{Number(s.value)}</p>
            <p className="mt-1 text-[12px] uppercase tracking-[0.12em] text-navy/50">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 border border-navy/10 bg-white">
        <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
          <h2 className="font-serif text-xl text-navy">Latest enquiries</h2>
          <Link to="/admin/leads" className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gold-dark">
            Open pipeline →
          </Link>
        </div>
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-navy/10 text-[11px] uppercase tracking-[0.12em] text-navy/45">
              <th className="px-6 py-3">Ref</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Interest</th>
              <th className="px-6 py-3">Stage</th>
              <th className="px-6 py-3">Received</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recentLeads ?? []).map((l) => (
              <tr key={l.id} className="border-b border-navy/5 last:border-0 hover:bg-paper/60">
                <td className="px-6 py-3">
                  <Link to={`/admin/leads/${l.id}`} className="font-medium text-gold-dark">
                    {l.ref}
                  </Link>
                </td>
                <td className="px-6 py-3 text-navy">{l.name}</td>
                <td className="px-6 py-3 text-navy/65">{l.interest}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 text-[11px] font-semibold uppercase ${STAGE_BADGE[l.stage]}`}>
                    {l.stage}
                  </span>
                </td>
                <td className="px-6 py-3 text-navy/50">
                  {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {(data?.recentLeads ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-navy/45">
                  No enquiries yet — submitted forms will appear here instantly.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {[
          { icon: Globe2, label: "Countries in planner", value: data?.content?.countries ?? 0 },
          { icon: FileText, label: "Programs / services", value: data?.content?.programs ?? 0 },
          { icon: FileText, label: "Guides & posts", value: data?.content?.posts ?? 0 },
        ].map((s) => (
          <div key={s.label} className="border border-navy/10 bg-white p-6">
            <s.icon className="h-5 w-5 text-navy/40" />
            <p className="mt-3 font-serif text-3xl text-navy">{Number(s.value)}</p>
            <p className="mt-1 text-[12px] uppercase tracking-[0.12em] text-navy/50">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
