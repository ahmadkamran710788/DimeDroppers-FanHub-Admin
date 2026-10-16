"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/loader";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { TicketAttendance } from "@/utils/types/tickets";

// Tickets sold for one game, per ticket type, shown when its Schedules row is opened (from the
// attendance endpoint). Loads on open; opening it again comes from apiCall's cache.
export default function GameAttendance({ gameId }: { gameId: string }) {
  const [attendance, setAttendance] = useState<TicketAttendance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: TicketAttendance[] }>({ endpoint: routes.api.ticketGameAttendance(gameId), method: "GET" }).then((result) => {
      if (cancelled) return;
      setAttendance(result.success ? (result.data?.data?.[0] ?? null) : null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Says what this panel is, so the open row reads on its own. */}
      <div className="flex flex-col gap-1">
        <h4 className="font-display font-extrabold text-lg uppercase text-white leading-none">Tickets Sold</h4>
        <p className="text-xs text-white/60">Tickets sold for this game, per ticket.</p>
      </div>
      <AttendanceBody loading={loading} attendance={attendance} />
    </div>
  );
}

function AttendanceBody({ loading, attendance }: { loading: boolean; attendance: TicketAttendance | null }) {
  if (loading) return <Loader className="mx-auto my-4" />;
  if (!attendance) return <p className="text-sm text-white/60">Couldn&apos;t load this game&apos;s tickets.</p>;
  // The API lists only ticket types with tickets issued for this game.
  if (attendance.byTicketType.length === 0) return <p className="text-sm text-white/60">No tickets sold for this game yet.</p>;

  const COLS = "grid grid-cols-[minmax(0,1fr)_80px_80px] sm:grid-cols-[minmax(0,1fr)_120px_120px] gap-3";

  return (
    <div className="w-full flex flex-col gap-4">
      <span className="text-sm font-semibold text-white">{`Sold ${attendance.sold.toLocaleString("en-US")}`}</span>

      <div className="w-full flex flex-col text-sm">
        <div className={`${COLS} pb-2 text-xs font-semibold uppercase tracking-wide text-white/50`}>
          <span>Ticket</span>
          <span className="text-right">Sold</span>
          <span className="text-right">Voided</span>
        </div>
        {attendance.byTicketType.map((c) => (
          <div key={c.ticketTypeId} className={`${COLS} py-2 border-t border-white/10 text-white`}>
            <span className="truncate">{c.title}</span>
            <span className="text-right">{c.sold.toLocaleString("en-US")}</span>
            <span className="text-right text-white/60">{c.voided.toLocaleString("en-US")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
