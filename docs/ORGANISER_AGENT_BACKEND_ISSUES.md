# Organiser agent: backend issues found during panel integration (19 Nov 2026)

> **Status, 19 Nov 2026 (evening):** items 2–7 were fixed in backend `9c17aba6` (PR #570), and checked in the code.
> Item 1: the migration is reported applied. Two ops settings still have to be checked on the servers:
> `ALLOWED_ORIGIN` with the Vercel panel host, and `ASSISTANT_ORGANISER_MODEL_PROVIDER=claude` with `ANTHROPIC_API_KEY`.
> Item 8: the backend doc has been updated. The panel follow-ups from that doc's §0 are done in the panel.

These issues came up while connecting the organisation panel (DimeDroppers-FanHub-Admin) to the organiser agent. That agent is described in `backend/src/docs/FANHUB_ORGANISER_AGENT_FRONTEND.md` and was added in PR #569.

Every reference below was checked against backend `main` at commit `84f4f7b5` ("Merge pull request #569 from DimeDroppersOrg/new-task"). Paths are relative to `backend/`.

The panel side is built and works around each issue where it can (see "Panel today" under each one). Nothing below needs a change in the panel before the backend fix ships. Two fixes come with a small panel follow-up, and those sections say so.

## Summary

| # | Issue | Priority | Effort |
| - | ----- | -------- | ------ |
| 1 | Confirm the migration is applied and the worker is configured | Blocking | Ops check |
| 2 | A confirmation that expires in the queue reaches the socket as `clientRequestId: "confirm:"` | High | Small |
| 3 | `list_teams` reports 0 players and no coaches for every team | High | Small |
| 4 | The late "Update: …" message after a slow change is never pushed on the socket | Medium | Small |
| 5 | A job that fails on every attempt sends nothing on the socket | Medium | Small |
| 6 | Game `start` values in list cards are local times that end in `Z` | Medium | Small |
| 7 | Socket CORS doesn't list the panel's Vercel origin, and the domain check is loose | Low | Config + small |
| 8 | Corrections to `src/docs/FANHUB_ORGANISER_AGENT_FRONTEND.md` | Low | Doc |

---

## 1. Confirm the migration is applied and the worker is configured (blocking)

**What we know.** Production already serves the routes and the socket:
- `GET https://api.dimedroppers.com/api/v1/fanhub/org/organiser-agent/settings` without a token answers 401. A made-up route answers 404.
- The `/fanhub-org` namespace refuses an empty token with `Unauthorized`.

We could not check the database side without an organisation login. The doc (line 9) and the PR #569 commit message both say the migration was "not applied yet".

**Please confirm in production:**
1. **Migration:** `prisma/migrations/20261219090000_add_assistant_organiser_profile` is applied. Without it, `GET /settings`, `PUT /settings` and `POST /sessions` answer 500 (the `AssistantOrganiserSetting` table and the `ORGANISER` enum values are missing).
2. **Worker:** the `ai` worker group is running. The queue `{fanhub-organiser-agent}` is consumed by `src/workers/organiserAgent.worker.ts`, registered in `src/workers/_groups.ts:70`.
3. **Model provider:**
   - `ASSISTANT_ORGANISER_MODEL_PROVIDER=claude` is set. It defaults to `'default'` (`src/env.ts:338`), not `claude`.
   - `ANTHROPIC_API_KEY` is set.

**Done when:** with an organisation token, `GET /settings` answers 200, and a message sent with `POST /sessions/:id/messages` gets a reply on the socket.

---

## 2. A confirmation that expires in the queue reaches the socket as `clientRequestId: "confirm:"`

**Where:**
- `src/services/assistant/organiser/AssistantOrganiserAgentService.ts:99-105`: `queueConfirm` builds `clientRequestId = "confirm:<invocation.id>"`, returns it in the 202, and queues the job with only `{ kind, sessionId, token, decision }`.
- `src/services/assistant/organiser/AssistantOrganiserAgentService.ts:134-137`: `run()` rebuilds the id from the token.
- `src/services/assistant/organiser/AssistantOrganiserAgentService.ts:182-185`:
  ```ts
  private static confirmRequestId(token: string): string {
    const check = AssistantConfirmationToken.verify(token);
    return `${CONFIRM_REQUEST_PREFIX}${check.valid ? check.claims.invocationId : ''}`;
  }
  ```
- `src/queues/organiserAgent.queue.ts:14-19`: `OrganiserAgentConfirmJob` has no `invocationId`.

**What happens:**
1. A Confirm arrives with a token that is still valid.
2. The API answers 202 with `clientRequestId: "confirm:abc"`.
3. The token expires (10 minutes, `AssistantConfirmationToken.ts:4`) before the worker runs the job, for example because the worker is busy or the job is retried.
4. `verify()` now fails, so the worker publishes `clientRequestId: "confirm:"` with no id. The error is "This confirmation has expired. Please ask again."

The client cannot match that socket message to the Confirm it sent.

**Panel today:** it treats any `"confirm:…"` socket message in that thread as the answer to its pending Confirm.

**Fix:** carry the invocation id in the job instead of decoding the token again.
```ts
// src/queues/organiserAgent.queue.ts
export interface OrganiserAgentConfirmJob {
  kind: 'confirm';
  sessionId: string;
  token: string;
  decision: AssistantConfirmationBody['decision'];
  invocationId: string; // new
}

// AssistantOrganiserAgentService.queueConfirm (around line 102)
await organiserAgentQueue.add(
  'confirm',
  { kind: 'confirm', sessionId: session.id, token, decision: body.decision, invocationId: invocation.id },
  { jobId: `confirm-${invocation.id}-${body.decision.toLowerCase()}` }
);

// AssistantOrganiserAgentService.run (around line 134)
const clientRequestId =
  data.kind === 'turn'
    ? data.clientRequestId
    : data.invocationId
      ? `${CONFIRM_REQUEST_PREFIX}${data.invocationId}`
      : AssistantOrganiserAgentService.confirmRequestId(data.token); // jobs queued before the deploy
```

**Done when:** a Confirm whose token expires before the worker runs it produces a socket message whose `clientRequestId` equals the one in the 202, with `error: "This confirmation has expired. Please ask again."`. To test this, shorten the token TTL locally or pause the worker past expiry.

---

## 3. `list_teams` reports 0 players and no coaches for every team

**Where:** `src/services/assistant/tools/organiser/teams.ts`.
- Line 169: the tool tells the model it returns teams "with level, gender, **player count and coaches**".
- Lines 101-115: `teamLine()` hard-codes `players: 0` and `coaches: []`.
- Line 185: the list tool builds every team with `teamLine(...)`.
- Lines 117-125: `summaryLine()` already uses the real values (`team.playerCount`, `team.coaches`), but only the single-team tools use it (lines 251 and 310).

**What happens:** asked "How many players are on Varsity Boys?" or "Who coaches the JV team?", the model reads the tool result and answers "0 players" or "no coaches". That is wrong, and the organiser trusts it.

**Panel today:** nothing it can do. The `ORG_LIST` card leaves those two columns out, but the model's written answer uses them.

**Fix (either one):**
- **(a) Fill the real values in the list query.** Add a player count and the coaches' names to the `findTeams` select (`teams.ts:127+`), then map them like `summaryLine` does. Check the relation names in `prisma/schema.prisma`.
- **(b) Drop the fields.** Remove `players` and `coaches` from the list result and from the tool description at line 169, so the model calls the single-team tool when it needs them.

**Done when:** "How many players does <team> have?" gives the same number as the Teams page in the panel.

---

## 4. The late "Update: …" message after a slow change is never pushed on the socket

**Where:** `src/services/assistant/core/AssistantOrchestrator.ts`.
- **Lines 1070-1097, `settleLate()`:** when a change outlives the turn's time budget, the turn first stores and returns a `PENDING` reply ("Dime is working on it."). When the change finishes, `settleLate` calls `postUpdate`.
- **Lines 1100-1119, `postUpdate()`:**
  - It stores a second assistant message: `"Update: the action you asked for has now finished."` plus a `receipt` block, or the failure text.
  - It does this with `AssistantSessionService.addAssistantMessage(...)` and publishes nothing.

**What happens:** the organiser sees "Dime is working on it." and is never told the change finished, unless they reload the thread.

**Panel today:** after a `PENDING` reply it polls `GET /sessions/:id` every 3 seconds for 2 minutes. Those calls count against the organisation's 120-per-10-minutes chat limit.

**Fix:** publish the update on the organiser socket when the session is an organiser session:
- Load `profile` and `schoolId` with the session at line 1105.
- Use the `id` that `addAssistantMessage` returns.

```ts
const message = await AssistantSessionService.addAssistantMessage(sessionId, text, result.status, blocks);
if (open.profile === AssistantProfile.ORGANISER && open.schoolId) {
  await AssistantOrganiserAgentService.publish({
    schoolId: open.schoolId,
    sessionId,
    clientRequestId: `update:${message.id}`, // any id is fine: the panel reloads the open thread on every message for it
    response: {
      sessionId,
      messageId: message.id,
      state: result.status,
      intentClass: null,
      workflowId: null,
      authorization: null,
      blocks,
    },
    error: null,
  });
}
```

`publish` may currently be private or only reachable from the organiser service. If so, expose it, or move it to a small helper that both files can use. Watch for a circular import between the orchestrator and the organiser service.

**Done when:** a change that times out and then finishes produces a socket message for its session carrying the "Update: …" text and its receipt.

**Panel follow-up:** once this ships, the panel drops its 2-minute poll after `PENDING` replies.

---

## 5. A job that fails on every attempt sends nothing on the socket

**Where:**
- `src/services/assistant/organiser/AssistantOrganiserAgentService.ts:154-166`: `run()` catches only `ApiError` and publishes it. Any other error is re-thrown.
- `src/queues/organiserAgent.queue.ts:25-30`: BullMQ retries with `attempts: 3`. After the third failure the job is moved to failed (`removeOnFail: 100`) and nothing is published.
- `src/workers/organiserAgent.worker.ts`: has no `failed` handler.

**What happens:** if the model provider is down, a tool throws, or the database times out, the organiser's message never gets a reply.

**Panel today:** after 60 seconds with no reply it shows "Still working. The reply will appear here when it's ready." with a "Check again" button.

**Fix:** on the last attempt, publish an error for the turn so the client can stop waiting. For example, in `run()`:
```ts
} catch (error) {
  if (error instanceof ApiError) { /* unchanged */ }
  const lastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
  if (lastAttempt) {
    await AssistantOrganiserAgentService.publish({
      schoolId: session.schoolId,
      sessionId: session.id,
      clientRequestId,
      response: null,
      error: 'Something went wrong. Please try again.',
    });
  }
  throw error;
}
```
A worker `failed` event that checks `job.attemptsMade >= job.opts.attempts` works just as well. Use whichever fits the worker factory (`src/workers/_factory.ts`).

**Done when:** making the tool runner throw a plain `Error` in development gives one socket message with `response: null` and a non-empty `error`, after the last retry.

---

## 6. Game `start` values in list cards are local times that end in `Z`

**Where:**
- `src/services/fanhub/scheduleDto.ts:71-74` documents it:
  > `start` is local wall time for the school's state with a misleading "Z" suffix
- The same DTO has `utcTime` (the real instant) and `timezone` (e.g. `"ET"`).
- `src/services/assistant/tools/organiser/schedules.ts:155-173`: `gameLine()` copies `event.start` as it is.
- Lines 289-300 put it in the `ORG_LIST` card items as `start`.

**What happens:** a game at 7:00 PM local arrives as `"2026-11-21T19:00:00.000Z"`. Any client, or the model, that reads the `Z` as UTC shows the wrong time; in Eastern time that's 2:00 PM.

**Panel today:**
- It shows every ISO date-time in a card as written, dropping the `Z`.
- The catch: real instants, such as a campaign's `endsAt`, are then shown in UTC wall time.
- The panel cannot tell the two kinds apart without a convention.

**Fix (the convention we'd like):**
- **Local wall times are sent without a zone suffix,** plus the `timezone` label when known. For example: `start: "2026-11-21T19:00"`, `timezone: "ET"`.
- **Real instants** (`endsAt`, `createdAt`, …) keep `Z` or an explicit offset.

For games: in `gameLine()`, send `start: event.start?.replace(/\.000Z$|Z$/, '')` and add `timezone` from the DTO. Apply the same rule to any other organiser tool that passes a schedule `start` or `end` into a card.

**Done when:** `ORG_LIST` game items have no `Z` on `start`, and `endsAt`-style instants still do.

**Panel follow-up:** once this ships, the panel converts `Z`/offset values to the viewer's local time and shows zone-less values as written.

---

## 7. Socket CORS doesn't list the panel's Vercel origin, and the domain check is loose

**Where:**
- `src/constants/cors.ts:1-17`, `isOriginAllowed()`:
  - It allows an origin when it *contains* one of `BASE_DOMAIN` (default `localhost,dimedroppers.com`), or when it appears in `ALLOWED_ORIGIN`.
  - `socketCorsOptions` (lines 33-44) uses it, and the Socket.IO server applies that at `src/app.ts:90`.
- The REST routes under `/api/v1/fanhub` use `cors({ origin: true })` (`src/app.ts:48-51`), so they accept the panel from any origin.

**What happens:**
- The deployed panel runs at `https://dime-droppers-fan-hub-admin.vercel.app`. That doesn't contain `dimedroppers.com`, because of the hyphens.
- Socket.IO applies its `cors` option to the HTTP long-polling transport. The panel connects with `transports: ["websocket"]`, so this should not block it today. If the client ever falls back to polling, though, the connection is refused from Vercel.

**Fix:**
1. Add `https://dime-droppers-fan-hub-admin.vercel.app`, and any other panel host, to `ALLOWED_ORIGIN` in the production env. This is a config change only.
2. Optional hardening: `requestOrigin.includes(domain)` also accepts origins like `https://dimedroppers.com.example.net` or `http://localhost.example.net`. Compare the parsed hostname instead:
   ```ts
   const host = new URL(requestOrigin).hostname;
   baseDomains.some((d) => host === d || host.endsWith(`.${d}`));
   ```
   This changes `corsOptions` for the strict REST routes too, so check the other front ends' hosts first.

**Done when:** a Socket.IO client from the Vercel origin can connect with the default transports (polling, then upgrade).

---

## 8. Corrections to `src/docs/FANHUB_ORGANISER_AGENT_FRONTEND.md`

Each item below was checked in the code.

**Status and environment**
- **Line 9:** still says "built on branch `new-task`; migration … not applied yet". The branch is merged; update this after item 1.
- **§11:** `ASSISTANT_ORGANISER_MODEL_PROVIDER` defaults to `'default'` (`src/env.ts:338`). Say it must be set to `claude`, with `ANTHROPIC_API_KEY`.

**Response envelope** (applies to every section)
- This feature uses `ApiResponse` (`src/utils/ApiResponse.ts`), so every body is `{ success, statusCode, data, message, error }`, with `data` being the object or list itself.
- The other org-panel endpoints use `ApiResponseNew`, which wraps a single object as `data: [payload]` and adds `errorCode`.
- Please state this difference, because a client written for the other endpoints reads `data[0]` and gets `undefined`.

**§1 Rate limits**
- The key is the organisation, `school:<schoolId>` (`src/middlewares/assistantChatRateLimiter.ts:6`), not the caller. All organiser users and tabs of one organisation share the 120 chat calls.
- No shared store is configured, so each API instance counts separately.
- `GET /sessions` and `GET /sessions/:id` count against the chat limit.
- A 429 body is `{ success: false, message }` only, not the usual envelope.
- **§6 polling advice:** "every 3 seconds for 60 seconds" is 20 calls per message. Mention the cost, or suggest a slower interval.

**§2 Settings**
- **Line 57:** the suggested label for CONTEXT is "Overview", but CONTEXT covers the organisation profile only (§8 itself calls it "Profile"). The overview and live-games tools are under OPERATIONS. Suggest "Organisation profile".
- SCORE currently has no tools, so turning it off changes nothing. Worth saying until score tools ship.

**§5 Replies**
- An assistant message's `text` is repeated as `blocks[0]` (a `text` block, `AssistantOrchestrator.ts:395`). Clients must render one or the other.
- Only `ORG_LIST`, `ORG_RECORD_PREVIEW` and `ORG_RECORD` cards reach organisers. The `CONTEXT` card (line 254) comes only from the athletic-director tool `tools/ad/getOrgContext.ts`.
- `fanhub_link` and `external_link` blocks are never produced for this profile, because every organiser tool sets `nextActions: []` (`tools/organiser/shared.ts:34`).
- `AWAITING_APPROVAL` never happens for organisers.
- Only the newest assistant message's options are valid. Older ones answer "That choice is no longer available. Please ask again." (`AssistantOrchestrator.ts:85`)
- A Confirm or Cancel is stored in the thread as a user message with the text "Confirm" or "Cancel".
- The 200 replay of an already-answered `clientRequestId` has `intentClass`, `workflowId` and `authorization` set to `null` (`AssistantOrganiserAgentService.ts:204-213`).
- The read-only profile and overview cards use `ORG_RECORD` with `action: "updated"` even though nothing changed.

**§7 Confirmations**
- **Line 287:** a token from another organiser's thread answers **404** `Conversation not found.`, because `getOwned` runs first (`AssistantOrganiserAgentService.ts:91`, `AssistantSessionService.ts:66`). It does not answer 400.
- **Line 291:** a second Confirm of the same token answers **200 with the first reply**, because `queueConfirm` returns the stored answer before queueing (lines 99-101). `This was already handled.` (`AssistantOrchestrator.ts:89`, `:296`) cannot be reached through this API.

**§3 Threads**
- `GET /sessions` returns at most 50 threads (`ASSISTANT_SESSION_LIST_LIMIT`, `AssistantSessionService.ts:53`), with no pagination.
- The organiser's message is stored by the worker, not at the 202. Right after sending, a reload doesn't show it yet, and a new thread isn't listed until the worker has run.
