// Client-side FanHub session keys. The org and the Step-1 school are the same
// entity: organization.id (also the JWT `schoolId` claim) is stored as
// SCHOOL_ID_KEY so the setup wizard updates the auto-created school instead of
// creating a duplicate.
export const SCHOOL_ID_KEY = "fanhub:schoolId";
export const TEAM_NAME_KEY = "fanhub:teamName";

// Called after signup/signin so Step 1 always PUTs the existing school.
export function setFanhubSchoolId(id: string) {
  sessionStorage.setItem(SCHOOL_ID_KEY, id);
}

// Clears the wizard's client-side session. Call from a logout trigger so the
// next account starts clean. (The httpOnly cookies are cleared server-side by
// the /api/auth/signout route.)
export function clearFanhubSession() {
  sessionStorage.removeItem(SCHOOL_ID_KEY);
  sessionStorage.removeItem(TEAM_NAME_KEY);
}
