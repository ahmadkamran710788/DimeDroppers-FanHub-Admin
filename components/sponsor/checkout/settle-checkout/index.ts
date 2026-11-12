import toast from "react-hot-toast";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { BANK_CLEARING_TEXT } from "@/components/sponsor/payment-methods/data";
import { getStripe } from "@/utils/stripe";
import { routes } from "@/utils/routes";
import type { SponsorCheckout } from "@/utils/types/sponsor-payments";

// How a checkout ended up, for the screen:
// - paid: live now (also a $0 order, which has no checkout);
// - processing: a bank payment that goes live when it clears;
// - failed: declined, cancelled or expired; nothing was charged;
// - needs-form: a new method to enter in Stripe's form (CONFIRM_PAYMENT);
// - pending: still waiting on something this screen can't finish now.
export type CheckoutOutcome =
  | { kind: "paid"; checkout: SponsorCheckout | null }
  | { kind: "processing"; checkout: SponsorCheckout }
  | { kind: "failed"; checkout: SponsorCheckout | null; reason: string }
  | { kind: "needs-form"; checkout: SponsorCheckout }
  | { kind: "pending"; checkout: SponsorCheckout };

const DECLINED = "The payment didn't go through. Please try another payment method.";

// The outcome of a checkout as the backend sees it, without doing anything in the browser.
export function outcomeOf(checkout: SponsorCheckout | null): CheckoutOutcome {
  if (!checkout || checkout.status === "SUCCEEDED") return { kind: "paid", checkout };
  if (checkout.status === "PROCESSING" || checkout.nextAction === "WAIT") return { kind: "processing", checkout };
  if (checkout.status === "FAILED" || checkout.status === "CANCELLED")
    return { kind: "failed", checkout, reason: checkout.failureReason || DECLINED };
  if (checkout.nextAction === "CONFIRM_PAYMENT" && checkout.clientSecret) return { kind: "needs-form", checkout };
  return { kind: "pending", checkout };
}

// GET /payments/:id: the payment with its clientSecret while it waits. null when it failed (toasted).
export async function fetchCheckout(paymentId: string): Promise<SponsorCheckout | null> {
  const r = await sponsorRequest<SponsorCheckout>("GET", routes.api.sponsorPayment(paymentId));
  if (!r.view) toast.error(r.message ?? "Couldn't load this payment, please try again.");
  return r.view ?? null;
}

// POST /payments/:id/confirm once Stripe is done in the browser. The webhook records the payment too, so a
// failure here only means this screen can't update yet. null when it failed.
export async function confirmCheckout(paymentId: string, paymentIntentId: string): Promise<SponsorCheckout | null> {
  const r = await sponsorRequest<SponsorCheckout>("POST", routes.api.sponsorPaymentConfirm(paymentId), {
    body: { paymentIntentId },
  });
  return r.view ?? null;
}

// POST /payments/:id/cancel: the payment and its activations are cancelled and their stores freed. A 409
// means it isn't waiting any more (Stripe may already have taken it): the caller reloads.
export async function cancelCheckout(paymentId: string): Promise<{ ok: boolean; status: number; message?: string }> {
  const r = await sponsorRequest<SponsorCheckout>("POST", routes.api.sponsorPaymentCancel(paymentId));
  return { ok: !!r.view, status: r.status, message: r.message };
}

// Finishes in the browser what it can: Stripe's extra step for a saved method (3-D Secure, a bank or wallet
// check), then tells the backend. Anything else is answered as it stands.
export async function settleCheckout(checkout: SponsorCheckout | null): Promise<CheckoutOutcome> {
  if (checkout?.nextAction !== "HANDLE_NEXT_ACTION" || !checkout.clientSecret) return outcomeOf(checkout);
  const stripe = await getStripe();
  if (!stripe) return { kind: "pending", checkout };
  const { error, paymentIntent } = await stripe.handleNextAction({ clientSecret: checkout.clientSecret });
  if (error) return { kind: "failed", checkout, reason: error.message || DECLINED };
  const paymentIntentId = paymentIntent?.id ?? checkout.paymentIntentId;
  const confirmed = paymentIntentId ? await confirmCheckout(checkout.id, paymentIntentId) : null;
  if (!confirmed) return { kind: "pending", checkout };
  const outcome = outcomeOf(confirmed);
  // Never asks for Stripe's step twice in a row.
  return confirmed.nextAction === "HANDLE_NEXT_ACTION" ? { kind: "pending", checkout: confirmed } : outcome;
}

// Tells the sponsor how a checkout ended, with `paidText` for a live one.
export function toastOutcome(outcome: CheckoutOutcome, paidText: string) {
  switch (outcome.kind) {
    case "paid":
      toast.success(paidText);
      break;
    case "processing":
      toast.success(BANK_CLEARING_TEXT, { duration: 6000 });
      break;
    case "failed":
      toast.error(outcome.reason);
      break;
    case "pending":
      toast("Your payment hasn't gone through yet. You can finish or cancel it from My Sponsorships.", {
        duration: 6000,
      });
      break;
  }
}
