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
import type { AuthOrganization, OrganizationProfile } from "@/utils/types/auth";

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
  isLoading: boolean;
  setAuth: (org: AuthOrganization) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<AuthOrganization | OrganizationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // The full profile from GET /fanhub/org-auth/me (organizationType, logo, …).
  // backendFetch attaches the access token and, on a 401, refreshes it once and retries.
  const loadProfile = useCallback(
    (signedOutPage = false) =>
      (signedOutPage ? Promise.resolve(null) : backendFetch(routes.api.authMe, { cache: "no-store" })).then(async (res) => {
        if (!res) return;
        // Still 401 after the refresh: the session is over, back to sign-in.
        if (res.status === 401) return forceSignOut();
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        const organization = json?.data?.[0]?.organization as OrganizationProfile | undefined;
        if (!organization?.id) return;
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
    const signedOutPage = [routes.ui.signIn, routes.ui.signUp].some((p) => pathname.startsWith(p));
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

  const clearAuth = useCallback(() => {
    setOrg(null);
  }, []);

  return (
    <AuthContext.Provider value={{ org, isLoading, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
