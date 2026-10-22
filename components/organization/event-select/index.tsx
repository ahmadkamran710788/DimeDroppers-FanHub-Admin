"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import FilterDropdown from "@/components/common/filter-dropdown";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ExposureEvent, ExposureEventsResponse } from "@/utils/types/exposure-event";

// Events per page; the API allows up to 100.
const PAGE_SIZE = 50;

interface EventSelectProps {
  // The picked event's id; "" for all events.
  value: string;
  // The picked event's id ("" for all) and its name.
  onChange: (eventId: string, name: string) => void;
  // false: no "All Events" option, and the newest event is picked as soon as the list arrives
  // (Schedule). Defaults to true (Command Center).
  allowAll?: boolean;
  // Pick the newest event as soon as the list arrives, even with "All Events" offered (it stays
  // available to go back to). Always on when `allowAll` is false.
  selectFirst?: boolean;
  // The picked event's name, shown on the trigger even when its row isn't in the loaded pages.
  selectedName?: string;
}

// Picks one of a tournament's synced events (Command Center, Schedule), or "All Events". GET /fanhub/org/exposure/events
// is paged (newest first), so the list loads the next page as it is scrolled to the end.
export default function EventSelect({ value, onChange, allowAll = true, selectFirst = false, selectedName }: EventSelectProps) {
  // Read in the fetch callback, which only reruns per page.
  const latest = useRef({ value, onChange, autoPick: !allowAll || selectFirst });
  useEffect(() => {
    latest.current = { value, onChange, autoPick: !allowAll || selectFirst };
  });

  const [events, setEvents] = useState<ExposureEvent[]>([]);
  // The next page to ask for; null once the last page has arrived.
  const [nextPage, setNextPage] = useState<number | null>(1);
  const [requested, setRequested] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiCall<ExposureEventsResponse>({
      endpoint: routes.api.listExposureEvents,
      method: "GET",
      data: { page: requested, limit: PAGE_SIZE },
    }).then((result) => {
      if (cancelled) return;
      const body = result.success ? result.data?.data?.[0] : undefined;
      if (body) {
        setEvents((prev) => (requested === 1 ? body.items : [...prev, ...body.items]));
        setNextPage(body.pagination.isLast ? null : requested + 1);
        // Start on the newest event when asked to (always without "All Events").
        const { value: current, onChange: pick, autoPick } = latest.current;
        const first = body.items[0];
        if (requested === 1 && autoPick && !current && first) pick(first.id, first.name);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [requested]);

  const loadMore = useCallback(() => {
    if (loading || nextPage === null) return;
    setLoading(true);
    setRequested(nextPage);
  }, [loading, nextPage]);

  return (
    <FilterDropdown
      label={allowAll ? "All Events" : selectedName || "Select event"}
      icon={<CalendarDays className="w-5 h-5" strokeWidth={1.5} />}
      // "All Events" first (when allowed), to go back to the whole tournament.
      options={[...(allowAll ? [{ label: "All Events", value: "" }] : []), ...events.map((e) => ({ label: e.name, value: e.id }))]}
      // Without "All Events", clicking the picked event again mustn't clear it.
      clearable={allowAll}
      value={value}
      onChange={(id) => onChange(id, events.find((e) => e.id === id)?.name ?? "")}
      align="right"
      // Stays set after the last page so the list keeps scrolling; loadMore then does nothing.
      onLoadMore={loadMore}
      loadingMore={loading}
    />
  );
}
