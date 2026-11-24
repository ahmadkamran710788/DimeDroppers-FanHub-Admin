# Sponsor search: count a tournament's open events (request, 24 Nov 2026)

On the sponsor's Sponsorships page, a tournament card shows how many events it has. The list under the card shows only the events a sponsor can actually pick. The two numbers count different things, so they often disagree. For example, "North Florida Hoop Group" says **9 events**, but its list says **none can be sponsored yet**. The panel (DimeDroppers-FanHub-Admin) now labels the card's number as **open events**, and it needs the backend to send that count for every card.

Checked against backend `main` at `375d12e1` ("Merge pull request #596 …"). Paths are relative to `backend/`.

## Today

- **Card count:** `GET /fanhub/sponsor-packages/organizations` answers `eventCount` per item. `offerSummary` in `src/services/fanhubSponsorPackage/fanhubSponsorPackageSearch.service.ts` (line 788) sets it at line 827 as `events.length`. Here `events` means every inventory row that matches `sellableEventInventory` (`src/services/fanhubSponsorPackage/fanhubSponsorLocation.ts`, line 122: an event with a tournament format) and the search's event scope (stores, radius or state, genders).
- **List under the card:** `GET /fanhub/sponsor-packages/organizations/:id/events` (`listEvents` in `src/services/fanhubSponsorPackage/fanhubSponsorPackageOffer.service.ts`, line 258) answers each event with `isOffered: reason === null` (line 307). `reason` comes from `eventUnavailable` (line 215):
  - `TOURNAMENT_INCOMPLETE` when the tournament format isn't set.
  - `EVENT_ENDED` when the event has ended.
  - `NO_GAMES` when there are no games, for example no teams yet.
  - The panel lists only the `isOffered` events.
- **The gap:** an event with a format counts on the card even if it has ended or has no games. The list leaves those events out.

## What the panel does now

- A tournament card reads `offeredEventCount` and shows "N open events".
- Until the field arrives, the **selected** card counts the events loaded in its list. Every other card falls back to `eventCount` and shows "N events" (all events), so the mismatch is still there on those cards.
- The panel treats `offeredEventCount` as optional, so nothing breaks before or after this change ships.

## Requested backend change

1. **New field:** add `offeredEventCount: number` to each item of `GET /fanhub/sponsor-packages/organizations`, next to `eventCount` (`SponsorPackageOrganizationListItem` in `src/types/fanhubSponsorPackage.types.ts`, and `card` in the search service).
2. **Same scope as `eventCount`:** count within the same `events` that `offerSummary` already loads, so the search's stores, radius or state, and genders apply.
3. **Same rule as `isOffered`:** an event is open when `eventUnavailable(format, games, event)` returns `null`. Then the card always matches what `GET …/organizations/:id/events` lists for the same filters.
4. **Organizations that aren't tournaments:** `0`, like `eventCount`.
5. **Keep `eventCount` unchanged**, so anything else that reads it keeps working.

### Implementation note

`offerSummary` already prices each event in scope through `getOffers` → `compute` (the loop at line 810). For an event, `priceBasis` sets `unavailable: eventUnavailable(format, games, event)` (line 635), and `compute` uses it as `basis.unavailable` (line 355). One way to get the count with no extra queries:

1. Return that event-level reason from `compute`/`getOffers`, for example as `eventUnavailableReason`.
2. In the loop, count the events where it is `null`.

Package-level reasons such as `NO_SLOTS` or `TAKEN` shouldn't make an event closed, because the list doesn't hide events for them.
