import toast from "react-hot-toast";
import { teamRef, type ChatAudience, type ChatTeam, type OrgChatMessage, type OrgConversation, type TeamMembers } from "@/components/organization/messages/types";
import { backendFetch, forceSignOut } from "@/utils/api-call";
import { extractApiErrorMessage } from "@/utils/api-error";
import { routes } from "@/utils/routes";

// Messages per page of a conversation (the API allows 1–100).
export const MESSAGES_PAGE_SIZE = 50;

interface RequestOptions {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  // Toast shown on failure when the backend gives no message. Omitted: fail silently (polling).
  failure?: string;
}

// Chat calls go through backendFetch, not apiCall: apiCall replaces 400s with a generic toast, hiding
// messages like "Nobody on this team matches that audience", and toasts every failed poll. Every response carries its payload in a `data` array; null on failure.
async function request<T>(endpoint: string, { method = "GET", body, failure }: RequestOptions = {}): Promise<T[] | null> {
  try {
    const res = await backendFetch(endpoint, {
      method,
      ...(body && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok) {
      const data = json?.data;
      return Array.isArray(data) ? data : data ? [data] : null;
    }
    // backendFetch already refreshed the token and retried once: a 401 now means the session is over.
    if (res.status === 401) {
      forceSignOut();
      return null;
    }
    if (failure) toast.error(extractApiErrorMessage(json, failure));
  } catch {
    if (failure) toast.error(failure);
  }
  return null;
}

const first = <T>(list: T[] | null) => list?.[0] ?? null;

// Every team's conversations, newest activity first. Silent: it runs on a timer.
export const fetchConversations = () => request<OrgConversation>(routes.api.orgChatConversations);

export const fetchConversation = async (id: string) =>
  first(await request<OrgConversation>(routes.api.orgChatConversation(id), { failure: "Couldn't open this conversation." }));

export const fetchMembers = async (team: ChatTeam) =>
  first(
    await request<TeamMembers>(
      team.kind === "FANHUB_TEAM" ? routes.api.orgChatFanHubTeamMembers(team.id) : routes.api.orgChatTeamMembers(team.id),
      { failure: "Couldn't load this team's members." }
    )
  );

// One page of messages, oldest first. `before` (a message id) pages back to older ones.
export const fetchMessages = (conversationId: string, before?: string) => {
  const query = new URLSearchParams({ limit: String(MESSAGES_PAGE_SIZE), ...(before && { before }) });
  return request<OrgChatMessage>(`${routes.api.orgChatMessages(conversationId)}?${query}`, {
    failure: "Couldn't load the messages.",
  });
};

// Opens the direct chat with one fan of the team, or returns the existing one.
export const startDirect = async (team: ChatTeam, fanId: string) =>
  first(
    await request<OrgConversation>(routes.api.orgChatDirect, {
      method: "POST",
      body: { ...teamRef(team), fanId },
      failure: "Couldn't start the conversation.",
    })
  );

export interface NewGroup {
  team: ChatTeam;
  title: string;
  audience: ChatAudience;
  fanIds?: string[];
  body?: string;
}

// Creates a new group every time; `body`, when given, is sent as its first message.
export const startGroup = async ({ team, ...rest }: NewGroup) =>
  first(
    await request<OrgConversation>(routes.api.orgChatGroup, {
      method: "POST",
      body: { ...teamRef(team), ...rest },
      failure: "Couldn't create the group.",
    })
  );

export const sendMessage = async (conversationId: string, body: string, clientMessageId: string) =>
  first(
    await request<OrgChatMessage>(routes.api.orgChatMessages(conversationId), {
      method: "POST",
      body: { body, clientMessageId },
      failure: "Couldn't send the message.",
    })
  );

// Silent: a failed read receipt only leaves the unread badge up until the next one.
export const markRead = (conversationId: string) =>
  request<{ conversationId: string; lastReadAt: string }>(routes.api.orgChatRead(conversationId), { method: "POST" });
