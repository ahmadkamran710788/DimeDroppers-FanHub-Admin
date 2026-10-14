"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useOrgChat } from "@/components/messages/use-org-chat";

type OrgChatValue = ReturnType<typeof useOrgChat>;

const OrgChatContext = createContext<OrgChatValue | null>(null);

// One poll of the org's conversations for the whole dashboard, shared by the header's Messages
// drawer (and its unread badge) and the Communications page, so they never disagree or poll twice.
export function OrgChatProvider({ children }: { children: ReactNode }) {
  const chat = useOrgChat();
  return <OrgChatContext.Provider value={chat}>{children}</OrgChatContext.Provider>;
}

export function useOrgChatContext(): OrgChatValue {
  const ctx = useContext(OrgChatContext);
  if (!ctx) throw new Error("useOrgChatContext must be used inside <OrgChatProvider>");
  return ctx;
}
