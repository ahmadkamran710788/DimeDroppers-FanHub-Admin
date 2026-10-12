import type { OrgChatMessage, OrgConversation } from "@/components/messages/types";

// A group shows its title; a direct chat the fan's name.
export const conversationName = (c: OrgConversation) =>
  c.type === "GROUP" ? c.title || "Group" : (c.participants[0]?.fan.name ?? "Conversation");

const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
const time = (date: Date) => date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

// Chats list: "4:25 PM" today, otherwise "Oct 12".
export const formatListTime = (iso: string) => {
  const date = new Date(iso);
  return isToday(date) ? time(date) : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Under a bubble: "4:25 PM" today, otherwise "Oct 12, 4:25 PM".
export const formatBubbleTime = (iso: string) => {
  const date = new Date(iso);
  return isToday(date) ? time(date) : `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time(date)}`;
};

// Chats list subtitle: "You: …" for the org, the sender's first name in a group.
export const previewText = (c: OrgConversation) => {
  const m = c.lastMessage;
  if (!m) return "No messages yet";
  // An org message always has a body, so an empty one with no attachment was deleted by the fan.
  const text = m.body || (m.attachmentType ? "Attachment" : "Message deleted");
  const who = m.senderIsOrg ? "You" : c.type === "GROUP" ? m.sender?.name.split(" ")[0] : undefined;
  return who ? `${who}: ${text}` : text;
};

// The picture to show for a fan's attachment: the photo itself, or a video's thumbnail.
export const attachmentPreview = (m: OrgChatMessage) => {
  const isImage = m.attachmentMimeType?.startsWith("image/") || /IMAGE|PHOTO/i.test(m.attachmentType ?? "");
  return (isImage ? (m.attachmentThumbnailUrl ?? m.attachmentUrl) : m.attachmentThumbnailUrl) ?? null;
};
