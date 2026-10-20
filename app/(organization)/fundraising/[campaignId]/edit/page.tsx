import CreateCampaignPage from "@/components/organization/fundraising/create-campaign";

export default async function Page({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  return <CreateCampaignPage campaignId={campaignId} />;
}
