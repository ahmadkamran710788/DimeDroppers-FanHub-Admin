# Scorekeeper requests per game — organisation console note (2026-09-29)

Written for the admin panel developer. Fans can now ask to be the **official scorekeeper of a
specific game** from the Fan Hub app. This document is the organisation side: a review queue and
two actions, accept and reject. It is an **alternative flow** next to the existing scorekeeper
pool (`/fanhub/org/scorekeeper-pool`) and per-game assignment (`/fanhub/org/scorekeeper`), which
are unchanged.

Base URL: `{{API_BASE_URL}}/api/v1/fanhub/org/scorekeeper-requests`. Every call needs the
organisation token: `Authorization: Bearer <ORG_ACCESS_TOKEN>`. Every query is scoped to the
signed-in organisation's own school; a request of another school answers 404. All responses below
were captured from a real run.

| Call | What it does |
| --- | --- |
| `GET /` | Review queue. `PENDING` by default; `?status=ACCEPTED` or `REJECTED` for history |
| `POST /{requestId}/accept` | Adds the fan to the pool if needed, assigns them to the game, saves the game to their My Schedule, notifies |
| `POST /{requestId}/reject` | Declines with an optional note. Nothing else changes |

---

## 1. What accept does, in order

1. **Pool.** If the fan is not an ACTIVE member of the school's scorekeeper pool, they become one.
   A pool row in any other state (INVITED, REQUESTED, REJECTED, REVOKED) is promoted to ACTIVE; no
   row at all is created as ACTIVE. An ACTIVE row is left untouched.
2. **Assignment.** The fan becomes `officialScorekeeperFanId` on the game. This overwrites any
   previous scorekeeper, exactly like the existing assign endpoint.
3. **My Schedule.** The game is added to the fan's saved games (idempotent).
4. **Notification.** "Scorekeeper assigned" (`SCOREKEEPER_ASSIGNED`) goes to the fan and to
   followers of either team, with home/away names and logos.
5. The request becomes `ACCEPTED` with your `reviewNote` and `reviewedAt`.

Other pending requests for the same game are **not** touched. If two fans asked for one game,
accept one and reject the other; the queue shows both.

Reject only marks the request `REJECTED` with your note. The fan can request the same game again
later; the request then reappears as `PENDING`.

---

## 2. Review queue — `GET /`

Query: `status` (`PENDING` default, `ACCEPTED`, `REJECTED`), `page` (default 1), `limit` (default
20, max 100). Pending is ordered oldest first, so the queue is first come, first served.

```bash
curl "{{API_BASE_URL}}/api/v1/fanhub/org/scorekeeper-requests?page=1&limit=10" \
  -H "Authorization: Bearer $ORG_TOKEN"
```

