import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { trpc } from "@/providers/trpc";

type FieldType = "text" | "textarea" | "select" | "checkbox" | "number";
type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  hint?: string;
};
type CollectionDef = {
  label: string;
  titleKey: string;
  subKey?: string;
  fields: Field[];
};

const DEFS: Record<string, CollectionDef> = {
  pages: {
    label: "Pages",
    titleKey: "title",
    subKey: "slug",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "Slug (unique)", type: "text", required: true },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "body", label: "Body (markdown)", type: "textarea" },
      { key: "seoTitle", label: "SEO title", type: "text" },
      { key: "seoDescription", label: "SEO description", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
    ],
  },
  posts: {
    label: "Posts / Guides",
    titleKey: "title",
    subKey: "category",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "Slug (unique)", type: "text", required: true },
      { key: "category", label: "Category", type: "text" },
      { key: "tags", label: "Tags (comma separated)", type: "text" },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "body", label: "Body (markdown)", type: "textarea" },
      { key: "seoTitle", label: "SEO title", type: "text" },
      { key: "seoDescription", label: "SEO description", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
    ],
  },
  programs: {
    label: "Programs & Services",
    titleKey: "name",
    subKey: "pillar",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "slug", label: "Slug (unique)", type: "text", required: true },
      { key: "pillar", label: "Pillar", type: "select", options: ["career", "immigration", "cambridge"], required: true },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "audience", label: "Who this is for", type: "textarea" },
      { key: "delivery", label: "Delivery", type: "text" },
      { key: "duration", label: "Duration / timeline", type: "text" },
      { key: "fees", label: "Fees", type: "textarea" },
      { key: "currency", label: "Currency", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "highlights", label: "Highlights (one per line)", type: "textarea" },
      { key: "featured", label: "Featured on homepage", type: "checkbox" },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
    ],
  },
  team: {
    label: "Team",
    titleKey: "name",
    subKey: "role",
    fields: [
      { key: "name", label: "Name (approved spelling)", type: "text", required: true },
      { key: "slug", label: "Slug (unique)", type: "text", required: true },
      { key: "role", label: "Role / title", type: "text", required: true },
      { key: "bio", label: "Approved bio", type: "textarea" },
      { key: "credentials", label: "Credentials (one per line)", type: "textarea" },
      { key: "expertise", label: "Expertise (one per line)", type: "textarea" },
      { key: "languages", label: "Languages", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "featured", label: "Featured", type: "checkbox" },
      { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
    ],
  },
  testimonials: {
    label: "Testimonials",
    titleKey: "authorName",
    subKey: "context",
    fields: [
      { key: "quote", label: "Quote", type: "textarea", required: true },
      { key: "authorName", label: "Client display name", type: "text", required: true },
      { key: "context", label: "Context (e.g. UK admission 2026)", type: "text" },
      { key: "program", label: "Linked program", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "rating", label: "Rating (1-5)", type: "number" },
      { key: "source", label: "Source", type: "select", options: ["direct", "google", "facebook", "trustpilot"] },
      { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
    ],
  },
  faqs: {
    label: "FAQs",
    titleKey: "question",
    subKey: "category",
    fields: [
      { key: "question", label: "Question", type: "text", required: true },
      { key: "answer", label: "Answer", type: "textarea", required: true },
      { key: "category", label: "Category", type: "select", options: ["General", "Admissions", "Immigration", "Training"] },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
    ],
  },
  countries: {
    label: "Countries / Planner Data",
    titleKey: "name",
    subKey: "region",
    fields: [
      { key: "name", label: "Country name", type: "text", required: true },
      { key: "slug", label: "Slug (unique)", type: "text", required: true },
      { key: "region", label: "Region", type: "text", required: true },
      { key: "flag", label: "Flag emoji", type: "text" },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "visaInfo", label: "Visa pathway info", type: "textarea" },
      { key: "tuitionInfo", label: "Tuition info", type: "textarea" },
      { key: "livingCosts", label: "Living costs JSON", type: "textarea", hint: '{"currency":"GBP","budget":1023,"standard":1180,"comfortable":1344,"note":"…"}' },
      { key: "fundsRule", label: "Funds rule JSON", type: "textarea", hint: '{"amount":12006,"currency":"GBP","months":9,"holderRule":"…","note":"…","sourceUrl":"…","effectiveDate":"2026-01"}' },
      { key: "flightGuide", label: "Flight guide JSON", type: "textarea", hint: '[{"from":"LHE","priceMin":550,"priceMax":900,"currency":"USD"}]' },
      { key: "seoTitle", label: "SEO title", type: "text" },
      { key: "seoDescription", label: "SEO description", type: "textarea" },
      { key: "featured", label: "Featured", type: "checkbox" },
      { key: "sortOrder", label: "Sort order", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["draft", "published", "archived"] },
    ],
  },
  reviews: {
    label: "Review Cache",
    titleKey: "author",
    subKey: "platform",
    fields: [
      { key: "platform", label: "Platform", type: "select", options: ["google", "facebook", "trustpilot"], required: true },
      { key: "author", label: "Reviewer name", type: "text", required: true },
      { key: "rating", label: "Rating (1-5)", type: "number" },
      { key: "text", label: "Review text", type: "textarea" },
      { key: "reviewDate", label: "Review date", type: "text" },
      { key: "permalink", label: "Link to original", type: "text" },
      { key: "visible", label: "Visible on site", type: "checkbox" },
    ],
  },
  redirects: {
    label: "Redirects",
    titleKey: "oldPath",
    subKey: "newPath",
    fields: [
      { key: "oldPath", label: "Old path", type: "text", required: true },
      { key: "newPath", label: "New path", type: "text", required: true },
      { key: "type", label: "Type (301/302)", type: "number" },
    ],
  },
  settings: {
    label: "Site Settings",
    titleKey: "key",
    subKey: "value",
    fields: [
      { key: "key", label: "Setting key", type: "text", required: true },
      { key: "value", label: "Value (JSON or text)", type: "textarea" },
    ],
  },
};

