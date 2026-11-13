import type { PaymentChoice, PaymentMethodType, SponsorPaymentMethod } from "@/utils/types/sponsor-payments";

// The types in the order Billing Info lists its saved methods.
export const METHOD_TYPES: PaymentMethodType[] = ["CARD", "US_BANK_ACCOUNT", "CASHAPP", "LINK"];

export const BANK_CLEARING_TEXT =
  "Your bank payment is on its way. Your sponsorship goes live when it clears (about 4 business days).";

const pad = (n: number) => String(n).padStart(2, "0");

// The second line of a saved method: expiry, bank details, $cashtag or Link email.
export function methodDetail(m: SponsorPaymentMethod): string {
  switch (m.type) {
    case "CARD":
      return m.expMonth && m.expYear ? `Expires ${pad(m.expMonth)}/${String(m.expYear).slice(-2)}` : "Card";
    case "US_BANK_ACCOUNT":
      return [m.accountType && `${m.accountType[0].toUpperCase()}${m.accountType.slice(1)}`, "clears in about 4 business days"]
        .filter(Boolean)
        .join(" · ");
    case "CASHAPP":
      return m.cashtag ?? "Cash App Pay";
    case "LINK":
      return m.email ?? "Link";
  }
}

// Why a saved method can't pay right now; null when it can.
export function methodProblem(m: SponsorPaymentMethod): string | null {
  if (m.isUsable) return null;
  if (m.isExpired) return "Expired";
  if (m.status === "PENDING_VERIFICATION") return "Verify this bank account first";
  if (m.status === "FAILED") return "Verification failed. Remove it and add it again";
  return "Can't be used right now";
}

// What checkout picks first: a default that pays at once, then any default, then any usable method; a new
// method in Stripe's form when none is saved (if payments can be taken here). undefined while loading or
// when there's no way to pay.
export function defaultChoice(methods: SponsorPaymentMethod[] | undefined, canUseNew: boolean): PaymentChoice | undefined {
  if (!methods) return undefined;
  const usable = methods.filter((m) => m.isUsable);
  const pick =
    usable.find((m) => m.isDefault && m.settlesInstantly) ?? usable.find((m) => m.isDefault) ?? usable[0];
  if (pick) return { paymentMethodId: pick.id };
  return canUseNew ? { savePaymentMethod: true } : undefined;
}
