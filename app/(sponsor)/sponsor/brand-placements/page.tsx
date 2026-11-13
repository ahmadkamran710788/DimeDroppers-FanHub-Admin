import type { Metadata } from "next";
import BrandPlacements from "@/components/sponsor/brand-placements";
import { PLACEMENTS_TABS, type PlacementsTab } from "@/components/sponsor/brand-placements/data";

export const metadata: Metadata = {
  title: "Dime Sponsors · Brand Placements",
};

const isTab = (value: unknown): value is PlacementsTab => PLACEMENTS_TABS.some((tab) => tab === value);

// ?tab=setup|performance opens that tab.
export default async function BrandPlacementsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tab } = await searchParams;
  return <BrandPlacements initialTab={isTab(tab) ? tab : undefined} />;
}
