"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { backendFetch, forceSignOut } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { setFanhubSchoolId, SCHOOL_ID_KEY } from "@/utils/auth/session";
import type { AccountRole, AuthOrganization, OrganizationProfile, SponsorProfile } from "@/utils/types/auth";

// The sponsor panel's routes (app/(sponsor)).
const SPONSOR_PANEL = "/sponsor";

// Which kind of organisation is signed in, from /me's organizationType: "tournament" for a
// tournament, "school" for every other type; null until the full profile has loaded.
export type OrgKind = "tournament" | "school";

export const orgKindOf = (org: AuthOrganization | OrganizationProfile | null): OrgKind | null => {
  const type = org && "organizationType" in org ? org.organizationType : null;
  if (!type) return null;
  return type.trim().toLowerCase() === "tournament" ? "tournament" : "school";
};

interface AuthContextValue {
  // The full profile once /me has answered; just id/name/email/phone right after sign-in.
  org: AuthOrganization | OrganizationProfile | null;
  // A sponsor's profile from /me (sponsor panel); null for an organiser.
  sponsor: SponsorProfile | null;
  isLoading: boolean;
  setAuth: (org: AuthOrganization) => void;
  clearAuth: () => void;
  // Reloads /me, e.g. after the organisation type changes in Profile, so the whole panel (school or
  // tournament menus and pages) follows without a page refresh.
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<AuthOrganization | OrganizationProfile | null>(null);
  const [sponsor, setSponsor] = useState<SponsorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // The signed-in account from GET /fanhub/org-auth/me, which answers organisers and sponsors and says
  // which with data[0].role. Each belongs on its own panel: one on the other's is signed out.
  // backendFetch attaches the access token and, on a 401, refreshes it once and retries.
  const loadProfile = useCallback(
    (signedOutPage = false) =>
      (signedOutPage ? Promise.resolve(null) : backendFetch(routes.api.authMe, { cache: "no-store" })).then(async (res) => {
        if (!res) return;
        // Still 401 after the refresh: the session is over, back to sign-in.
        // 403: a fan or main-app token; 404: the organisation or sponsor account is gone.
        if (res.status === 401 || res.status === 403 || res.status === 404) return forceSignOut();
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        const me = json?.data?.[0] as
          | { role?: AccountRole; organization?: OrganizationProfile; sponsor?: SponsorProfile }
          | undefined;
        const onSponsorPanel = window.location.pathname.startsWith(SPONSOR_PANEL);
        if (me?.role === "SPONSOR") {
          if (!onSponsorPanel || !me.sponsor) return forceSignOut();
          setSponsor(me.sponsor);
          return;
        }
        const organization = me?.organization;
        if (!organization?.id) return;
        // An organiser (no role: a backend older than the field) only uses the organisation panel.
        if (onSponsorPanel) return forceSignOut();
        setOrg(organization);
        // organization.id is the school id every org endpoint is scoped to.
        if (!sessionStorage.getItem(SCHOOL_ID_KEY)) {
          setFanhubSchoolId(organization.id);
        }
      }),
    []
  );

  // Restore the session on load (hard refresh, new tab).
  useEffect(() => {
    // Signed-out pages have no session to restore.
    const { pathname } = window.location;
    const signedOutPage = [routes.ui.signIn, routes.ui.signUp, routes.ui.sponsorSignUp].some((p) =>
      pathname.startsWith(p)
    );
    loadProfile(signedOutPage)
      // A network failure is not a dead session; keep the user where they are.
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, [loadProfile]);

  // Right after sign-in / sign-up only id, name, email and phone are known; load the full profile
  // too so organizationType (school vs tournament) is there without a refresh.
  const setAuth = useCallback(
    (organization: AuthOrganization) => {
      setOrg(organization);
      loadProfile().catch(() => null);
    },
    [loadProfile]
  );

  const refreshProfile = useCallback(async () => {
    await loadProfile().catch(() => null);
  }, [loadProfile]);

  const clearAuth = useCallback(() => {
    setOrg(null);
    setSponsor(null);
  }, []);

  return (
    <AuthContext.Provider value={{ org, sponsor, isLoading, setAuth, clearAuth, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
