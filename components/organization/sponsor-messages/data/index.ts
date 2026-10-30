import { THREAD_STYLE } from "@/components/organization/sponsor-ai-agent/data";
import type {
  ConversationStatus,
  ConversationStatusFilter,
  MessageStatus,
  StopReason,
  ThreadMessage,
} from "@/utils/types/sponsor-ai";

// No socket yet: the list is asked for again this often while the screen is open.
export const LIST_POLL_MS = 30_000;

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
};

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
