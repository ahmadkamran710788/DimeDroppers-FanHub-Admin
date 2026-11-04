"use client";

import { useCallback, useEffect, useState } from "react";
import { bodyOf } from "@/components/organization/recognition/recognition-api";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { Paged, Recognition, RecognitionStatus } from "@/utils/types/recognition";

// The API caps a page at 100; the posts page loads one full page.
const LIMIT = 100;

// The organisation's recognitions (GET /fanhub/org/recognitions), newest first, optionally by status and
// (a tournament) by event, with publish / unpublish (a full PATCH) and delete. apiCall toasts failures.
export function useRecognitions(status: RecognitionStatus | "", eventId?: string) {
  const [loaded, setLoaded] = useState<{ key: string; items: Recognition[] | null } | null>(null);
  const [version, setVersion] = useState(0);
  const key = `${status}|${eventId ?? ""}|${version}`;

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: Paged<Recognition>[] }>({
      endpoint: routes.api.recognitions,
      method: "GET",
      data: { page: 1, limit: LIMIT, ...(status && { status }), ...(eventId && { eventId }) },
    }).then((result) => {
      if (!cancelled) setLoaded({ key, items: result.success ? (result.data?.data?.[0]?.items ?? []) : null });
    });
    return () => {
      cancelled = true;
    };
  }, [key, status, eventId]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const current = loaded?.key === key ? loaded : null;

  const setRecognitionStatus = async (r: Recognition, next: RecognitionStatus) => {
    const result = await apiCall({
      endpoint: routes.api.recognition(r.id),
      method: "PATCH",
      data: { ...bodyOf(r, next) },
      showSuccessToast: true,
      successMessage: next === "PUBLISHED" ? "Recognition published" : "Recognition unpublished",
    });
    if (result.success) reload();
  };

  const remove = async (r: Recognition) => {
    const result = await apiCall({
      endpoint: routes.api.recognition(r.id),
      method: "DELETE",
      showSuccessToast: true,
      successMessage: "Recognition deleted",
    });
    if (result.success) reload();
    return result.success;
  };

  return {
    recognitions: current?.items ?? [],
    loading: !current,
    failed: !!current && current.items === null,
    reload,
    setStatus: setRecognitionStatus,
    remove,
  };
}
