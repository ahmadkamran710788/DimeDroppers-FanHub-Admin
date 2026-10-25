"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import FilterDropdown from "@/components/common/filter-dropdown";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ActivationEventsPage } from "@/utils/types/activations";
import type { ExposureEventsResponse } from "@/utils/types/exposure-event";

// The API allows up to 100; organisers can have ~500 events, so the list pages as it's scrolled.
const PAGE_SIZE = 50;

interface PickerEvent {
  id: string;
  name: string;
  startDate: string | null;
  // The event's inventory has a format; undefined when the list can't tell (the fallback source).
  isSetUp?: boolean;
}

interface EventsPage {
  events: PickerEvent[];
  isLast: boolean;
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;

// "Fall Classic · Nov 7, 2026 · Set up": the date tells same-named events apart; the status says
// whether the event's inventory has a format yet.
const optionLabel = (e: PickerEvent) =>
  [e.name, fmtDate(e.startDate), e.isSetUp === undefined ? null : e.isSetUp ? "Set up" : "Needs format"]
    .filter(Boolean)
    .join(" · ");

// Set once GET /activations/events has failed, so the picker (remounted as the page loads each event)
// goes straight to the fallback for the rest of the visit.
let activationEventsUnavailable = false;

// The request in flight per page, shared by pickers mounted meanwhile (Strict Mode, the page's loader).
const inFlight = new Map<number, Promise<EventsPage | null>>();

// GET /activations/events: each event with its inventory status.
function activationEvents(page: number): Promise<EventsPage | null> {
  if (activationEventsUnavailable) return Promise.resolve(null);
  let request = inFlight.get(page);
  if (!request) {
    request = fetchActivationEvents(page).finally(() => inFlight.delete(page));
    inFlight.set(page, request);
  }
  return request;
}

async function fetchActivationEvents(page: number): Promise<EventsPage | null> {
  const result = await apiCall<{ data: ActivationEventsPage[] }>({
    endpoint: routes.api.activationEvents,
    method: "GET",
    data: { page, limit: PAGE_SIZE },
  });
  const body = result.success ? result.data?.data?.[0] : undefined;
  if (!body) {
    activationEventsUnavailable = true;
    return null;
  }
  return {
    events: body.items.map((e) => ({ id: e.id, name: e.name ?? "Untitled event", startDate: e.startDate, isSetUp: !!e.inventory?.isSetUp })),
    isLast: page >= body.pagination.totalPages,
  };
}

const fallbackInFlight = new Map<number, Promise<EventsPage | null>>();

// GET /exposure/events: the same events (same ids) without the status, while the endpoint above isn't
// deployed everywhere yet. Shared while in flight, like the call above.
function exposureEvents(page: number): Promise<EventsPage | null> {
  let request = fallbackInFlight.get(page);
  if (!request) {
    request = fetchExposureEvents(page).finally(() => fallbackInFlight.delete(page));
    fallbackInFlight.set(page, request);
  }
  return request;
}

async function fetchExposureEvents(page: number): Promise<EventsPage | null> {
  const result = await apiCall<ExposureEventsResponse>({
    endpoint: routes.api.listExposureEvents,
    method: "GET",
    data: { page, limit: PAGE_SIZE },
  });
  const body = result.success ? result.data?.data?.[0] : undefined;
  if (!body) return null;
  return { events: body.items.map((e) => ({ id: e.id, name: e.name, startDate: e.startDate })), isLast: body.pagination.isLast };
}

interface InventoryEventPickerProps {
  // The picked event's id ("" until one is) and its name for the trigger.
  value: string;
  selectedName?: string;
  onChange: (id: string, name: string) => void;
  // Bumped after a save, so the picked event's "Set up" status refreshes.
  refreshKey: number;
}

// A tournament's Inventory event picker, newest first, from GET /activations/events (falling back to
// /exposure/events). Picks the newest event when none is picked yet.
export default function InventoryEventPicker({ value, selectedName, onChange, refreshKey }: InventoryEventPickerProps) {
  const [events, setEvents] = useState<PickerEvent[]>([]);
  // The page asked for, with the save it follows (a save refreshes from page 1).
  const [requested, setRequested] = useState({ page: 1, refreshKey });
  // The next page to ask for; null until a page has arrived, and after the last one or a failure.
  const [nextPage, setNextPage] = useState<number | null>(null);
  // Which source answered page 1; later pages come from the same one.
  const [fallback, setFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  if (requested.refreshKey !== refreshKey) setRequested({ page: 1, refreshKey });

  useEffect(() => {
    let cancelled = false;
    const { page } = requested;
    (async () => {
      let useFallback = page === 1 ? false : fallback;
      let result = useFallback ? await exposureEvents(page) : await activationEvents(page);
      if (!result && page === 1) {
        useFallback = true;
        result = await exposureEvents(page);
      }
      if (cancelled) return;
      setFallback(useFallback);
      setFailed(!result && page === 1);
      if (result) setEvents((prev) => (page === 1 ? result.events : [...prev, ...result.events]));
      // No more pages after the last one, or after a failure (so a failing list isn't asked again).
      setNextPage(result && !result.isLast ? page + 1 : null);
    })();
    return () => {
      cancelled = true;
    };
    // `fallback` is read for later pages only; page 1 decides it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested]);

  const first = events[0];
  useEffect(() => {
    if (!value && first) onChange(first.id, first.name);
  }, [value, first, onChange]);

  const loadMore = useCallback(() => {
    if (nextPage === null) return;
    setNextPage(null);
    setRequested((r) => ({ ...r, page: nextPage }));
  }, [nextPage]);

  return (
    <FilterDropdown
      label={selectedName || (failed ? "Couldn't load events" : "Select event")}
      icon={<CalendarDays className="w-5 h-5" strokeWidth={1.5} />}
      options={events.map((e) => ({ label: optionLabel(e), value: e.id }))}
      value={value}
      onChange={(id) => id && onChange(id, events.find((e) => e.id === id)?.name ?? "Untitled event")}
      // Picking the open event again mustn't clear it.
      clearable={false}
      align="left"
      onLoadMore={loadMore}
    />
  );
}
