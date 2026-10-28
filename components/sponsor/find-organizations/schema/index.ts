import * as yup from "yup";
import { parseMoney } from "@/utils/helper";

// Dollars; the API takes up to 100,000,000,000 cents.
const MAX_BUDGET = 1_000_000_000;

// The search filters: everything is optional (no location means any distance, no chip means any).
// A location the API can't geocode answers 400 with its own message.
export const orgSearchSchema = yup.object({
  name: yup.string().trim().max(120, "At most 120 characters"),
  location: yup
    .string()
    .trim()
    .test("length", "Enter at least 2 characters", (v) => !v || v.length >= 2)
    .max(200, "At most 200 characters"),
  // Optional: it only applies with a location, and without a pick the API's default is used.
  radius: yup.string(),
  // Optional; when typed, at least a cent (no planner minimum, it's a filter) and at most the API's
  // budgetCents limit.
  budget: yup
    .string()
    .trim()
    .test("is-amount", "Enter a budget like $60,000", (budget) => {
      if (!budget) return true;
      const amount = parseMoney(budget);
      return Number.isFinite(amount) && amount >= 0.01;
    })
    .test(
      "max",
      "At most $1,000,000,000",
      (budget) => !budget || !(parseMoney(budget) > MAX_BUDGET),
    ),
  season: yup.string(),
});
