"use client";

import { useCallback, useEffect, useState } from "react";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { EventDocument, EventDocumentList } from "@/utils/types/event-document";

const PAGE_SIZE = 12;

interface Loaded {
  eventId: string;
  items: EventDocument[];
  page: number;
  totalPages: number;
  total: number;
  error?: string;
}

const fetchPage = async (eventId: string, page: number): Promise<EventDocumentList | string> => {
  try {
    const res = await backendFetch(`${routes.api.eventDocuments(eventId)}?page=${page}&limit=${PAGE_SIZE}`, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok) return json?.message || "Couldn't load the notes.";
    return (json?.data?.[0] as EventDocumentList | undefined) ?? { items: [], pagination: { page, limit: PAGE_SIZE, total: 0, totalPages: 0 } };
  } catch {
    return "Please check your network and try again.";
  }
};

// An event's notes, newest first, a page at a time ("Load more"). Adds, edits and deletes update the
// list in place.
export function useEventNotes(eventId: string) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    fetchPage(eventId, 1).then((result) => {
      if (cancelled) return;
      setLoaded(
        typeof result === "string"
          ? { eventId, items: [], page: 0, totalPages: 0, total: 0, error: result }
          : { eventId, items: result.items, page: 1, totalPages: result.pagination.totalPages, total: result.pagination.total }
      );
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const current = loaded?.eventId === eventId ? loaded : null;

  const loadMore = useCallback(async () => {
    if (!current || loadingMore) return;
    setLoadingMore(true);
    const result = await fetchPage(eventId, current.page + 1);
    setLoadingMore(false);
    if (typeof result === "string") return;
    setLoaded((prev) => {
      if (!prev || prev.eventId !== eventId) return prev;
      // A note added since the first page shifts the pages by one: skip rows already listed.
      const seen = new Set(prev.items.map((n) => n.id));
      return {
        ...prev,
        items: [...prev.items, ...result.items.filter((n) => !seen.has(n.id))],
        page: prev.page + 1,
        totalPages: result.pagination.totalPages,
        total: result.pagination.total,
      };
    });
  }, [current, eventId, loadingMore]);

  const edit = useCallback(
    (change: (prev: Loaded) => Loaded) => setLoaded((prev) => (prev?.eventId === eventId ? change(prev) : prev)),
    [eventId]
  );

  const added = useCallback(
    (note: EventDocument) => edit((prev) => ({ ...prev, items: [note, ...prev.items], total: prev.total + 1 })),
    [edit]
  );

  const updated = useCallback(
    (note: EventDocument) => edit((prev) => ({ ...prev, items: prev.items.map((n) => (n.id === note.id ? note : n)) })),
    [edit]
  );

  const removed = useCallback(
    (id: string) => edit((prev) => ({ ...prev, items: prev.items.filter((n) => n.id !== id), total: Math.max(0, prev.total - 1) })),
    [edit]
  );

  return {
    notes: current?.items ?? [],
    total: current?.total ?? 0,
    error: current?.error,
    loading: !!eventId && !current,
    hasMore: !!current && current.page < current.totalPages,
    loadingMore,
    loadMore,
    added,
    updated,
    removed,
  };
}
