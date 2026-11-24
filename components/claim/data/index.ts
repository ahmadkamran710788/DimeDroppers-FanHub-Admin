import { routes } from "@/utils/routes";

// One organization row shown in the claim list (mapped from the school-search API item below).
export interface ClaimOrganization {
  id: string;
  name: string;
  // Display location, e.g. "Pleasanton, CA" (derived from the item's city/state, falling back to address).
  location: string;
  logoUrl?: string;
}

// The relevant fields of a `fanhub/schools/list` result item (data[0].items[]). The API returns more;
// only what the claim list needs is typed here.
interface SchoolListItem {
  id: string;
  name?: string;
  address?: string;
  city?: string | null;
  state?: string | null;
  logoUrl?: string | null;
}

interface SchoolListResponse {
  data?: Array<{ items?: SchoolListItem[] }>;
}

// "City, ST" when both are present, otherwise the full address (as the app derives it).
const toLocation = (item: SchoolListItem): string => {
  const cityState = [item.city, item.state].filter(Boolean).join(", ");
  return cityState || item.address || "";
};

// Per-session cache of results by normalized query, so re-typing or backspacing to a query already
// searched is instant (no network round-trip). The school list barely changes within a claim session.
const resultCache = new Map<string, ClaimOrganization[]>();

/**
 * Searches organizations (schools) for the public claim page. Posts to our own same-origin route
 * (`/api/fanhub-claim/schools`), which attaches the secret x-fanhub-key and forwards to the backend —
 * a plain `fetch`, not `apiCall`, so this session-less public page is never signed out on a 401. Only the
 * free-text search is sent (no sport/level/state filters). Throws on failure; the caller shows the error
 * state. Pass an AbortSignal so a superseded keystroke's request can be cancelled.
 */
export async function searchOrganizations(search: string, signal?: AbortSignal): Promise<ClaimOrganization[]> {
  const key = search.trim().toLowerCase();
  const cached = resultCache.get(key);
  if (cached) return cached;

  const res = await fetch(routes.api.proxyFanhubSchoolsList, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ search }),
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw new Error(`School search failed (${res.status}).`);

  const json = (await res.json()) as SchoolListResponse;
  const items = json?.data?.[0]?.items ?? [];
  const organizations = items.map((item) => ({
    id: item.id,
    name: item.name || "Unnamed organization",
    location: toLocation(item),
    logoUrl: item.logoUrl ?? undefined,
  }));

  resultCache.set(key, organizations);
  return organizations;
}
