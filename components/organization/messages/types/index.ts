// Shapes of the organisation chat API (fanhub/org/chat, FANHUB_ORG_CHAT_ADMIN.md).

export interface ChatFan {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export type MemberTab = "players" | "parents" | "staff" | "followers";

export const MEMBER_TABS = ["players", "parents", "staff", "followers"] as const satisfies readonly MemberTab[];

export const TAB_LABEL: Record<MemberTab, string> = {
  players: "Players",
  parents: "Parents",
  staff: "Staff",
  followers: "Followers",
};

// One person on a tab. `directConversationId` is the org's existing direct chat with them, if any.
export interface TeamMember {
  fan: ChatFan;
  tags: string[];
  directConversationId: string | null;
}

// GET /teams/{schoolTeamId}/members. A fan may be on several tabs.
export interface TeamMembers {
  team: { id: string; name: string };
  tabs: Record<MemberTab, TeamMember[]>;
  counts: Record<MemberTab, number>;
}

// Who a group goes to: a whole tab, everyone on any tab, or chosen fans.
export type ChatAudience = "PLAYERS" | "PARENTS" | "STAFF" | "FOLLOWERS" | "ALL" | "CUSTOM";

export const TAB_AUDIENCE: Record<MemberTab, ChatAudience> = {
  players: "PLAYERS",
  parents: "PARENTS",
  staff: "STAFF",
  followers: "FOLLOWERS",
};

const TAG_LABEL: Record<string, string> = {
  PLAYER: "Player",
  PARENT: "Parent",
  COACH: "Coach",
  SCOREKEEPER: "Scorekeeper",
  VIDEOGRAPHER: "Videographer",
  OFFICIAL_SCOREKEEPER: "Scorekeeper",
  OFFICIAL_VIDEOGRAPHER: "Videographer",
  FOLLOWER: "Follower",
};

// "OFFICIAL_SCOREKEEPER" → "Scorekeeper"; an unknown tag is title-cased.
export const tagLabel = (tag: string) =>
  TAG_LABEL[tag] ??
  tag
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export interface ChatLastMessage {
  id: string;
  body: string;
  attachmentType: string | null;
  senderIsOrg: boolean;
  // null for an org message.
  sender: { id: string; name: string } | null;
  createdAt: string;
}

// A conversation the org started. `participants` lists the fans only; the org is implied.
export interface OrgConversation {
  id: string;
  type: "DIRECT" | "GROUP";
  title: string | null;
  team: { id: string; name: string } | null;
  participants: { fan: ChatFan; lastReadAt: string | null }[];
  lastMessage: ChatLastMessage | null;
  lastMessageAt: string | null;
  // Fan messages since the org last marked the conversation read.
  unreadCount: number;
  createdAt: string;
}

export interface OrgChatMessage {
  id: string;
  conversationId: string;
  senderIsOrg: boolean;
  // Set on a fan's message, null on the org's.
  sender: { id: string; name: string } | null;
  body: string;
  // Fan attachments only; the URLs are presigned for one hour.
  attachmentUrl: string | null;
  attachmentType: string | null;
  attachmentMimeType: string | null;
  attachmentFileName: string | null;
  attachmentThumbnailUrl: string | null;
  clientMessageId: string | null;
  // A message the fan deleted for everyone: set, with an empty body.
  deletedAt: string | null;
  createdAt: string;
  // On the org's own messages: the fans who have read it, and SENT / SEEN.
  seenBy?: string[];
  status?: "SENT" | "SEEN" | null;
  // Client only: an optimistic bubble still being sent.
  pending?: boolean;
}
