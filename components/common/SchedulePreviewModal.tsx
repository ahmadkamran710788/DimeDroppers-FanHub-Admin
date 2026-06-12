"use client";

import Modal from "@/components/common/Modal";
import { cn } from "@/utils/cn";
import { CalendarDays, MapPin } from "lucide-react";

/** A single scraped game from the MaxPreps schedule response. */
export interface ScrapedEvent {
  id: string;
  title: string;
  opponent: string | null;
  description: string | null;
  location: string | null;
  start: string;
  isAllDay: boolean;
  homeAway: "home" | "away" | "neutral" | null;
  result: string | null;
}

/** The school object returned by the scrape endpoint (only the fields we render). */
export interface ScrapedSchool {
  id: string;
  name: string;
  teamName: string | null;
  mascot: string | null;
  sportsType: string | null;
  season: string | null;
  overallRecord: string | null;
  logoUrl: string | null;
  scheduleEvents: ScrapedEvent[];
}

interface SchedulePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: ScrapedSchool | null;
}

/** "2025-11-28T12:00:00" → "Nov 28, 2025 · 12:00 PM"; all-day → date only. */
function formatStart(start: string, isAllDay: boolean): string {
  const date = new Date(start);
  if (Number.isNaN(date.getTime())) return start;
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (isAllDay || !start.includes("T")) return datePart;
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

/** Win → green, Loss → red, otherwise neutral. Result strings look like "W 66-52". */
function resultTone(result: string | null): string {
  if (!result) return "text-midnight-navy/50";
  const flag = result.trim().charAt(0).toUpperCase();
  if (flag === "W") return "text-success";
  if (flag === "L") return "text-error";
  return "text-midnight-navy/70";
}

const HOME_AWAY_LABEL: Record<string, string> = {
  home: "Home",
  away: "Away",
  neutral: "Neutral",
};

export default function SchedulePreviewModal({
  isOpen,
  onClose,
  school,
}: SchedulePreviewModalProps) {
  if (!school) return null;

  const subtitle = [
    school.teamName ?? school.mascot,
    school.sportsType,
    school.season,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[640px] items-stretch gap-5">
      {/* Header — school identity */}
      <div className="flex items-center gap-4">
        <span className="w-16 h-16 shrink-0 rounded-full overflow-hidden border border-midnight-navy/20 bg-midnight-navy/5 flex items-center justify-center">
          {school.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <CalendarDays className="w-7 h-7 text-midnight-navy/50" strokeWidth={1.5} />
          )}
        </span>
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-display font-black text-2xl uppercase text-midnight-navy leading-tight truncate">
            {school.name}
          </h3>
          {subtitle && (
            <p className="text-sm font-medium text-midnight-navy/60 truncate">{subtitle}</p>
          )}
          {school.overallRecord && (
            <p className="text-sm font-semibold text-midnight-navy/80">
              Record: {school.overallRecord}
            </p>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm font-medium text-midnight-navy/60">
        {school.scheduleEvents.length}{" "}
        {school.scheduleEvents.length === 1 ? "game" : "games"} found
      </p>

      {/* Events — scrollable list */}
      <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
        {school.scheduleEvents.map((ev) => {
          const homeAway = ev.homeAway ? HOME_AWAY_LABEL[ev.homeAway] : null;
          return (
            <div
              key={ev.id}
              className="flex items-center gap-4 rounded-[8px] bg-midnight-navy/5 px-4 py-3"
            >
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <p className="text-sm font-semibold text-midnight-navy truncate">
                  {ev.title}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-midnight-navy/50">
                    {formatStart(ev.start, ev.isAllDay)}
                  </span>
                  {ev.location && (
                    <span className="flex items-center gap-1 text-xs text-midnight-navy/50">
                      <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="truncate max-w-[180px]">{ev.location}</span>
                    </span>
                  )}
                </div>
              </div>
              {homeAway && (
                <span className="shrink-0 rounded-full bg-midnight-navy/10 px-2.5 py-1 text-xs font-medium text-midnight-navy/70">
                  {homeAway}
                </span>
              )}
              {ev.result && (
                <span className={cn("shrink-0 text-sm font-bold tabular-nums", resultTone(ev.result))}>
                  {ev.result}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full h-12 rounded-[8px] bg-[rgba(235,235,235,0.8)] text-midnight-navy text-base font-medium transition-opacity hover:opacity-90"
      >
        Close
      </button>
    </Modal>
  );
}
