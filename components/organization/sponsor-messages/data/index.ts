import { THREAD_STYLE } from "@/components/organization/sponsor-ai-agent/data";
import type {
  ConversationStatus,
  ConversationStatusFilter,
  MessageStatus,
  StopReason,
  ThreadHandler,
  ThreadMessage,
  ThreadSummary,
} from "@/utils/types/sponsor-ai";

// No socket yet: the list is asked for again this often while the screen is open.
export const LIST_POLL_MS = 30_000;

// An email still "Sending…" turns Sent / Delivered within seconds; the open conversation is checked this often until then.
export const SENDING_POLL_MS = 4000;

// The most a reply from the panel can hold.
export const REPLY_MAX_CHARS = 5000;

export const THREADS_PER_PAGE = 20;

// The search waits this long after the last key before it asks.
export const SEARCH_DEBOUNCE_MS = 300;

// The status chips, in order; each label gets its count.
export const STATUS_FILTERS: { value: ConversationStatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Sent" },
  { value: "REPLIED", label: "Replied" },
  { value: "STOPPED", label: "Stopped" },
];

// The same pill as an approved draft on the Sponsor AI Agent.
export const conversationStyle = (status: ConversationStatus) => THREAD_STYLE[status]!;

export const STOP_REASON_LABEL: Record<StopReason, string> = {
  ORGANISATION: "Stopped",
  UNSUBSCRIBED: "Unsubscribed",
  BOUNCED: "Email address not reachable",
  COMPLAINT: "Marked as spam",
  SUPPRESSED: "This address does not receive emails",
  DECLINED: "Not interested",
};

// Who answers the sponsor's replies while the conversation is open.
export const HANDLER_LABEL: Record<ThreadHandler, string> = {
  AGENT: "Agent handling",
  ORGANISATION: "You’re handling it",
};

type Conversation = Pick<ThreadSummary, "status" | "stopReason" | "handler" | "lastMessage">;

// Still emailing: it can be stopped, taken over or handed back.
export const isOpen = (t: Conversation) => t.status === "ACTIVE" || t.status === "REPLIED";

// The organisation writes the replies: once it handles an open conversation, or after the sponsor said
// no (still answerable, whoever was handling it).
export const canReply = (t: Conversation) =>
  (isOpen(t) && t.handler === "ORGANISATION") || (t.status === "STOPPED" && t.stopReason === "DECLINED");

// The sponsor wrote last and the agent won't answer it: someone must.
export const needsReply = (t: Conversation) => canReply(t) && t.handler === "ORGANISATION" && t.lastMessage?.sender === "SPONSOR";

// Under an email we sent; a reply has none. "Opened" means very likely seen, not read.
export const MESSAGE_STATUS_LABEL: Record<MessageStatus, string | null> = {
  QUEUED: "Sending…",
  SENT: "Sent",
  DELIVERED: "Delivered",
  OPENED: "Opened",
  CLICKED: "Opened",
  BOUNCED: "Not delivered",
  FAILED: "Could not be sent",
  RECEIVED: null,
};

export const KIND_LABEL: Record<ThreadMessage["kind"], string> = {
  INITIAL: "First email",
  FOLLOW_UP: "Follow-up",
  REPLY: "Reply",
};

// When a message was sent or received; a follow-up about to go out has neither yet.
export const messageTime = (m: ThreadMessage) => m.receivedAt ?? m.sentAt ?? m.createdAt;

// "Nov 2": the day a follow-up is planned for.
export const formatDay = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// "Wed, Nov 12, 1:30 – 2:00 AM PST": a booked call, in the viewer's time zone.
export const formatCallTime = (startIso: string, endIso: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).formatRange(new Date(startIso), new Date(endIso));