Real response (200):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Scorekeeper requests fetched successfully",
  "errorCode": null,
  "data": [
    {
      "items": [
        {
          "id": "be08a490-add7-491e-ace5-c1ea789546a0",
          "status": "PENDING",
          "message": "I will be at the game and can keep score",
          "reviewNote": null,
          "reviewedAt": null,
          "createdAt": "2026-09-29T14:09:15.957Z",
          "fan": { "id": "0e81671f-2b8b-4f8b-99ec-86f475949d61", "name": "Kashuf", "email": "kashufjovera@gmail.com" },
          "game": {
            "id": "51113940-0095-4a56-84a5-ddf483cf5534",
            "title": "Twin Lakes Academy Middle vs Alfred I. Dupont Middle",
            "opponent": "Alfred I. Dupont Middle School",
            "sport": "Football",
            "gender": "Boys",
            "level": null,
            "start": "2026-09-29T17:30:00.000Z",
            "end": null,
            "utcTime": "2026-09-29T21:30:00.000Z",
            "status": "confirmed",
            "isOfficialScorekeeper": false
          },
          "school": { "id": "788df054-c473-4b26-9acc-2ccc49760b77", "name": "TWIN LAKES ACADEMY MIDDLE SCHOOL", "logoUrl": "https://production-gofan-assets.s3.amazonaws.com/uploads/school/logo/FL25645/Twin%20Lakes%20Middle%20School%20Logo.png" },
          "inPool": false
        },
        {
          "id": "1fd3b3ba-1d79-46a1-ac5b-18f4957b295e",
          "status": "PENDING",
          "message": "Happy to cover these",
          "reviewNote": null,
          "reviewedAt": null,
          "createdAt": "2026-09-29T14:09:20.166Z",
          "fan": { "id": "0e81671f-2b8b-4f8b-99ec-86f475949d61", "name": "Kashuf", "email": "kashufjovera@gmail.com" },
          "game": {
            "id": "f60a2f88-3d72-4145-9f91-b9b35359431b",
            "title": "Twin Lakes Academy Middle vs Fort Caroline Middle",
            "opponent": "Fort Caroline Middle School",
            "sport": "Volleyball",
            "gender": "Girls",
            "level": null,
            "start": "2026-09-30T17:30:00.000Z",
            "end": null,
            "utcTime": "2026-09-30T21:30:00.000Z",
            "status": "confirmed",
            "isOfficialScorekeeper": false
          },
          "school": { "id": "788df054-c473-4b26-9acc-2ccc49760b77", "name": "TWIN LAKES ACADEMY MIDDLE SCHOOL", "logoUrl": "https://production-gofan-assets.s3.amazonaws.com/uploads/school/logo/FL25645/Twin%20Lakes%20Middle%20School%20Logo.png" },
          "inPool": false
        }
      ],
      "pendingCount": 2,
      "pagination": { "page": 1, "limit": 10, "total": 2, "totalPages": 1, "isLast": true }
    }
  ]
}
```

`data` is a one-element list; read `data[0]`.

### Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Request id, used in the accept / reject URLs |
| `status` | `PENDING` \| `ACCEPTED` \| `REJECTED` | |
| `message` | string \| null | The fan's note |
| `reviewNote`, `reviewedAt` | string \| null, ISO \| null | Your decision note and time |
| `createdAt` | ISO | When the fan asked |
| `fan` | `{ id, name, email }` | Who is asking |
| `game` | object | `id`, `title`, `opponent`, `sport`, `gender`, `level`, `start`/`end` (local strings), `utcTime` (real UTC start), `status` |
| `game.isOfficialScorekeeper` | bool | This fan is currently the game's official scorekeeper |
| `school` | `{ id, name, logoUrl }` | Your school |
| `inPool` | bool | The fan is already an ACTIVE member of your scorekeeper pool. `false` means accepting will add them |
| `pendingCount` | int | Pending requests for your school regardless of the `status` filter; use it for the sidebar badge |

Suggested columns: fan (name, email, an "In pool" tag from `inPool`), game (title, sport, date
from `utcTime`), message, requested at, actions. Show a warning if the game already has a
different official scorekeeper, since accept overwrites that assignment.

---

## 3. Accept — `POST /{requestId}/accept`

Body: `{ "reviewNote": "..." }`, optional, max 500 characters.

```bash
curl -X POST "{{API_BASE_URL}}/api/v1/fanhub/org/scorekeeper-requests/be08a490-add7-491e-ace5-c1ea789546a0/accept" \
  -H "Authorization: Bearer $ORG_TOKEN" -H "Content-Type: application/json" \
  -d '{"reviewNote":"Thanks, see you at the gym"}'
```

Real response (200). Note `isOfficialScorekeeper: true` and `inPool: true` (this fan had only a
REQUESTED pool row before; accept promoted it):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Scorekeeper request accepted",
  "errorCode": null,
  "data": [
    {
      "id": "be08a490-add7-491e-ace5-c1ea789546a0",
      "status": "ACCEPTED",
      "message": "I will be at the game and can keep score",
      "reviewNote": "Thanks, see you at the gym",
      "reviewedAt": "2026-09-29T14:09:27.146Z",
      "createdAt": "2026-09-29T14:09:15.957Z",
      "fan": { "id": "0e81671f-2b8b-4f8b-99ec-86f475949d61", "name": "Kashuf", "email": "kashufjovera@gmail.com" },
      "game": {
        "id": "51113940-0095-4a56-84a5-ddf483cf5534",
        "title": "Twin Lakes Academy Middle vs Alfred I. Dupont Middle",
        "opponent": "Alfred I. Dupont Middle School",
        "sport": "Football",
        "gender": "Boys",
        "level": null,
        "start": "2026-09-29T17:30:00.000Z",
        "end": null,
        "utcTime": "2026-09-29T21:30:00.000Z",
        "status": "confirmed",
        "isOfficialScorekeeper": true
      },
      "school": { "id": "788df054-c473-4b26-9acc-2ccc49760b77", "name": "TWIN LAKES ACADEMY MIDDLE SCHOOL", "logoUrl": "https://production-gofan-assets.s3.amazonaws.com/uploads/school/logo/FL25645/Twin%20Lakes%20Middle%20School%20Logo.png" },
      "inPool": true
    }
  ]
}
```

Accepting the same request twice (409):

```json
{
  "success": false,
  "statusCode": 409,
  "message": "This request has already been reviewed",
  "data": { "errors": [], "data": null },
  "error": null
}
```

---

## 4. Reject — `POST /{requestId}/reject`

Body: `{ "reviewNote": "..." }`, optional, max 500 characters. The note is shown to the fan.

```bash
curl -X POST "{{API_BASE_URL}}/api/v1/fanhub/org/scorekeeper-requests/1fd3b3ba-1d79-46a1-ac5b-18f4957b295e/reject" \
  -H "Authorization: Bearer $ORG_TOKEN" -H "Content-Type: application/json" \
  -d '{"reviewNote":"Already covered by our staff"}'
```

