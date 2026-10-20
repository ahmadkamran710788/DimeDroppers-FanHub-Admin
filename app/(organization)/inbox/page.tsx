import CommunicationsPage from "@/components/organization/communications";

// The header messages box opens chats here: the Communications chat under an "Inbox" title.
export default async function Page({ searchParams }: { searchParams: Promise<{ chat?: string }> }) {
  const { chat } = await searchParams;
  return <CommunicationsPage chatId={chat} title="Inbox" subtitle="" />;
}
