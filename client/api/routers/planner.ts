import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import * as s from "@db/schema";

type LivingCosts = {
  currency: string;
  budget: number;
  standard: number;
  comfortable: number;
  note?: string;
};
type FundsRule = {
  amount: number;
  currency: string;
  months?: number;
  holderRule?: string;
  note?: string;
  sourceUrl?: string;
  effectiveDate?: string;
};
type FlightLeg = { from: string; priceMin: number; priceMax: number; currency: string };

/**
 * Cost planner engine — implements the three separated formulas from the
 * Kishaa specification:
 *  1. Flight ticket estimate (indicative supplier range + baggage/season)
 *  2. Monthly living cost (rent + food + transit + insurance + utilities)
 *  3. Official bank statement / maintenance funds rule
 * Outputs are never merged: spending vs statutory holdings stay separate.
 */
export const plannerRouter = createRouter({
  estimate: publicQuery
    .input(
      z.object({
        countrySlug: z.string(),
        purpose: z.enum(["study", "visit", "work", "business"]),
        scenario: z.enum(["budget", "standard", "comfortable"]).default("standard"),
        stayMonths: z.number().int().min(1).max(60).default(6),
        dependants: z.number().int().min(0).max(10).default(0),
        origin: z.enum(["DXB", "LHE", "ISB", "KHI"]).default("LHE"),
        cabin: z.enum(["economy", "premium", "business"]).default("economy"),
        travellers: z.number().int().min(1).max(9).default(1),
        selfFunds: z.number().min(0).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const country = (
        await getDb()
          .select()
          .from(s.countries)
          .where(eq(s.countries.slug, input.countrySlug))
          .limit(1)
      ).at(0);
      if (!country) throw new TRPCError({ code: "NOT_FOUND", message: "Unknown destination" });

      const living = country.livingCosts
        ? (JSON.parse(country.livingCosts) as LivingCosts)
        : null;
      const funds = country.fundsRule ? (JSON.parse(country.fundsRule) as FundsRule) : null;
      const flights = country.flightGuide
        ? (JSON.parse(country.flightGuide) as FlightLeg[])
        : [];

      /* 1 — Flight ticket (indicative until live airline API is connected) */
      const leg =
        flights.find((f) => f.from === input.origin) ??
        flights.find((f) => f.from === "LHE") ??
        flights[0];
      const cabinMult = input.cabin === "economy" ? 1 : input.cabin === "premium" ? 1.6 : 2.8;
      const seasonal = 1.08; // seasonal multiplier, per spec formula
      const flight = leg
        ? {
            from: leg.from,
            currency: leg.currency,
            min: Math.round(leg.priceMin * cabinMult * seasonal) * input.travellers,
            max: Math.round(leg.priceMax * cabinMult * seasonal) * input.travellers,
            freshness: "indicative" as const,
            note: "Indicative range. Live fares are confirmed by the admissions team via the airline search API.",
          }
        : null;

      /* 2 — Living costs for the stay */
      const livingOut = living
        ? {
            currency: living.currency,
            monthly: living[input.scenario],
            stayTotal: living[input.scenario] * input.stayMonths,
            dependantUplift:
              input.dependants > 0
                ? Math.round(living[input.scenario] * 0.45 * input.dependants * input.stayMonths)
                : 0,
            note: living.note,
            freshness: "indicative" as const,
          }
        : null;

      /* 3 — Official bank statement / maintenance funds */
      const fundsOut = funds
        ? {
            currency: funds.currency,
            amount: funds.amount,
            dependantTotal:
              input.dependants > 0
                ? Math.round(funds.amount * (1 + 0.35 * input.dependants))
                : funds.amount,
            months: funds.months,
            holderRule: funds.holderRule,
            note: funds.note,
            sourceUrl: funds.sourceUrl,
            effectiveDate: funds.effectiveDate,
            freshness: "official" as const,
          }
        : null;

      const requiredFunds = fundsOut ? fundsOut.dependantTotal : null;
      const gap =
        input.selfFunds !== undefined && requiredFunds !== null
          ? requiredFunds - input.selfFunds
          : null;

      return {
        country: { name: country.name, slug: country.slug, region: country.region },
        purpose: input.purpose,
        scenario: input.scenario,
        stayMonths: input.stayMonths,
        flight,
        living: livingOut,
        funds: fundsOut,
        gap,
        moreInfoNeeded: !living && !funds,
        disclaimer:
          "Estimates are indicative planning figures. Official embassy maintenance rules are verified against government sources with the effective dates shown. Flight fares are confirmed live at consultation.",
      };
    }),
});
