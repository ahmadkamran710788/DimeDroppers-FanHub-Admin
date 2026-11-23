# Sponsor categories: a list instead of one category (request, 23 Nov 2026)

Sponsors can now pick **several categories** on sign-up and on their profile, and add categories of their own under "Other". The panel (DimeDroppers-FanHub-Admin) is built for this. The backend still stores **one** category, so only the first one is kept for now.

Checked against backend `main` at `375d12e1` ("Merge pull request #596 …"). Paths are relative to `backend/`.

## Today

- `FanHubSponsorProfile.category` (`prisma/schema.prisma`, model at line 22294) holds one free-text string.
- In `src/validations/fanhubSponsorAccount.schema.ts`, `category` is `requiredText(L.categoryMax, 'Category')`: required on `sponsorSignupSchema`, optional on `sponsorProfileUpdateSchema`, 1–120 characters.
- `presentBrand` in `src/services/fanhubSponsorAccount/fanhubSponsorAccount.service.ts` answers `brand.category`.
- Both schemas are plain (non-strict) `z.object`, so an extra `categories` key is dropped without an error.

## What the panel sends now

The panel sends both fields: the new list, and its first item in the old `category` field. That way sign-up and profile saves keep working today.

| Request | `categories` | `category` |
| ------- | ------------ | ---------- |
| `POST /fanhub/sponsor-auth/signup` (multipart) | JSON-array text, e.g. `["Gaming & Esports","Pizza restaurant"]` | the first item |
| `PATCH /fanhub/sponsor-profile` (JSON) | an array of strings | the first item |
| `PATCH /fanhub/sponsor-profile` (multipart, when a new logo is uploaded) | JSON-array text | the first item |

- The profile PATCH sends both fields only when the list changed.
- Items are listed codes from `GET /fanhub/sponsor-auth/options` `categories[]`, or text the sponsor typed (up to 60 characters in the panel).
- Items are trimmed, and the panel never sends the same text twice (case-insensitive).
- The panel sets no limit on how many.

## Requested backend change

1. **Storage:** add a `categories String[] @default([])` column to `FanHubSponsorProfile`. In the migration, backfill it from `category` (`ARRAY[category]` where `category` is not null).
2. **Sign-up** (`sponsorSignupSchema`):
   - Accept `categories` as an array, or as JSON-array text when it comes from multipart.
   - Each item: trimmed, 1–120 characters. Duplicates (any case) are dropped. There must be at least one, and there is no maximum.
   - While older clients still send only `category`, use `[category]` when `categories` is missing.
3. **Profile PATCH** (`sponsorProfileUpdateSchema`): the same `categories` field, optional. When present it replaces the whole list, and an empty list is refused.
4. **Keep `category` in sync:** always store `category = categories[0]`, so anything that still reads `category` keeps working.
5. **Responses:** `presentBrand` adds `categories: string[]` next to `category` in every brand view: sign-up result, `GET`/`PATCH /fanhub/sponsor-profile`, and `/me`.
6. **Errors:** use `path: "categories"` for a missing or empty list, or `"categories.<index>"` for one bad item, e.g. `Each category must be 120 characters or fewer`. The panel shows either one under the category field.

## Panel side once this ships

Nothing has to change. The panel already reads `brand.categories` when it's there. Without it, the panel shows `[brand.category]`.

Code: `components/sponsor/data/index.ts` (`savedCategories`, `appendCategories`) and `utils/types/sponsor-profile/index.ts` (`SponsorBrandProfile.categories`).
