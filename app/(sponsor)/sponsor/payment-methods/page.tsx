import type { Metadata } from "next";
import PaymentMethods, { type PaymentMethodsTab, type ReturnedSetup } from "@/components/sponsor/payment-methods";

export const metadata: Metadata = {
  title: "Dime Sponsors · Payment Methods",
};

const isTab = (value: unknown): value is PaymentMethodsTab => value === "methods" || value === "history";

const single = (value: string | string[] | undefined) => (typeof value === "string" && value ? value : undefined);

// ?tab=methods|history opens that tab. Back from Stripe after a redirect-based method (Cash App Pay, some
// banks), ?setup=<seti_…> is saved on load (Stripe also adds setup_intent and redirect_status).
export default async function PaymentMethodsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const setupIntentId = single(params.setup) ?? single(params.setup_intent);
  const returnedSetup: ReturnedSetup | undefined = setupIntentId
    ? { setupIntentId, failed: single(params.redirect_status) === "failed" }
    : undefined;
  return <PaymentMethods initialTab={isTab(params.tab) ? params.tab : undefined} returnedSetup={returnedSetup} />;
}
