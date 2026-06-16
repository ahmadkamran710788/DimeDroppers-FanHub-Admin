"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
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

  // Hydrate from the /api/auth/me route on first mount so a hard-refresh
  // keeps the user logged in without an extra sign-in.
  useEffect(() => {
    fetch(routes.api.proxyAuthMe)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const organization = json?.data as AuthOrganization | undefined;
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
