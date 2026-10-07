export type ContactGroup = "Players" | "Followers" | "Staff";

export interface ChatMessage {
  id: string;
  text: string;
  sentAt: string;
}

// One chat with a team member. Kept in memory only — messages will be saved by the backend later.
export interface Conversation {
  id: string;
  teamId: string;
  teamName: string;
  group: ContactGroup;
  contactId: string;
  contactName: string;
  // Photo when the member has one; otherwise their initials are shown.
  contactAvatar?: string;
  messages: ChatMessage[];
}

// Singular label for one member of a group, e.g. "Varsity Football · Player".
export const GROUP_LABEL: Record<ContactGroup, string> = {
  Players: "Player",
  Followers: "Follower",
  Staff: "Staff",
};
