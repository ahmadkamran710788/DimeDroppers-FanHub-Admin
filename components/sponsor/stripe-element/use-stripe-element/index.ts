"use client";

import { useEffect, useRef, useState } from "react";
import type { Appearance, Stripe, StripeElements } from "@stripe/stripe-js";
import { getStripe } from "@/utils/stripe";

// Stripe's form in the sponsor app's purple, on the white popups.
const APPEARANCE: Appearance = { theme: "stripe", variables: { colorPrimary: "#6a4be6", borderRadius: "10px" } };

// Stripe's form on a dark card (Billing Info): the page's near-black fields, grey borders and violet focus.
export const DARK_APPEARANCE: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#7c6cff",
    colorBackground: "#0b0d12",
    colorText: "#f4f4f5",
    colorTextSecondary: "#a1a1aa",
    colorTextPlaceholder: "#71717a",
    colorDanger: "#fca5a5",
    borderRadius: "12px",
  },
  rules: {
    ".Input": { border: "1px solid #2a2c33", boxShadow: "none" },
    ".Label": { fontWeight: "600", fontSize: "13px" },
  },
};

const NOT_AVAILABLE = "Payments aren't available right now. Please try again later.";

export interface StripeHandles {
  stripe: Stripe;
  elements: StripeElements;
}

// Stripe's Payment Element for one client secret: a SetupIntent's (saving a payment method) or a
// PaymentIntent's (paying). Put `mountRef` on a div that is rendered (not hidden) whenever the secret is
// set; the form is rebuilt for another secret and removed when it goes back to null. `appearance` is the light
// popup look unless given (pass a module constant, e.g. DARK_APPEARANCE, so it stays the same object).
export function useStripeElement(clientSecret: string | null, appearance: Appearance = APPEARANCE) {
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
      const elements = stripe.elements({ clientSecret, appearance });
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
  }, [clientSecret, appearance]);

  const loadError = clientSecret && failure?.secret === clientSecret ? failure.message : null;
  return {
    mountRef,
    // Stripe and the form's elements, to confirm with; null until the form is built.
    handles: () => handlesRef.current,
    ready: !!clientSecret && readyFor === clientSecret && !loadError,
    loadError,
  };
}
