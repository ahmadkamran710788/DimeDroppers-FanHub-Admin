"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { backendUrl } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { setFanhubSchoolId, SCHOOL_ID_KEY } from "@/utils/auth/session";
import type { AuthOrganization } from "@/utils/types/auth";

interface AuthContextValue {
  org: AuthOrganization | null;
  isLoading: boolean;
  setAuth: (org: AuthOrganization) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<AuthOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from the backend `me` endpoint on first mount so a hard-refresh
  // keeps the user logged in without an extra sign-in.
  useEffect(() => {
    // Straight to the backend with the auth cookies. A failure is deliberately NOT
    // treated as "session over": `fanhub/org-auth/me` has returned 404 upstream, so
    // `org` may stay null. Session expiry is handled by `proxy` (session marker gate)
    // and by `apiCall`, which renews the access token on a 401.
    fetch(backendUrl(routes.api.authMe), { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const organization = json?.data?.[0] as AuthOrganization | undefined;
        if (organization?.id) {
          setOrg(organization);
          if (!sessionStorage.getItem(SCHOOL_ID_KEY)) {
            setFanhubSchoolId(String(organization.id));
          }
        }
      })
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, []);

  const setAuth = useCallback((organization: AuthOrganization) => {
    setOrg(organization);
  }, []);

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
