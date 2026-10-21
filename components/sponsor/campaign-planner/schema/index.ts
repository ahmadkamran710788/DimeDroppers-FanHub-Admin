import * as yup from "yup";
import { formatMoney, parseMoney } from "@/utils/helper";
import { PROMPT_MAX_LENGTH } from "@/components/sponsor/campaign-planner/data";

// Smallest budget Dime AI plans a campaign for.
const MIN_BUDGET = 1000;

// The composer: what the sponsor wants, the budget, the season and the goal.
export const campaignRequestSchema = yup.object({
  prompt: yup
    .string()
    .trim()
    .required("Describe the campaign you want")
    .max(PROMPT_MAX_LENGTH, `Keep the description under ${PROMPT_MAX_LENGTH.toLocaleString("en-US")} characters`),
  budget: yup
    .string()
    .required("Total budget is required")
    .test("is-amount", "Enter a budget like $60,000", (budget) => !budget || Number.isFinite(parseMoney(budget)))
    .test("min-budget", `Budget must be at least ${formatMoney(MIN_BUDGET)}`, (budget) => {
      const amount = parseMoney(budget ?? "");
      return !Number.isFinite(amount) || amount >= MIN_BUDGET;
    }),
  season: yup.string().required("Pick a season"),
  goal: yup.string().required("Pick a goal"),
});
