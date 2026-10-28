import SponsorMessagesPage from "@/components/organization/sponsor-messages";

// "Open in Sponsor Messages" on the Sponsor AI Agent opens one thread here with ?thread=.
export default async function Page({ searchParams }: { searchParams: Promise<{ thread?: string }> }) {
  const { thread } = await searchParams;
  return <SponsorMessagesPage key={thread ?? "list"} threadId={thread} />;
}
