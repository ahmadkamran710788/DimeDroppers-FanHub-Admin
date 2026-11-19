import FanHubAiPage from "@/components/organization/fanhub-ai";

// ?thread= opens one of the organiser agent's chats. The page keeps it there with history.replaceState (no
// navigation, so no remount); a real navigation, e.g. the sidebar link, starts it over.
export default async function Page({ searchParams }: { searchParams: Promise<{ thread?: string }> }) {
  const { thread } = await searchParams;
  return <FanHubAiPage key={thread ?? "list"} threadId={thread} />;
}
