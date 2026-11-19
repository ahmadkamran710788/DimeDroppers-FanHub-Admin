// Organiser agent: /fanhub/org/organiser-agent/* (organisation token), FANHUB_ORGANISER_AGENT_FRONTEND.md.
// Unlike most org endpoints, these answer with `data` as the plain object or list, not wrapped in an array.

// One switchable area of the agent (its tools stop when it's off).
export type AgentArea =
  | "CONTEXT"
  | "SCHEDULE"
  | "SCORE"
  | "ROSTER"
  | "FUNDRAISING"
  | "TICKETS"
  | "ENGAGEMENT"
  | "MESSAGING"
  | "COMMERCIAL"
  | "TOURNAMENT"
  | "OPERATIONS";

export interface AgentSettings {
  enabled: boolean;
  areas: { family: AgentArea; enabled: boolean }[];
  // null until the organisation first saves (the agent is then on with every area).
  updatedAt: string | null;
}

// PUT /settings: send one or both. `disabledFamilies` replaces the whole list.
export interface AgentSettingsUpdate {
  enabled?: boolean;
  disabledFamilies?: AgentArea[];
}

// COMPLETED done or answered; NEEDS_INPUT a question, a choice or a confirmation; BLOCKED not allowed
// (agent or area off, another organisation). AWAITING_APPROVAL never happens for organisers.
export type MessageState = "COMPLETED" | "PENDING" | "NEEDS_INPUT" | "BLOCKED" | "FAILED" | "AWAITING_APPROVAL";

export interface ThreadSummary {
  id: string;
  // The first 80 characters of the first message; null until the worker stores it.
  title: string | null;
  // The newest reply's state.
  lastState: MessageState | null;
  createdAt: string;
  updatedAt: string;
}

export interface TextBlock {
  type: "text";
  text: string;
}

// ORG_LIST: a table whose item keys are the columns.
export interface OrgListData {
  title: string;
  items: Record<string, unknown>[];
  // Rows left out of `items`.
  more: number;
}

// ORG_RECORD_PREVIEW: what a create, change or removal will do, shown with the confirm block.
export interface OrgRecordPreviewData {
  kind: string;
  action: "create" | "update" | "remove";
  fields: Record<string, unknown>;
  note: string | null;
}

// ORG_RECORD: the record after a change (read-only profile and overview cards also say "updated").
export interface OrgRecordData {
  kind: string;
  action: "created" | "updated" | "removed";
  record: Record<string, unknown>;
}

export interface CardBlock {
  type: "card";
  // ORG_LIST, ORG_RECORD_PREVIEW, ORG_RECORD; others may appear as more areas ship.
  template: string;
  data: Record<string, unknown>;
  source: { label: string; asOf: string } | null;
  sponsored: unknown | null;
}

export interface AgentOption {
  id: string;
  label: string;
  value: Record<string, unknown>;
}

export interface OptionsBlock {
  type: "options";
  options: AgentOption[];
}

export interface ConfirmBlock {
  type: "confirm";
  token: string;
  summary: string;
  // 10 minutes after the preview.
  expiresAt: string;
}

export interface ReceiptBlock {
  type: "receipt";
  receiptId: string;
  summary: string;
}

export interface FanhubLinkBlock {
  type: "fanhub_link";
  label: string;
  path: string;
  handoffId: string | null;
}

export interface ExternalLinkBlock {
  type: "external_link";
  label: string;
  url: string;
  provider: string;
  owner: "DIME" | "OFFICIAL_PROVIDER" | "THIRD_PARTY";
}

export type Block = TextBlock | CardBlock | OptionsBlock | ConfirmBlock | ReceiptBlock | FanhubLinkBlock | ExternalLinkBlock;

export interface ThreadMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  // An assistant message repeats its text as the first (text) block.
  text: string | null;
  state: MessageState | null;
  blocks: Block[];
  createdAt: string;
}

export interface Thread {
  id: string;
  profile: "ORGANISER";
  title: string | null;
  entry: { schoolId: string | null; teamId: string | null; eventId: string | null } | null;
  createdAt: string;
  updatedAt: string;
  // Oldest first, every message (no paging).
  messages: ThreadMessage[];
}

// A reply, on the socket or as the 200 of a request that was already answered.
export interface MessageResponse {
  sessionId: string;
  messageId: string;
  state: MessageState;
  intentClass: string | null;
  workflowId: string | null;
  authorization: {
    decision: "AUTHORIZED" | "DENIED" | "CONFIRMATION_REQUIRED";
    receiptId: string | null;
  } | null;
  blocks: Block[];
}

// The 202 of a message or a confirmation: the worker produces the reply.
export interface Accepted {
  sessionId: string;
  clientRequestId: string;
  state: "PENDING";
  text: string;
}

// `fanhub:org:agent:message` on the /fanhub-org namespace, for every thread of the organisation.
export interface AgentSocketMessage {
  sessionId: string;
  // A confirmation's is "confirm:<invocationId>".
  clientRequestId: string;
  response: MessageResponse | null;
  // Set (and `response` null) when the turn couldn't run.
  error: string | null;
}
