"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { usePaymentMethods } from "@/components/sponsor/payment-methods/use-payment-methods";
import { defaultChoice } from "@/components/sponsor/payment-methods/data";
import {
  cancelCheckout,
  settleCheckout,
  type CheckoutOutcome,
} from "@/components/sponsor/checkout/settle-checkout";
import { stripeEnabled } from "@/utils/stripe";
import type { PaymentChoice, SponsorCheckout } from "@/utils/types/sponsor-payments";

const newKey = () => crypto.randomUUID();

// The payment side of one checkout (a single Activate or the cart's Activate all):
// - the saved methods and how the sponsor pays (a saved method's id, or a new one in Stripe's form);
// - the Idempotency-Key: kept for a retry of the same attempt (a network error never charges twice), and
//   renewed for every new attempt: a new confirm, another method, or after a failed or cancelled payment
//   (the same key would answer that failed payment again);
// - Stripe's form, open while a new method's payment waits for it.
export function useCheckout() {
  // Loads the saved methods once a checkout starts, and again at every start.
  const [started, setStarted] = useState(false);
  const { methods, error, errorStatus, loading, reload } = usePaymentMethods({ enabled: started });
  const [picked, setPicked] = useState<PaymentChoice | null>(null);
  const [key, setKey] = useState(newKey);
  // The payment Stripe's form is open for; null when closed.
  const [formCheckout, setFormCheckout] = useState<SponsorCheckout | null>(null);

  const canUseNew = stripeEnabled();
  // What was picked, while it's still in the list (and usable); otherwise the default.
  const pickedStillThere =
    picked &&
    (picked.paymentMethodId
      ? methods?.some((m) => m.id === picked.paymentMethodId && m.isUsable)
      : canUseNew && !!methods);
  const choice = pickedStillThere ? picked : defaultChoice(methods, canUseNew);

  const renewKey = () => setKey(newKey());

  return {
    methods,
    methodsError: error,
    methodsErrorStatus: errorStatus,
    methodsLoading: started && loading,
    canUseNew,
    // undefined while loading, or when there's no way to pay here.
    choice,
    key,
    renewKey,
    // A new confirm opens: fresh methods, the default choice, a new key.
    start() {
      setStarted(true);
      reload();
      setPicked(null);
      renewKey();
    },
    pick(next: PaymentChoice) {
      setPicked(next);
      renewKey();
    },
    formCheckout,
    // After the activation answered: finishes Stripe's extra step for a saved method, opens Stripe's form for
    // a new method, and drops a payment that can't go on (so its stores are free again).
    async settle(checkout: SponsorCheckout | null): Promise<CheckoutOutcome> {
      const outcome = await settleCheckout(checkout);
      if (outcome.kind === "needs-form") setFormCheckout(outcome.checkout);
      if (outcome.kind === "failed") {
        renewKey();
        // Stripe's check was refused (e.g. 3-D Secure): the payment still waits; cancel it now.
        if (outcome.checkout?.status === "PENDING") await cancelCheckout(outcome.checkout.id);
      }
      return outcome;
    },
    // Stripe's form finished (paid, or the screen can't tell yet).
    closeForm() {
      setFormCheckout(null);
      renewKey();
    },
    // Stripe's form closed without paying: the payment is cancelled right away, nothing is charged and the
    // stores are free again. false when it couldn't be (Stripe may already have the money): the caller reloads.
    async abandonForm(): Promise<boolean> {
      const checkout = formCheckout;
      setFormCheckout(null);
      renewKey();
      if (!checkout) return true;
      const r = await cancelCheckout(checkout.id);
      if (r.ok) {
        toast("Payment cancelled. Nothing was charged.");
        return true;
      }
      toast.error(r.message ?? "Couldn't cancel the payment. Check My Sponsorships for its status.");
      return false;
    },
  };
}

export type Checkout = ReturnType<typeof useCheckout>;
