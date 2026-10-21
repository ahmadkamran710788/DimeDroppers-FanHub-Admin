"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/auth";
import { setFanhubSchoolId, SCHOOL_ID_KEY } from "@/utils/auth/session";
import { getSavedSchool } from "@/utils/fanhub/get-saved-school";
import type { SavedSchool } from "@/utils/types/school";

interface SetupContextValue {
  savedSchool: SavedSchool | null;
  isLoading: boolean;
  // Call after Step 1 saves/updates the school so subsequent steps see fresh data.
  refreshSchool: () => Promise<void>;
}

const SetupContext = createContext<SetupContextValue | null>(null);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [savedSchool, setSavedSchool] = useState<SavedSchool | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchool = useCallback(async () => {
    setIsLoading(true);
    const school = await getSavedSchool();
    setSavedSchool(school);
    setIsLoading(false);
  }, []);

  // The school id lives in sessionStorage, which a new tab starts without; the auth session
  // (/me) knows it, so wait for it and seed the id before reading the school.
  const { org, isLoading: authLoading } = useAuth();
  const orgId = org?.id;

  // Fetch once when the shell mounts (after auth) — all pages share this result.
  // isLoading already starts true, so only set state once the request resolves.
  useEffect(() => {
    if (authLoading) return;
    if (orgId && !sessionStorage.getItem(SCHOOL_ID_KEY)) setFanhubSchoolId(orgId);
    let cancelled = false;
    getSavedSchool().then((school) => {
      if (cancelled) return;
      setSavedSchool(school);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, orgId]);

  return (
    <SetupContext.Provider
      value={{ savedSchool, isLoading, refreshSchool: fetchSchool }}
    >
      {children}
    </SetupContext.Provider>
  );
}

const SETUP_FALLBACK: SetupContextValue = {
  savedSchool: null,
  isLoading: false,
  refreshSchool: async () => {},
};

export function useSetup(): SetupContextValue {
  return useContext(SetupContext) ?? SETUP_FALLBACK;
}
