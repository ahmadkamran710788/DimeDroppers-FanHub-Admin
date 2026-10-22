import TournamentTeamDetails from "@/components/organization/teams/tournament-team-details";

export default async function Page({ params }: { params: Promise<{ eventId: string; teamId: string }> }) {
  const { eventId, teamId } = await params;
  return <TournamentTeamDetails eventId={eventId} teamId={teamId} />;
}
