"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import FilterDropdown from "@/components/common/filter-dropdown";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { ExposureEvent, ExposureEventsResponse } from "@/utils/types/exposure-event";

interface EventSelectProps {
  // The picked event's id; "" for all events.
  value: string;
  onChange: (eventId: string) => void;
}

// Tournament Command Center: picks one of the tournament's synced events (GET /fanhub/org/exposure/events).
export default function EventSelect({ value, onChange }: EventSelectProps) {
  const [events, setEvents] = useState<ExposureEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiCall<ExposureEventsResponse>({ endpoint: routes.api.listExposureEvents, method: "GET" }).then((result) => {
      // The API pages the events (newest first); the dropdown lists the first page.
      if (!cancelled && result.success) setEvents(result.data?.data?.[0]?.items ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FilterDropdown
      label="All Events"
      icon={<CalendarDays className="w-5 h-5" strokeWidth={1.5} />}
      options={events.map((e) => ({ label: e.name, value: e.id }))}
      value={value}
      onChange={onChange}
      align="right"
    />
  );
}
