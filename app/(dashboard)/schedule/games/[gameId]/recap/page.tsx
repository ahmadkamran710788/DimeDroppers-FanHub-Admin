import GameCenterPage from "@/components/schedule/game-center";

export default async function Page({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return <GameCenterPage gameId={gameId} initialTab="Recap" />;
}
