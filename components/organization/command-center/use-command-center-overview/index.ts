"use client";

import { useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { CommandCenterOverview } from "@/utils/types/command-center";

// The stat cards and Event Readiness from GET /command-center/overview (`data` holds one element).
export function useCommandCenterOverview() {
  const [overview, setOverview] = useState<CommandCenterOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: CommandCenterOverview[] }>({ endpoint: routes.api.commandCenterOverview, method: "GET" }).then((result) => {
      if (cancelled) return;
      if (result.success) setOverview(result.data?.data?.[0] ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { overview, loading };
}
