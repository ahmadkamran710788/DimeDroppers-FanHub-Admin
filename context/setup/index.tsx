"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getSavedSchool } from "@/utils/fanhub/getSavedSchool";
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

  // Fetch once when the setup shell mounts — all wizard steps share this result.
  useEffect(() => {
    fetchSchool();
  }, [fetchSchool]);

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
