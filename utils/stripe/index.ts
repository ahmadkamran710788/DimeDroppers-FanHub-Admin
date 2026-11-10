import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { config } from "@/config";

let stripePromise: Promise<Stripe | null> | null = null;

// Whether payments can be taken here (a publishable key is configured).
export const stripeEnabled = () => Boolean(config.stripePublishableKey);

// Stripe.js, loaded once on first use; null without a publishable key or when the script fails to load.
export function getStripe(): Promise<Stripe | null> {
  if (!stripeEnabled()) return Promise.resolve(null);
  stripePromise ??= loadStripe(config.stripePublishableKey).catch(() => {
    // Let a later attempt try again (e.g. after a network blip).
    stripePromise = null;
    return null;
  });
  return stripePromise;
}
