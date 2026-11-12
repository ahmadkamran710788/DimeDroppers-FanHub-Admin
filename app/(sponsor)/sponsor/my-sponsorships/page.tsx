import type { Metadata } from "next";
import MySponsorships from "@/components/sponsor/my-sponsorships";
import { returnedPaymentOf } from "@/components/sponsor/checkout/returned-payment";

export const metadata: Metadata = {
  title: "Dime Sponsors · My Sponsorships",
};

// Back from Stripe (a redirect-based payment method, from Activate), ?payment=<id>&payment_intent=<pi_…> is
// confirmed on load.
export default async function MySponsorshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <MySponsorships returnedPayment={returnedPaymentOf(await searchParams)} />;
}
