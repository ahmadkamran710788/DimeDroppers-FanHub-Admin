"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { CALENDAR_CONNECT_WINDOW_MS, CALENDAR_POLL_MS } from "@/components/organization/sponsor-ai-agent/data";
import { routes } from "@/utils/routes";
import type {
  CalendarConnectBody,
  CalendarConnectLink,
  CalendarProvider,
  SponsorAiCalendar,
} from "@/utils/types/sponsor-ai";

const calendarKey = ["sponsor-ai", "calendar"] as const;

// What DELETE /calendar answers.
const NOT_CONNECTED: SponsorAiCalendar = {
  connected: false,
  provider: null,
  email: null,
  status: null,
  bookingUrl: null,
  connectedAt: null,
};

async function fetchCalendar(): Promise<SponsorAiCalendar> {
  const r = await sponsorRequest<SponsorAiCalendar>("GET", routes.api.sponsorAiCalendar);
  // Thrown so a failed check keeps the last answer on screen.
  if (!r.view) throw new Error(r.message ?? "Couldn't load your calendar");
  return r.view;
}

// Connected, with the booking page the agent sends sponsors to.
const isReady = (c: SponsorAiCalendar | undefined) => c?.status === "CONNECTED" && !!c.bookingUrl;

// The sign-in tab opened by Connect, and when its link stops working.
interface Waiting {
  provider: CalendarProvider;
  until: number;
}

// The organisation's calendar for call booking (GET /calendar). `connect` asks for the Google / Microsoft
// sign-in link and opens it in a new tab; the calendar is then checked every few seconds (TanStack Query,
// polling only) until it's connected with its booking page, for as long as the link works (10 minutes).
// `disconnect` removes the booking page; calls already booked stay in the calendar.
export function useSponsorCalendar() {
  const queryClient = useQueryClient();
  const [waiting, setWaiting] = useState<Waiting | null>(null);
  const [opening, setOpening] = useState<CalendarProvider | null>(null);

  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: calendarKey,
    queryFn: async () => {
      const calendar = await fetchCalendar();
      if (waiting && isReady(calendar)) {
        setWaiting(null);
        toast.success("Calendar connected. Sponsors who ask for a call can now book one");
      }
      return calendar;
    },
    refetchInterval: (q) => (waiting && !isReady(q.state.data) ? CALENDAR_POLL_MS : false),
    // Coming back from the sign-in tab shows the result straight away.
    refetchOnWindowFocus: !!waiting,
  });

  // The sign-in link has stopped working: stop checking.
  const until = waiting?.until;
  useEffect(() => {
    if (until === undefined) return;
    const timer = setTimeout(() => {
      setWaiting(null);
      toast("The sign-in link expired. Connect again if you didn’t finish");
    }, Math.max(0, until - Date.now()));
    return () => clearTimeout(timer);
  }, [until]);

  const connect = useCallback(async (provider: CalendarProvider) => {
    // Opened during the click: a popup blocker stops a tab opened after the request.
    const tab = window.open("", "_blank");
    if (!tab) {
      toast.error("Allow pop-ups for this site to connect your calendar");
      return;
    }
    tab.opener = null;
    tab.document.title = "Connect your calendar";
    tab.document.body?.append("Opening the sign-in page…");
    setOpening(provider);
    const body: CalendarConnectBody = { provider };
    const r = await sponsorRequest<CalendarConnectLink>("POST", routes.api.sponsorAiCalendarConnect, { body });
    setOpening(null);
    if (!r.view) {
      tab.close();
      toast.error(r.message ?? "Couldn't connect your calendar. Try again");
      return;
    }
    tab.location.href = r.view.authUrl;
    setWaiting({ provider, until: Date.now() + CALENDAR_CONNECT_WINDOW_MS });
  }, []);

  // Resolves true once disconnected, so the confirm popup closes.
  const disconnect = useCallback(async () => {
    const r = await sponsorRequest<SponsorAiCalendar>("DELETE", routes.api.sponsorAiCalendar);
    if (r.status >= 200 && r.status < 300) {
      queryClient.setQueryData(calendarKey, r.view ?? NOT_CONNECTED);
      setWaiting(null);
      toast.success("Calendar disconnected. Calls already booked stay in your calendar");
      return true;
    }
    toast.error(r.message ?? "Couldn't disconnect your calendar. Try again");
    // 404: nothing was connected (disconnected elsewhere); show it as it is now.
    if (r.status === 404) refetch();
    return false;
  }, [queryClient, refetch]);

  // The sign-in tab was closed without finishing.
  const stopWaiting = useCallback(() => setWaiting(null), []);

  return {
    calendar: data ?? null,
    loading: isPending,
    // A reload asked for by hand is on its way.
    checking: isFetching && !waiting,
    error: error?.message,
    reload: refetch,
    connect,
    // The provider whose sign-in link is being asked for.
    opening,
    // The provider being signed in to in the other tab, until the calendar is connected.
    waitingFor: waiting && data?.status !== "CONNECTED" ? waiting.provider : null,
    stopWaiting,
    disconnect,
  };
}
