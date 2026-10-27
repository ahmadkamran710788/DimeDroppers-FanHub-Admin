import { clearPhotoboothImageCache } from "@/utils/photobooth-image-cache";
import type { SponsorAccount } from "@/utils/types/auth";

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
  try {
    localStorage.removeItem(SPONSOR_ACCOUNT_KEY);
  } catch {
    // Storage blocked: nothing was kept.
  }
  clearPhotoboothImageCache();
}

// The signed-in sponsor's account from sign-in (there is no sponsor /me), for the sponsor header.
// localStorage, so it survives a refresh and new tabs like the session cookies do.
export const SPONSOR_ACCOUNT_KEY = "fanhub:sponsorAccount";

export function setSponsorAccount(account: SponsorAccount) {
  try {
    localStorage.setItem(SPONSOR_ACCOUNT_KEY, JSON.stringify(account));
  } catch {
    // Storage blocked: the header falls back to a generic name.
  }
}

export function getSponsorAccount(): SponsorAccount | null {
  try {
    const raw = localStorage.getItem(SPONSOR_ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as SponsorAccount) : null;
  } catch {
    return null;
  }
}
