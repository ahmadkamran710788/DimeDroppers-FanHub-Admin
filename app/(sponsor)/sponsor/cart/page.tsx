import type { Metadata } from "next";
import SponsorCart from "@/components/sponsor/cart";
import { returnedPaymentOf } from "@/components/sponsor/checkout/returned-payment";

export const metadata: Metadata = {
  title: "Dime Sponsors · Cart",
};

// Back from Stripe (a redirect-based payment method), ?payment=<id>&payment_intent=<pi_…> is confirmed on load.
export default async function SponsorCartPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <SponsorCart returnedPayment={returnedPaymentOf(await searchParams)} />;
}
