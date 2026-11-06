import type { Metadata } from "next";
import FundableNeeds, { type FundableNeedsTab } from "@/components/sponsor/fundable-needs";

export const metadata: Metadata = {
  title: "Dime Sponsors · Fundable Needs",
};

const isTab = (value: unknown): value is FundableNeedsTab => value === "browse" || value === "funded";

// ?tab=browse|funded opens that tab; Browse needs without it.
export default async function FundableNeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tab } = await searchParams;
  return <FundableNeeds initialTab={isTab(tab) ? tab : undefined} />;
}
