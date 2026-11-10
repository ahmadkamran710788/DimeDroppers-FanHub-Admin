import { formatMoney } from "@/utils/helper";

// Helpers shared by the organisation and sponsor Fundable Needs screens (the API sends money in cents).

// The API's cents as dollars, with cents only when there are some ("$1,200" / "$62.40").
export const dollars = (cents: number) => formatMoney(cents / 100);

// "9 days left" / "Last day" (daysLeft is whole days, so 0 while it is still open means today).
export const daysLeftLabel = (daysLeft: number) =>
  daysLeft <= 0 ? "Last day" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;

// "Jacksonville, FL"; "" without either.
export const placeLabel = (city: string | null, state: string | null) => [city, state].filter(Boolean).join(", ");

// A Stripe merchant category slug as words ("bus_lines" → "Bus lines").
export const humanizeSlug = (slug: string) => {
  const words = slug.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// Typed dollars ("$1,250.50") as whole cents; NaN when it isn't an amount.
export const dollarsToCents = (text: string) => {
  const digits = text.replace(/[$,\s]/g, "");
  return digits && /^\d*(\.\d{0,2})?$/.test(digits) ? Math.round(Number(digits) * 100) : NaN;
};

// Cents as the plain number a money field shows ("1250.5" → "1250.50"; whole dollars without decimals).
export const centsToInput = (cents: number) => (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2));
