"use client";

import MessagesWorkspace from "@/components/messages/messages-workspace";
import { useOrgChatContext } from "@/context/org-chat";

interface CommunicationsPageProps {
  // From ?chat= (set by the header messages box): opens that conversation straight away.
  chatId?: string;
  title?: string;
  // Left out to show the title alone (the Inbox page).
  subtitle?: string;
}

// Communications: chat with the people of the org's teams. The Inbox page is the same chat under
// its own title. The header messages box shares the same poll of the conversations (context/org-chat).
export default function CommunicationsPage({
  chatId,
  title = "Communications",
  subtitle = "Reach your players, parents, staff and followers from one place.",
}: CommunicationsPageProps) {
  const { conversations, loading, refresh, upsert } = useOrgChatContext();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col text-white">
        <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
          {title}
        </h2>
        {subtitle && <p className="text-base leading-[26px]">{subtitle}</p>}
      </div>

      <div className="h-[calc(100vh-280px)] min-h-[520px] flex flex-col rounded-[8px] overflow-hidden border border-white/10 bg-[rgba(11,28,45,0.96)] backdrop-blur-[48px]">
        <MessagesWorkspace
          // A new ?chat= starts the workspace over on that conversation.
          key={chatId ?? "list"}
          conversations={conversations}
          loading={loading}
          onRefresh={refresh}
          onUpsert={upsert}
          initialChatId={chatId}
        />
      </div>
    </div>
  );
}
