import CreateCampaignPage from "@/components/organization/fundraising/create-campaign";

// `?team=` opens a tournament campaign with that team (and the shared event) already chosen.
export default async function Page({ searchParams }: { searchParams: Promise<{ team?: string | string[] }> }) {
  const { team } = await searchParams;
  return <CreateCampaignPage initialTeamId={typeof team === "string" ? team : undefined} />;
}
