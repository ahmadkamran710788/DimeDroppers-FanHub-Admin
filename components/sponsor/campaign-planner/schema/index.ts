import * as yup from "yup";
import { parseMoney } from "@/utils/helper";
import { ALL } from "@/components/common/multi-select";
import { MAX_BUDGET_CENTS, MAX_RADIUS_MILES, MIN_BUDGET_CENTS } from "@/components/sponsor/campaign-planner/data";

const centsOf = (budget: string | undefined) => Math.round(parseMoney(budget ?? "") * 100);

// The composer, checked before a plan is asked for (the API checks the same; its budget message is zod's, so
// the friendly one is given here).
export const campaignRequestSchema = yup.object({
  stores: yup
    .mixed<typeof ALL | string[]>()
    .test("some-stores", "Choose at least one of your locations, or all of them", (v) => v === ALL || (Array.isArray(v) && v.length > 0)),
  // Typed as digits only, so a whole number of miles.
  radius: yup
    .string()
    .required("Enter a radius in miles")
    .test("radius", `Enter a radius from 1 to ${MAX_RADIUS_MILES} miles`, (v) => {
      const miles = Number(v);
      return !v || (miles >= 1 && miles <= MAX_RADIUS_MILES);
    }),
  budget: yup
    .string()
    .required("Total budget is required")
    .test("is-amount", "Enter a budget like $60,000", (b) => !b || Number.isFinite(parseMoney(b)))
    .test("min-budget", "Enter a budget of at least $100", (b) => !Number.isFinite(parseMoney(b ?? "")) || centsOf(b) >= MIN_BUDGET_CENTS)
    .test("max-budget", "Enter a budget of $1,000,000,000 or less", (b) => !Number.isFinite(parseMoney(b ?? "")) || centsOf(b) <= MAX_BUDGET_CENTS),
});
