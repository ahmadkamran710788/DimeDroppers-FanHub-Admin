import * as yup from "yup";
import { parseMoney } from "@/utils/helper";
import type { PackageTier } from "@/utils/types/sponsor-packages";

// The packages' max prices, typed in dollars and keyed by tier: empty for no max (one part), else an amount within
// the API's limits (GET /splits `limits`, in cents), to the cent.
export const maxPricesSchema = (tiers: PackageTier[], minCents: number, maxCents: number) => {
  const dollars = (cents: number) => `$${(cents / 100).toLocaleString("en-US")}`;
  const range = `Enter ${dollars(minCents)} to ${dollars(maxCents)}, or leave it empty for no max`;
  const maxPrice = yup
    .string()
    .trim()
    .test("amount", range, (v) => !v || Number.isFinite(parseMoney(v)))
    .test("cents", "Use at most 2 decimals", (v) => !v || /^[$,\s\d]*(\.\d{0,2})?$/.test(v))
    .test("range", range, (v) => {
      if (!v) return true;
      const cents = Math.round(parseMoney(v) * 100);
      return cents >= minCents && cents <= maxCents;
    });
  return yup.object(Object.fromEntries(tiers.map((tier) => [tier, maxPrice])));
};
