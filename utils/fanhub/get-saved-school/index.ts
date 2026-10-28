import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { SavedSchool } from "@/utils/types/school";

/**
 * Fetch the saved school for the current Setup Wizard session so a step can rehydrate
 * its form when the user navigates Back/Next. Reads the `fanhub:schoolId` set in Step 1,
 * GETs the school from the backend, and unwraps `data[0].school`. Uses backendFetch (not
 * apiCall) so a missing school stays silent (no error toast).
 *
 * Returns null when there is no school yet (Step 1 not completed) or the request fails —
 * callers should treat null as "nothing to prefill" and leave their initial state.
 * Must run in the browser (reads sessionStorage) — call from a useEffect, not render.
 */
export async function getSavedSchool(): Promise<SavedSchool | null> {
  const schoolId = sessionStorage.getItem("fanhub:schoolId");
  if (!schoolId) return null;

  try {
    const res = await backendFetch(routes.api.getSchool(schoolId));
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return (json?.data?.[0]?.school ?? null) as SavedSchool | null;
  } catch {
    return null;
  }
}
