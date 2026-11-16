"use client";

import { useCallback, useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { CommandCenterOverview } from "@/utils/types/command-center";

// The stat cards and Event Readiness from GET /command-center/overview (`data` holds one element).
// `eventId` (a tournament's FanHubSchoolEvent id, "" for all) scopes it to that event.
// `enabled` false holds the call (a tournament waits for its event), showing the loader meanwhile.
export function useCommandCenterOverview(eventId = "", enabled = true) {
  // The answer and the event it is for, so a switch shows the loader instead of the old event's data.
  const [loaded, setLoaded] = useState<{ eventId: string; overview: CommandCenterOverview | null } | null>(null);
  // Bumped by reload() to ask again (e.g. Try again after a failure).
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    apiCall<{ data: CommandCenterOverview[] }>({
      endpoint: routes.api.commandCenterOverview,
      method: "GET",
      ...(eventId && { data: { eventId } }),
    }).then((result) => {
      if (cancelled) return;
      setLoaded({ eventId, overview: result.success ? (result.data?.data?.[0] ?? null) : null });
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, enabled, version]);

  const loading = !enabled || loaded?.eventId !== eventId;
  const reload = useCallback(() => {
    setLoaded(null);
    setVersion((v) => v + 1);
  }, []);
  return { overview: loading ? null : (loaded?.overview ?? null), loading, reload };
}
