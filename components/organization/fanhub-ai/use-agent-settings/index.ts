"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getSettings, saveSettings } from "@/components/organization/fanhub-ai/agent-api";
import type { AgentSettings, AgentSettingsUpdate } from "@/utils/types/organiser-agent";

// The organisation's own switch for its agent: on / off and the areas it may work in.
export function useAgentSettings() {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSettings().then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.data) setSettings(res.data);
      else setError(res.message ?? "Couldn’t load the agent settings.");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Takes effect on the agent's next message. Returns whether it saved.
  const save = useCallback(async (update: AgentSettingsUpdate) => {
    const res = await saveSettings(update);
    if (!res.data) {
      toast.error(res.message ?? "Couldn’t save the agent settings.");
      return false;
    }
    setSettings(res.data);
    setError(null);
    toast.success("Agent settings saved");
    return true;
  }, []);

  return { settings, loading, error, save };
}
