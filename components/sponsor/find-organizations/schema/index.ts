import * as yup from "yup";
import { parseMoney } from "@/utils/helper";

// Dollars; the API takes up to 100,000,000,000 cents.
const MAX_BUDGET = 1_000_000_000;

// The search filters: everything is optional (no stores means any distance, no chip means any). The stores
// picker itself keeps to the API's 50 ids (or All).
export const orgSearchSchema = yup.object({
  name: yup.string().trim().max(120, "At most 120 characters"),
  // Optional: it only applies with stores, and without a pick the API's default is used.
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
