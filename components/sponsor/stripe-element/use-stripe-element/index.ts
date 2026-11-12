"use client";

import { useEffect, useRef, useState } from "react";
import type { Stripe, StripeElements } from "@stripe/stripe-js";
import { getStripe } from "@/utils/stripe";

// Stripe's form in the sponsor app's purple, on the white popups.
const APPEARANCE = { theme: "stripe" as const, variables: { colorPrimary: "#6a4be6", borderRadius: "10px" } };

const NOT_AVAILABLE = "Payments aren't available right now. Please try again later.";

export interface StripeHandles {
  stripe: Stripe;
  elements: StripeElements;
}

// Stripe's Payment Element for one client secret: a SetupIntent's (saving a payment method) or a
// PaymentIntent's (paying). Put `mountRef` on a div that is rendered (not hidden) whenever the secret is
// set; the form is rebuilt for another secret and removed when it goes back to null.
export function useStripeElement(clientSecret: string | null) {
  const mountRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<StripeHandles | null>(null);
  // The secret the form below was built for, once Stripe drew it.
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ secret: string; message: string } | null>(null);

  useEffect(() => {
    if (!clientSecret) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    getStripe().then((stripe) => {
      if (cancelled) return;
      if (!stripe || !mountRef.current) {
        setFailure({ secret: clientSecret, message: NOT_AVAILABLE });
        return;
      }
      const elements = stripe.elements({ clientSecret, appearance: APPEARANCE });
      const element = elements.create("payment", { layout: "tabs" });
      element.on("ready", () => {
        if (!cancelled) setReadyFor(clientSecret);
      });
      element.on("loaderror", (e) => {
        if (!cancelled)
          setFailure({ secret: clientSecret, message: e.error.message ?? "The form couldn't load. Please try again." });
      });
      element.mount(mountRef.current);
      handlesRef.current = { stripe, elements };
      destroy = () => element.destroy();
    });
    return () => {
      cancelled = true;
      destroy?.();
      handlesRef.current = null;
    };
  }, [clientSecret]);

  const loadError = clientSecret && failure?.secret === clientSecret ? failure.message : null;
  return {
    mountRef,
    // Stripe and the form's elements, to confirm with; null until the form is built.
    handles: () => handlesRef.current,
    ready: !!clientSecret && readyFor === clientSecret && !loadError,
    loadError,
  };
}
