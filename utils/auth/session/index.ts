// Client-side FanHub session keys. The org and the Step-1 school are the same
// entity: organization.id (also the JWT `schoolId` claim) is stored as
// SCHOOL_ID_KEY so the setup wizard updates the auto-created school instead of
// creating a duplicate.
export const SCHOOL_ID_KEY = "fanhub:schoolId";
export const TEAM_NAME_KEY = "fanhub:teamName";

// "Signed in" marker on the admin panel's own domain. The backend keeps the real tokens in
// httpOnly cookies on the API domain, which `proxy` (running on this domain) can't see, so
// it gates on this instead. It holds no secret: the backend still authorizes every call.
export const SESSION_MARKER_COOKIE = "fanhubSession";
const SESSION_MARKER_MAX_AGE = 30 * 24 * 60 * 60;

// Called after a successful sign in.
export function markSignedIn() {
  document.cookie = `${SESSION_MARKER_COOKIE}=1; Path=/; Max-Age=${SESSION_MARKER_MAX_AGE}; SameSite=Lax`;
}

// Called after signup/signin so Step 1 always PUTs the existing school.
export function setFanhubSchoolId(id: string) {
  sessionStorage.setItem(SCHOOL_ID_KEY, id);
}

// Clears the wizard's client-side session. Call from a logout trigger so the
// next account starts clean. (The backend clears its httpOnly token cookies on
// `fanhub/org-auth/signout`.)
export function clearFanhubSession() {
  sessionStorage.removeItem(SCHOOL_ID_KEY);
  sessionStorage.removeItem(TEAM_NAME_KEY);
  document.cookie = `${SESSION_MARKER_COOKIE}=; Path=/; Max-Age=0`;
}
