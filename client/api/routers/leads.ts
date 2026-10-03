import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, adminQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as s from "@db/schema";

function makeRef() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `KI-${ymd}-${rand}`;
}

export const leadsRouter = createRouter({
  /* ---------------------------- public capture ---------------------------- */
  submit: publicQuery
    .input(
      z.object({
        name: z.string().min(2).max(255),
        phone: z.string().max(64).optional(),
        email: z.string().email().max(320).optional().or(z.literal("")),
        interest: z.string().min(1).max(120),
        contactPref: z.enum(["phone", "whatsapp", "email"]).default("whatsapp"),
        message: z.string().max(2000).optional(),
        country: z.string().max(120).optional(),
        program: z.string().max(255).optional(),
        source: z.string().max(120).default("Website"),
        page: z.string().max(255).optional(),
        consentNotice: z.literal(true),
        marketingConsent: z.boolean().default(false),
        idempotencyKey: z.string().min(8).max(64),
        website: z.string().max(0).optional(), // honeypot — must be empty
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Require the selected channel's contact detail
      if (input.contactPref !== "email" && !input.phone)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A phone / WhatsApp number is required for this contact method.",
        });
      if (input.contactPref === "email" && !input.email)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An email address is required for email contact.",
        });

      // Idempotency: return the existing lead instead of duplicating
      const existing = await db
        .select()
        .from(s.leads)
        .where(eq(s.leads.idempotencyKey, input.idempotencyKey))
        .limit(1);
      if (existing.at(0)) {
        return { ok: true, ref: existing[0].ref, duplicate: true };
      }

      const ref = makeRef();
      const { website: _hp, ...data } = input;
      const res = await db.insert(s.leads).values({
        ...data,
        email: data.email || null,
        ref,
        stage: "new",
      });
      const leadId = Number(res[0].insertId);
      await db.insert(s.leadActivities).values({
        leadId,
        actor: "System",
        type: "created",
        note: `Enquiry received via ${data.source}${data.page ? ` on ${data.page}` : ""}.`,
        newStage: "new",
      });
      return { ok: true, ref, duplicate: false };
    }),

  /* ---------------------------- admin pipeline ---------------------------- */
  list: authedQuery
    .input(
      z
        .object({
          stage: z.string().optional(),
          q: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const rows = await getDb()
        .select()
        .from(s.leads)
        .orderBy(desc(s.leads.createdAt));
      let out = rows;
      if (input?.stage && input.stage !== "all")
        out = out.filter((l) => l.stage === input.stage);
      if (input?.q) {
        const q = input.q.toLowerCase();
        out = out.filter(
          (l) =>
            l.name.toLowerCase().includes(q) ||
            (l.email ?? "").toLowerCase().includes(q) ||
            (l.phone ?? "").includes(q) ||
            l.ref.toLowerCase().includes(q),
        );
      }
      return out;
    }),

  detail: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const lead = (await db.select().from(s.leads).where(eq(s.leads.id, input.id)).limit(1)).at(0);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      const activities = await db
        .select()
        .from(s.leadActivities)
        .where(eq(s.leadActivities.leadId, input.id))
        .orderBy(desc(s.leadActivities.createdAt));
      return { lead, activities };
    }),

  updateStage: authedQuery
    .input(
      z.object({
        id: z.number(),
        stage: z.enum(["new", "contacted", "qualified", "consultation", "enrolled", "closed"]),
        note: z.string().max(2000).optional(),
        closeReason: z.string().max(255).optional(),
        nextFollowUp: z.string().datetime().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const lead = (await db.select().from(s.leads).where(eq(s.leads.id, input.id)).limit(1)).at(0);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      await db
        .update(s.leads)
        .set({
          stage: input.stage,
          closeReason: input.stage === "closed" ? input.closeReason : lead.closeReason,
          nextFollowUp: input.nextFollowUp ? new Date(input.nextFollowUp) : lead.nextFollowUp,
          ownerId: ctx.user?.id ?? lead.ownerId,
        })
        .where(eq(s.leads.id, input.id));
      await db.insert(s.leadActivities).values({
        leadId: input.id,
        actor: ctx.user?.name ?? "Staff",
        type: "stage_change",
        note: input.note,
        priorStage: lead.stage,
        newStage: input.stage,
      });
      return { ok: true };
    }),

  addNote: authedQuery
    .input(z.object({ id: z.number(), note: z.string().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      await getDb().insert(s.leadActivities).values({
        leadId: input.id,
        actor: ctx.user?.name ?? "Staff",
        type: "note",
        note: input.note,
      });
      return { ok: true };
    }),

  exportCsv: adminQuery.query(async () => {
    const rows = await getDb().select().from(s.leads).orderBy(desc(s.leads.createdAt));
    const esc = (v: unknown) =>
      `"${String(v ?? "").replace(/"/g, '""').replace(/^[=+\-@]/, "'$&")}"`;
    const head = "ref,name,phone,email,interest,contactPref,country,program,source,stage,createdAt";
    const body = rows
      .map((l) =>
        [
          l.ref,
          l.name,
          l.phone,
          l.email,
          l.interest,
          l.contactPref,
          l.country,
          l.program,
          l.source,
          l.stage,
          l.createdAt?.toISOString(),
        ]
          .map(esc)
          .join(","),
      )
      .join("\n");
    return { csv: `${head}\n${body}` };
  }),
});