const inputCls =
  "w-full border border-navy/15 bg-white px-3 py-2.5 text-[14px] text-navy outline-none focus:border-gold";

export default function ContentManager() {
  const { collection = "pages" } = useParams();
  const def = DEFS[collection];
  const utils = trpc.useUtils();
  const router = (trpc.content.admin as any)[collection];
  const { data: rows } = router.list.useQuery();
  const invalidate = () => (utils.content.admin as any)[collection].list.invalidate();

  const create = router.create.useMutation({ onSuccess: () => { invalidate(); closeEditor(); } });
  const update = router.update.useMutation({ onSuccess: () => { invalidate(); closeEditor(); } });
  const remove = router.remove.useMutation({ onSuccess: invalidate });

  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const blank = useMemo(() => {
    const o: Record<string, any> = {};
    def?.fields.forEach((f) => {
      o[f.key] = f.type === "checkbox" ? false : f.type === "number" ? 0 : "";
    });
    return o;
  }, [collection]);

  if (!def) return <div className="text-navy/50">Unknown collection.</div>;

  function closeEditor() {
    setEditing(null);
    setError(null);
  }

  function save() {
    if (!editing) return;
    setError(null);
    const payload: Record<string, any> = {};
    for (const f of def.fields) {
      let v = editing[f.key];
      if (f.type === "number") v = Number(v) || 0;
      if (f.type === "checkbox") v = !!v;
      if (v === "") v = undefined;
      if (v !== undefined) payload[f.key] = v;
    }
    // validate JSON fields
    for (const f of def.fields) {
      if (f.hint && payload[f.key]) {
        try {
          JSON.parse(payload[f.key]);
        } catch {
          setError(`${f.label} is not valid JSON.`);
          return;
        }
      }
    }
    const onErr = (e: any) => setError(e.message);
    if (editing.id) update.mutate({ id: editing.id, ...payload }, { onError: onErr });
    else create.mutate(payload, { onError: onErr });
  }

  const saving = create.isPending || update.isPending;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium text-navy">{def.label}</h1>
          <p className="mt-1 text-[14px] text-navy/55">
            {(rows ?? []).length} records · changes go live on save for published items.
          </p>
        </div>
        <button onClick={() => setEditing({ ...blank })} className="btn-fill !py-2.5">
          <Plus className="h-4 w-4" /> Add new
        </button>
      </div>

      <div className="mt-6 overflow-x-auto border border-navy/10 bg-white">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-navy/10 text-[11px] uppercase tracking-[0.12em] text-navy/45">
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">{def.titleKey}</th>
              {def.subKey && <th className="px-5 py-3">{def.subKey}</th>}
              {"status" in blank && <th className="px-5 py-3">Status</th>}
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r: any) => (
              <tr key={r.id} className="border-b border-navy/5 last:border-0 hover:bg-paper/60">
                <td className="px-5 py-3 text-navy/40">{r.id}</td>
                <td className="max-w-72 truncate px-5 py-3 font-medium text-navy">
                  {String(r[def.titleKey] ?? "")}
                </td>
                {def.subKey && (
                  <td className="max-w-56 truncate px-5 py-3 text-navy/60">
                    {String(r[def.subKey] ?? "")}
                  </td>
                )}
                {"status" in blank && (
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-1 text-[11px] font-semibold uppercase ${
                        r.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.status === "draft"
                            ? "bg-gold/15 text-gold-dark"
                            : "bg-navy/5 text-navy/45"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                )}
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => setEditing({ ...r })}
                    className="mr-2 inline-flex items-center gap-1 border border-navy/15 px-3 py-1.5 text-[12px] font-semibold text-navy/70 hover:border-gold hover:text-gold-dark"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${r[def.titleKey]}"? This cannot be undone.`))
                        remove.mutate({ id: r.id });
                    }}
                    className="inline-flex items-center gap-1 border border-red-200 px-3 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-navy/40" onClick={closeEditor}>
          <div
            className="h-full w-full max-w-xl overflow-y-auto bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`${editing.id ? "Edit" : "Create"} ${def.label}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-medium text-navy">
                {editing.id ? `Edit #${editing.id}` : `New ${def.label.replace(/s$/, "")}`}
              </h2>
              <button onClick={closeEditor} aria-label="Close editor">
                <X className="h-5 w-5 text-navy/50" />
              </button>
            </div>
            {error && (
              <p className="mt-4 border border-red-300 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
                {error}
              </p>
            )}
            <div className="mt-6 space-y-4">
              {def.fields.map((f) => (
                <div key={f.key}>
                  {f.type === "checkbox" ? (
                    <label className="flex items-center gap-2.5 text-[14px] text-navy">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#c9a227]"
                        checked={!!editing[f.key]}
                        onChange={(e) => setEditing({ ...editing, [f.key]: e.target.checked })}
                      />
                      {f.label}
                    </label>
                  ) : (
                    <>
                      <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-navy/55">
                        {f.label} {f.required && "*"}
                      </label>
                      {f.type === "textarea" ? (
                        <textarea
                          className={`${inputCls} min-h-28 font-mono text-[13px]`}
                          value={editing[f.key] ?? ""}
                          onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                        />
                      ) : f.type === "select" ? (
                        <select
                          className={inputCls}
                          value={editing[f.key] ?? f.options?.[0]}
                          onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                        >
                          {f.options?.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type === "number" ? "number" : "text"}
                          className={inputCls}
                          value={editing[f.key] ?? ""}
                          onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                        />
                      )}
                      {f.hint && (
                        <p className="mt-1 font-mono text-[11px] text-navy/40">{f.hint}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            <button onClick={save} disabled={saving} className="btn-fill mt-8 w-full disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save & publish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
