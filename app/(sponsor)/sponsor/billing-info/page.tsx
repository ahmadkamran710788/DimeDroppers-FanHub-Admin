import type { Metadata } from "next";
import BillingInfo, { type ReturnedSetup } from "@/components/sponsor/billing-info";

export const metadata: Metadata = {
  title: "Dime Sponsors · Billing Info",
};

const single = (value: string | string[] | undefined) => (typeof value === "string" && value ? value : undefined);

// Back from Stripe after a redirect-based method (Cash App Pay, some banks), ?setup=<seti_…> is saved on load
// (Stripe also adds setup_intent and redirect_status).
export default async function BillingInfoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const setupIntentId = single(params.setup) ?? single(params.setup_intent);
  const returnedSetup: ReturnedSetup | undefined = setupIntentId
    ? { setupIntentId, failed: single(params.redirect_status) === "failed" }
    : undefined;
  return <BillingInfo returnedSetup={returnedSetup} />;
}
