import { backendFetch, forceSignOut } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type {
  Accepted,
  AgentSettings,
  AgentSettingsUpdate,
  MessageResponse,
  Thread,
  ThreadSummary,
} from "@/utils/types/organiser-agent";

export interface AgentResult<T> {
  // HTTP status; 0 when the request never reached the API.
  status: number;
  data: T | null;
  // The backend's message on a failure, written for the organisation (shown as is).
  message: string | null;
}

// The organiser agent answers with `data` as the object itself; an array is unwrapped too, in case it
// moves to the `data: [payload]` envelope of the other org endpoints.
const one = <T>(data: unknown): T | null => ((Array.isArray(data) ? data[0] : data) ?? null) as T | null;

// Through backendFetch, not apiCall: apiCall replaces 400s with a generic toast, and the callers here
// show the backend's own message ("This confirmation has expired. Please ask again.") or none (polling).
async function request<T>(
  endpoint: string,
  { method = "GET", body, read = one }: { method?: string; body?: object; read?: (data: unknown) => T | null } = {}
): Promise<AgentResult<T>> {
  try {
    const res = await backendFetch(endpoint, {
      method,
      ...(body && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok) return { status: res.status, data: read(json?.data), message: null };
    // backendFetch already refreshed the token and retried once: a 401 now means the session is over.
    if (res.status === 401) forceSignOut();
    const message = typeof json?.message === "string" && json.message.trim() ? json.message : null;
    return { status: res.status, data: null, message };
  } catch {
    return { status: 0, data: null, message: null };
  }
}

export const getSettings = () => request<AgentSettings>(routes.api.organiserAgentSettings);

export const saveSettings = (update: AgentSettingsUpdate) =>
  request<AgentSettings>(routes.api.organiserAgentSettings, { method: "PUT", body: update });

// The organisation's own timezone wins on the backend; the browser's is only a fallback.
export const createSession = (timezone: string | null) =>
  request<Thread>(routes.api.organiserAgentSessions, { method: "POST", body: timezone ? { timezone } : {} });

export const listSessions = () =>
  request<ThreadSummary[]>(routes.api.organiserAgentSessions, {
    read: (data) => (Array.isArray(data) ? (data as ThreadSummary[]) : null),
  });

export const getSession = (id: string) => request<Thread>(routes.api.organiserAgentSession(id));

export const deleteSession = (id: string) =>
  request<{ id: string }>(routes.api.organiserAgentSession(id), { method: "DELETE" });

// 202: Accepted (the reply comes on the socket). 200: this clientRequestId was already answered.
export const postMessage = (id: string, body: { text: string; clientRequestId: string; optionId: string | null }) =>
  request<Accepted | MessageResponse>(routes.api.organiserAgentMessages(id), { method: "POST", body });

// 202: Accepted with clientRequestId "confirm:<invocationId>". 200: already answered (the earlier reply).
export const postConfirmation = (token: string, decision: "CONFIRM" | "CANCEL") =>
  request<Accepted | MessageResponse>(routes.api.organiserAgentConfirmation(token), {
    method: "POST",
    body: { decision },
  });
