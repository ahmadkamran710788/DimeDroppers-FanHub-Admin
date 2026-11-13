import toast from "react-hot-toast";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { routes } from "@/utils/routes";
import type { RemovedPaymentMethod, SponsorPaymentMethod } from "@/utils/types/sponsor-payments";

// Each call toasts its own error and answers the sentence to confirm a success with (Billing Info shows it in
// its banner), or null when it failed.

export interface SavedMethod {
  method: SponsorPaymentMethod;
  notice: string;
}

// POST /payment-methods once Stripe confirmed the SetupIntent. A bank account entered by hand comes back
// PENDING_VERIFICATION, waiting for Stripe's $0.01 deposit.
export async function saveMethod(body: {
  setupIntentId: string;
  holderName?: string;
  setDefault?: boolean;
}): Promise<SavedMethod | null> {
  const r = await sponsorRequest<SponsorPaymentMethod>("POST", routes.api.sponsorPaymentMethods, { body });
  if (!r.view) {
    toast.error(r.message ?? "Couldn't save this payment method, please try again.");
    return null;
  }
  const notice =
    r.view.status === "PENDING_VERIFICATION"
      ? `${r.view.label} was added. Stripe sends it a $0.01 deposit with a code (like SM11AA) within 1–2 business days: enter it under Verify.`
      : `${r.view.label} was added.`;
  return { method: r.view, notice };
}

// PATCH /payment-methods/:id/default: the other methods of its type lose their default.
export async function makeDefault(method: SponsorPaymentMethod): Promise<string | null> {
  const r = await sponsorRequest<SponsorPaymentMethod>("PATCH", routes.api.sponsorPaymentMethodDefault(method.id));
  if (!r.view) {
    toast.error(r.message ?? "Couldn't change the default, please try again.");
    return null;
  }
  return `${method.label} is now your default ${method.typeLabel.toLowerCase()}.`;
}

// DELETE /payment-methods/:id (detached in Stripe too). 409 while a payment with it is waiting or clearing.
export async function removeMethod(method: SponsorPaymentMethod): Promise<RemovedPaymentMethod | null> {
  const r = await sponsorRequest<RemovedPaymentMethod>("DELETE", routes.api.sponsorPaymentMethod(method.id));
  if (!r.view) toast.error(r.message ?? "Couldn't remove it, please try again.");
  return r.view ?? null;
}
