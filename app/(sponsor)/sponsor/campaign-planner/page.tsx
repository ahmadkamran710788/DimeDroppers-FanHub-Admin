import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CampaignPlanner from "@/components/sponsor/campaign-planner";
import { SPONSOR_PROFILE } from "@/components/sponsor/data";

export const metadata: Metadata = {
  title: "Dime Sponsors · Campaign Planner",
};

// National accounts only, like the sidebar's Dime AI section.
export default function CampaignPlannerPage() {
  if (!SPONSOR_PROFILE.nationalAccount) notFound();
  return <CampaignPlanner />;
}
