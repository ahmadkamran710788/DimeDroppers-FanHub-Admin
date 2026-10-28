import type { Metadata } from "next";
import Sponsorships, { type SponsorshipTab } from "@/components/sponsor/sponsorships";

export const metadata: Metadata = {
  title: "Dime Sponsors · Sponsorships",
};

const isTab = (value: unknown): value is SponsorshipTab => value === "planner" || value === "find";

// ?tab=planner|find opens that tab; without it the account's first tab opens.
export default async function SponsorshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tab } = await searchParams;
  return <Sponsorships initialTab={isTab(tab) ? tab : undefined} />;
}
