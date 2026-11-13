"use client";

import { CalendarCheck, CalendarX2, Video } from "lucide-react";
import Button from "@/components/common/button";
import StatusPill from "@/components/common/status-pill";
import { formatCallTime } from "@/components/organization/sponsor-messages/data";
import type { SponsorAiCall } from "@/utils/types/sponsor-ai";

interface CallCardProps {
  call: SponsorAiCall;
}

// The call the sponsor booked from the agent's link, at the top of the conversation
// (FANHUB_SPONSOR_AI_CALENDAR_FRONTEND.md §4): when it is, in the viewer's time zone, with a Join button
// once the meeting link is made, and whether it was rescheduled; or that it was cancelled, and why.
export default function CallCard({ call }: CallCardProps) {
  const when = formatCallTime(call.startAt, call.endAt);
  const guest = call.guestName ?? call.guestEmail;
  const meetingUrl = call.meetingUrl;

  if (call.status === "CANCELLED") {
    return (
      <div className="flex items-start gap-3 rounded-[8px] border border-white/15 bg-white/5 px-4 py-3">
        <CalendarX2 className="size-5 shrink-0 mt-0.5 text-error" aria-hidden="true" />
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold text-white">Call cancelled</span>
          <span className="text-xs text-white/50 line-through">{when}</span>
          {call.cancellationReason && (
            <p className="text-xs text-white/80 break-words">{`Reason: ${call.cancellationReason}`}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-success/40 bg-[#1d3a1e]/60 px-4 py-3">
      <div className="flex items-start gap-3 min-w-0">
        <CalendarCheck className="size-5 shrink-0 mt-0.5 text-[#a3e3a5]" aria-hidden="true" />
        <div className="flex flex-col gap-1 min-w-0">
          <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
            Call booked
            {call.rescheduledAt && (
              <StatusPill
                label="Rescheduled"
                color="bg-white/10"
                className="h-auto px-2 py-0.5"
                textClassName="text-[11px] font-semibold text-white/80"
              />
            )}
          </span>
          <span className="text-sm text-white/90">{when}</span>
          <span className="text-xs text-white/60 break-words">{`With ${guest}`}</span>
        </div>
      </div>
      {meetingUrl ? (
        <Button
          variant="cta"
          size="sm"
          label="Join"
          icon={<Video className="size-4" />}
          onClick={() => window.open(meetingUrl, "_blank", "noopener,noreferrer")}
          className="h-10 px-5 text-sm"
        />
      ) : (
        // The calendar makes the Meet or Teams link within about a minute; the next load has it.
        <span className="text-xs text-white/60">Meeting link on its way</span>
      )}
    </div>
  );
}