Real response (200):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Scorekeeper request rejected",
  "errorCode": null,
  "data": [
    {
      "id": "1fd3b3ba-1d79-46a1-ac5b-18f4957b295e",
      "status": "REJECTED",
      "message": "Happy to cover these",
      "reviewNote": "Already covered by our staff",
      "reviewedAt": "2026-09-29T14:09:34.747Z",
      "createdAt": "2026-09-29T14:09:20.166Z",
      "fan": { "id": "0e81671f-2b8b-4f8b-99ec-86f475949d61", "name": "Kashuf", "email": "kashufjovera@gmail.com" },
      "game": {
        "id": "f60a2f88-3d72-4145-9f91-b9b35359431b",
        "title": "Twin Lakes Academy Middle vs Fort Caroline Middle",
        "opponent": "Fort Caroline Middle School",
        "sport": "Volleyball",
        "gender": "Girls",
        "level": null,
        "start": "2026-09-30T17:30:00.000Z",
        "end": null,
        "utcTime": "2026-09-30T21:30:00.000Z",
        "status": "confirmed",
        "isOfficialScorekeeper": false
      },
      "school": { "id": "788df054-c473-4b26-9acc-2ccc49760b77", "name": "TWIN LAKES ACADEMY MIDDLE SCHOOL", "logoUrl": "https://production-gofan-assets.s3.amazonaws.com/uploads/school/logo/FL25645/Twin%20Lakes%20Middle%20School%20Logo.png" },
      "inPool": true
    }
  ]
}
```

`inPool` is `true` here only because the same fan had just been accepted for another game; a
rejection by itself never changes pool membership.

---

## 5. History — `GET /?status=ACCEPTED`

Same shape as the queue. Real response (200):

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Scorekeeper requests fetched successfully",
  "errorCode": null,
  "data": [
    {
      "items": [
        {
          "id": "be08a490-add7-491e-ace5-c1ea789546a0",
          "status": "ACCEPTED",
          "message": "I will be at the game and can keep score",
          "reviewNote": "Thanks, see you at the gym",
          "reviewedAt": "2026-09-29T14:09:27.146Z",
          "createdAt": "2026-09-29T14:09:15.957Z",
          "fan": { "id": "0e81671f-2b8b-4f8b-99ec-86f475949d61", "name": "Kashuf", "email": "kashufjovera@gmail.com" },
          "game": { "id": "51113940-0095-4a56-84a5-ddf483cf5534", "title": "Twin Lakes Academy Middle vs Alfred I. Dupont Middle", "opponent": "Alfred I. Dupont Middle School", "sport": "Football", "gender": "Boys", "level": null, "start": "2026-09-29T17:30:00.000Z", "end": null, "utcTime": "2026-09-29T21:30:00.000Z", "status": "confirmed", "isOfficialScorekeeper": true },
          "school": { "id": "788df054-c473-4b26-9acc-2ccc49760b77", "name": "TWIN LAKES ACADEMY MIDDLE SCHOOL", "logoUrl": "https://production-gofan-assets.s3.amazonaws.com/uploads/school/logo/FL25645/Twin%20Lakes%20Middle%20School%20Logo.png" },
          "inPool": true
        }
      ],
      "pendingCount": 0,
      "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1, "isLast": true }
    }
  ]
}
```

---

## 6. Errors

| Status | `message` | Cause |
| --- | --- | --- |
| 400 | `Invalid id` / `Note is too long` | Bad request id or note over 500 characters |
| 401 | | Missing or expired organisation token |
| 404 | `Scorekeeper request not found` | Unknown id, or a request belonging to another school |
| 404 | `Fan not found` | The requesting fan deleted their account before review |
| 409 | `This request has already been reviewed` | Accept or reject on a non-pending request |

---

## 7. Relationship to the existing screens

- **Scorekeeper pool** page: after an accept, the fan appears there as ACTIVE (if they were not
  already). Revoking them from the pool later does not unassign games; use the per-game assignment
  page for that, as today.
- **Per-game assignment** page: an accepted request is visible there as the game's official
  scorekeeper. Reassigning the game to someone else from that page does not change the request's
  status; the request's `game.isOfficialScorekeeper` simply becomes `false`.
- Nothing about those two pages or their endpoints changed.

Backend: table `FanHubScorekeeperGameRequest` (migration
`20260929100000_add_fanhub_scorekeeper_game_request`), services
`fanhubOrgScorekeeperGameRequest.service.ts` and `fanhubFanScorekeeperGameRequest.service.ts`.
The fan side is documented in `FANHUB_SCOREKEEPER_GAME_REQUEST_FLUTTER.md`.
