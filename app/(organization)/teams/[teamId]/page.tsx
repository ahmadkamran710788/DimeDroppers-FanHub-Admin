import TeamDetailsPage from "@/components/teams/team-details";

export default async function Page({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamDetailsPage teamId={teamId} />;
}
