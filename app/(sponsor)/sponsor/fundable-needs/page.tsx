import type { Metadata } from "next";
import FundableNeeds, { type FundableNeedsTab, type ReturnedPayment } from "@/components/sponsor/fundable-needs";

export const metadata: Metadata = {
  title: "Dime Sponsors · Fundable Needs",
};

const isTab = (value: unknown): value is FundableNeedsTab => value === "browse" || value === "funded";

const single = (value: string | string[] | undefined) => (typeof value === "string" && value ? value : undefined);

// ?tab=browse|funded opens that tab; Browse needs without it. Back from Stripe (a redirect-based payment),
// ?contribution=<id>&payment_intent=<pi_…> is confirmed on load.
export default async function FundableNeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const contributionId = single(params.contribution);
  const paymentIntentId = single(params.payment_intent);
  const returnedPayment: ReturnedPayment | undefined =
    contributionId && paymentIntentId ? { contributionId, paymentIntentId } : undefined;
  return (
    <FundableNeeds initialTab={isTab(params.tab) ? params.tab : undefined} returnedPayment={returnedPayment} />
  );
}
