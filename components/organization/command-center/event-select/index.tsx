"use client";

import { useCallback, useEffect, useState } from "react";
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
  onChange: (eventId: string) => void;
}

// Tournament Command Center: picks one of the tournament's synced events. GET /fanhub/org/exposure/events
// is paged (newest first), so the list loads the next page as it is scrolled to the end.
export default function EventSelect({ value, onChange }: EventSelectProps) {
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
      label="All Events"
      icon={<CalendarDays className="w-5 h-5" strokeWidth={1.5} />}
      // "All Events" first, to go back to the whole tournament.
      options={[{ label: "All Events", value: "" }, ...events.map((e) => ({ label: e.name, value: e.id }))]}
      value={value}
      onChange={onChange}
      align="right"
      // Stays set after the last page so the list keeps scrolling; loadMore then does nothing.
      onLoadMore={loadMore}
      loadingMore={loading}
    />
  );
}
