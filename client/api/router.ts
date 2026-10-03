import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { contentRouter } from "./routers/content";
import { leadsRouter } from "./routers/leads";
import { plannerRouter } from "./routers/planner";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  content: contentRouter,
  leads: leadsRouter,
  planner: plannerRouter,
});

export type AppRouter = typeof appRouter;
