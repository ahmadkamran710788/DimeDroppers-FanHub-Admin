"use client";

import { useCallback, useEffect, useState } from "react";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { scopeKey, type AgentScope } from "@/components/organization/sponsor-ai-agent/data";
import { routes } from "@/utils/routes";
import type { SponsorAiCategoryOptions, SponsorAiReadiness } from "@/utils/types/sponsor-ai";

interface Loaded {
  key: string;
  readiness: SponsorAiReadiness | null;
  options: SponsorAiCategoryOptions | null;
  // Why one of them couldn't be loaded.
  error?: string;
}

// Step 1's data: what's missing before a search can start (GET /readiness) and the categories scored
// for the organisation or event, with the radius options (GET /categories). A tournament without an
// event gets its readiness only (EVENT_REQUIRED). `reload` asks again, e.g. after a start answered 422.
export function useSponsorAiSetup(scope: AgentScope | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [version, setVersion] = useState(0);
  const eventId = scope?.eventId;
  const withCategories = scopeKey(scope) !== "";
  const key = scope ? `${eventId ?? ""}:${withCategories}:${version}` : "";

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const params = { eventId };
    Promise.all([
      sponsorRequest<SponsorAiReadiness>("GET", routes.api.sponsorAiReadiness, { params }),
      withCategories ? sponsorRequest<SponsorAiCategoryOptions>("GET", routes.api.sponsorAiCategories, { params }) : null,
    ]).then(([readiness, categories]) => {
      if (cancelled) return;
      const failed = !readiness.view ? readiness : categories && !categories.view ? categories : null;
      setLoaded({ key, readiness: readiness.view ?? null, options: categories?.view ?? null, error: failed?.message });
    });
    return () => {
      cancelled = true;
    };
  }, [key, eventId, withCategories]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  // A late answer for the previous event is never shown for this one.
  const current = loaded?.key === key ? loaded : null;
  return {
    readiness: current?.readiness ?? null,
    options: current?.options ?? null,
    error: current?.error,
    loading: !!key && !current,
    reload,
  };
}
