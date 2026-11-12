"use client";

import { useEffect, useRef } from "react";
import {
  cancelCheckout,
  confirmCheckout,
  outcomeOf,
  type CheckoutOutcome,
} from "@/components/sponsor/checkout/settle-checkout";
import type { ReturnedPayment } from "@/components/sponsor/checkout/returned-payment";

// Back from Stripe: confirms the payment once (even when the effect runs twice in development), drops Stripe's
// parameters from the address (`cleanPath`) so a refresh doesn't confirm again, and reports how it went. A
// payment Stripe sent back unpaid (e.g. the sponsor declined in Cash App) is cancelled, as when Stripe's
// form is closed without paying, so its stores are free again.
export function usePaymentReturn(
  returned: ReturnedPayment | undefined,
  cleanPath: string,
  onSettled: (outcome: CheckoutOutcome) => void
) {
  const handled = useRef(false);
  const settled = useRef(onSettled);

  useEffect(() => {
    settled.current = onSettled;
  });

  useEffect(() => {
    if (!returned || handled.current) return;
    handled.current = true;
    window.history.replaceState(null, "", cleanPath);
    confirmCheckout(returned.paymentId, returned.paymentIntentId).then(async (checkout) => {
      if (!checkout) {
        settled.current({
          kind: "failed",
          checkout: null,
          reason: "We couldn't check your payment here. If you paid, it shows in My Sponsorships shortly.",
        });
        return;
      }
      const outcome = outcomeOf(checkout);
      if (outcome.kind === "needs-form") {
        await cancelCheckout(checkout.id);
        settled.current({
          kind: "failed",
          checkout,
          reason: checkout.failureReason || "The payment wasn't completed, so nothing was charged.",
        });
        return;
      }
      settled.current(outcome);
    });
  }, [returned, cleanPath]);
}
