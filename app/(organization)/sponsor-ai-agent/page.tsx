import SponsorAiAgentPage from "@/components/organization/sponsor-ai-agent";
import { isAgentTab } from "@/components/organization/sponsor-ai-agent/data";

// ?tab=agent|settings opens that tab; Find Sponsors without it.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tab } = await searchParams;
  return <SponsorAiAgentPage initialTab={isAgentTab(tab) ? tab : undefined} />;
}
