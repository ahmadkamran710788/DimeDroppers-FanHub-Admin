# Fan Hub — Videographer Pool & Official Videographer API

Added 28 Sep 2026. A field-for-field mirror of the scorekeeper pool + official-scorekeeper
assignment, for videographers. Same flow, same statuses, same responses — only the names differ.

## Flow

1. **Fan requests** to join a school's videographer pool → row `REQUESTED` (or the org **invites** by
   email → `INVITED`; the fan accepts from the email link, or is linked automatically on signup).
2. **Org accepts** → `ACTIVE`. The fan is now a videographer for that school. No verification code.
3. **Org assigns** an ACTIVE member to one game → `SchoolScheduleEvent.officialVideographerFanId`.
   The game joins the fan's My Schedule and followers get a `VIDEOGRAPHER_ASSIGNED` push.
4. Every schedule response shows it next to the scorekeeper:

```json
"officialScorekeeperFanId": "789709e4-…",
"officialScorekeeper": { "id": "789709e4-…", "name": "Hanzla Tariq" },
"officialVideographerFanId": "0d2c…",
"officialVideographer": { "id": "0d2c…", "name": "Video Grapher" },
```

One game has at most one official videographer (and independently, one official scorekeeper; the
same fan can be both). Statuses: `INVITED · REQUESTED · ACTIVE · REJECTED · REVOKED`.

> Being the official videographer does **not** yet authorize going live — streaming permission for
> videographers is a separate, later decision.

## Endpoints (all under `/api/v1`)

### Fan app — `Authorization: Bearer <fan token>`

| Method | Path                                                                             | What                                                                    |
| ------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| POST   | `/mobile/fanhub/schools/:schoolId/videographer-pool/request`                     | Ask to join the school's pool. 409 if already pending or already ACTIVE |
| GET    | `/mobile/fanhub/videographer-pool/invites`                                       | Pending email invites for this fan                                      |
| GET    | `/mobile/fanhub/schools/:schoolId/schedule/:scheduleEventId/videographer-status` | `{ "isOfficialVideographer": true \| false }`                           |

### Org console — `Authorization: Bearer <org token>`

| Method | Path                                             | Body                                  | What                               |
| ------ | ------------------------------------------------ | ------------------------------------- | ---------------------------------- |
| POST   | `/fanhub/org/videographer-pool`                  | `{ "email" }`                         | Invite by email (7-day link)       |
| GET    | `/fanhub/org/videographer-pool?status=REQUESTED` | —                                     | List pool (optional status filter) |
| POST   | `/fanhub/org/videographer-pool/:memberId/accept` | —                                     | REQUESTED → ACTIVE                 |
| POST   | `/fanhub/org/videographer-pool/:memberId/reject` | —                                     | REQUESTED → REJECTED               |
| DELETE | `/fanhub/org/videographer-pool/:memberId`        | —                                     | ACTIVE → REVOKED                   |
| GET    | `/fanhub/org/videographer/:scheduleEventId`      | —                                     | Who is assigned                    |
| PUT    | `/fanhub/org/videographer/:scheduleEventId`      | `{ "fanId" }`                         | Assign (fan must be ACTIVE)        |
| PUT    | `/fanhub/org/videographer/bulk-assign`           | `{ "fanId", "scheduleEventIds": [] }` | Assign one fan to many games       |
| DELETE | `/fanhub/org/videographer/:scheduleEventId`      | —                                     | Unassign                           |

### Public

| Method | Path                                              | What                                               |
| ------ | ------------------------------------------------- | -------------------------------------------------- |
| GET    | `/fanhub/videographer-pool/invites/:token/accept` | Opened from the invite email; returns an HTML page |

Responses use `ApiResponseNew` (`data` is an array), exactly like the scorekeeper routes.

## Errors

| HTTP | Message key                                 | When                                                      |
| ---- | ------------------------------------------- | --------------------------------------------------------- |
| 409  | `VIDEOGRAPHER_POOL_REQUEST_ALREADY_PENDING` | Fan re-requests while pending                             |
| 409  | `VIDEOGRAPHER_POOL_REQUEST_ALREADY_ACTIVE`  | Fan is already an accepted videographer                   |
| 409  | `VIDEOGRAPHER_POOL_INVITE_ALREADY_EXISTS`   | Org invites an email already INVITED / REQUESTED / ACTIVE |
| 404  | `VIDEOGRAPHER_POOL_MEMBER_NOT_FOUND`        | Accept/reject/revoke on a wrong-state or other-school row |
| 400  | `VIDEOGRAPHER_POOL_MEMBER_NOT_ACTIVE`       | Assign a fan who is not ACTIVE in the pool                |
| 404  | `SCHEDULE_EVENT_NOT_FOUND`                  | Game does not belong to this org                          |

## Where it lives

- Schema: `FanHubVideographerPoolMember`, enum `FanHubVideographerPoolStatus`,
  `SchoolScheduleEvent.officialVideographerFanId`, `FanHubNotificationType.VIDEOGRAPHER_ASSIGNED`
  (migration `20260928120000_fanhub_videographer_pool`).
- Services: `fanhubOrg/fanhubOrgVideographerPool.service.ts`, `fanhubOrg/fanhubOrgVideographer.service.ts`,
  `fanhubFan/fanhubFanVideographerPool.service.ts`.
- Schedule DTO: `services/fanhub/scheduleDto.ts` (`officialVideographerFanId` / `officialVideographer`),
  resolved in the same query as the scorekeeper by every schedule list. Game summary
  (`/mobile/fanhub/games/:id/summary`) also returns `game.officialVideographer`.
- Unrelated and untouched: `UserRole.VIDEOGRAPHER` (main app) and `FanHubTeamRole.VIDEOGRAPHER`
  (team chat role).
