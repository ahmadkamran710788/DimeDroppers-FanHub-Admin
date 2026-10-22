"use client";

import { useEffect, useState } from "react";
import apiCall from "@/utils/api-call";

interface Loaded<T> {
  key: string;
  data: T | null;
  error: string | null;
}

// GETs one of the game-detail endpoints (recap / insights / thread) and keeps the answer per request,
// so a stale answer is never shown for another game or filter. Skips the call while `endpoint` is "".
export function useGameDetail<T>(endpoint: string, params?: Record<string, string | number>) {
  const key = endpoint ? `${endpoint}?${JSON.stringify(params ?? {})}` : "";
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    apiCall<{ data: T | T[] }>({ endpoint, method: "GET", data: params }).then((result) => {
      if (cancelled) return;
      const body = result.success ? result.data?.data : undefined;
      setLoaded({
        key,
        data: (Array.isArray(body) ? body[0] : body) ?? null,
        error: result.success ? null : result.message || "Failed to load.",
      });
    });
    return () => {
      cancelled = true;
    };
    // `key` covers the endpoint and params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = loaded?.key === key ? loaded : null;
  return { data: current?.data ?? null, error: current?.error ?? null, loading: !!key && !current };
}
