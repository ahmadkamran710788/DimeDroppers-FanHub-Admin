import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { SavedSchool } from "@/utils/types/school";

export interface SavedSchoolResult {
  school: SavedSchool | null;
  // Why the school couldn't be read (the backend's message when it sent one); null when there was no
  // error, including when there is no school yet.
  error: string | null;
}

/**
 * Fetch the saved school with the reason it failed, for screens that show the error (the Profile page).
 * Reads the `fanhub:schoolId` set in Step 1, GETs the school from the backend, and unwraps
 * `data[0].school`. Uses backendFetch (not apiCall) so a failure stays silent (no error toast).
 * No school id (Step 1 not completed) is not an error.
 * Must run in the browser (reads sessionStorage) — call from a useEffect, not render.
 */
export async function loadSavedSchool(): Promise<SavedSchoolResult> {
  const schoolId = sessionStorage.getItem("fanhub:schoolId");
  if (!schoolId) return { school: null, error: null };

  try {
    const res = await backendFetch(routes.api.getSchool(schoolId));
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const message = typeof json?.message === "string" && json.message.trim() ? json.message.trim() : null;
      return { school: null, error: message ?? `Your organization profile couldn't be loaded (error ${res.status}).` };
    }
    const school = (json?.data?.[0]?.school ?? null) as SavedSchool | null;
    return { school, error: school ? null : "Your organization profile wasn't found." };
  } catch {
    return { school: null, error: "Couldn't reach the server. Check your connection and try again." };
  }
}

/**
 * The saved school for the current Setup Wizard session, so a step can rehydrate its form when the
 * user navigates Back/Next. Returns null when there is no school yet or the request fails — callers
 * should treat null as "nothing to prefill" and leave their initial state.
 */
export async function getSavedSchool(): Promise<SavedSchool | null> {
  return (await loadSavedSchool()).school;
}
