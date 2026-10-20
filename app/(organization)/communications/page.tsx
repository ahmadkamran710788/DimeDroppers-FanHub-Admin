import CommunicationsPage from "@/components/organization/communications";

export default async function Page({ searchParams }: { searchParams: Promise<{ chat?: string }> }) {
  const { chat } = await searchParams;
  return <CommunicationsPage chatId={chat} />;
}
