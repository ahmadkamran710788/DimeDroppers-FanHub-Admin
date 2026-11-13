"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, CalendarDays, CalendarPlus, Copy, RefreshCw, Unplug } from "lucide-react";
import Badge from "@/components/common/badge";
import Button from "@/components/common/button";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import SectionCard from "@/components/common/section-card";
import { CALENDAR_PROVIDER_LABEL } from "@/components/organization/sponsor-ai-agent/data";
import { useSponsorCalendar } from "@/components/organization/sponsor-ai-agent/use-sponsor-calendar";
import { formatDay } from "@/components/organization/sponsor-messages/data";
import type { CalendarProvider } from "@/utils/types/sponsor-ai";

const PROVIDERS: CalendarProvider[] = ["google", "microsoft"];

const HOW_IT_WORKS = [
  "A sponsor replies asking for a call.",
  "Sponsor AI Agent answers with your booking link.",
  "The sponsor picks a time. A 30-minute call with a meeting link goes into your calendar, and the conversation moves to you in Sponsor Messages.",
];

async function copyLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Booking link copied");
  } catch {
    toast.error("Couldn’t copy the link. Select it and copy it instead");
  }
}

// Sponsor AI Agent › Settings: the Google or Outlook calendar sponsors book calls in
// (FANHUB_SPONSOR_AI_CALENDAR_FRONTEND.md). Connect opens the provider's sign-in in a new tab and the card
// updates once it's done. Connected, it shows the account, the booking page link and Disconnect; an expired
// connection asks to reconnect.
export default function CalendarCard() {
  const { calendar, loading, checking, error, reload, connect, opening, waitingFor, stopWaiting, disconnect } =
    useSponsorCalendar();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const linked = calendar?.status === "CONNECTED" || calendar?.status === "NEEDS_RECONNECT";
  const expired = calendar?.status === "NEEDS_RECONNECT";
  const name = calendar?.provider ? `${CALENDAR_PROVIDER_LABEL[calendar.provider]} Calendar` : "Calendar";
  const account = [
    calendar?.email ? `Connected as ${calendar.email}` : "Connected",
    calendar?.connectedAt && `since ${formatDay(calendar.connectedAt)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  function body() {
    if (!calendar) {
      return loading ? (
        <Loader />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-white/60">{error ?? "Couldn’t load your calendar."}</p>
          <Button size="sm" label="Try again" icon={<RefreshCw className="size-4" />} onClick={() => reload()} />
        </div>
      );
    }

    if (waitingFor) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-white/15 bg-black/20 px-4 py-3">
          <p className="text-sm text-white/80">
            {`Finish signing in to ${CALENDAR_PROVIDER_LABEL[waitingFor]} in the new tab. This card updates once your calendar is connected.`}
          </p>
          <Button variant="text" size="sm" label="Cancel" onClick={stopWaiting} />
        </div>
      );
    }

    if (!linked) {
      return (
        <div className="flex flex-wrap gap-3">
          {PROVIDERS.map((p) => (
            <Button
              key={p}
              variant="outline"
              label={opening === p ? "Opening…" : `Connect ${CALENDAR_PROVIDER_LABEL[p]}`}
              icon={<CalendarPlus className="size-5" />}
              onClick={() => connect(p)}
              disabled={opening !== null}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-white/15 bg-black/20 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="size-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center">
              <CalendarDays className="size-5 text-white" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                {name}
                {expired ? <Badge variant="error" label="Connection expired" /> : <Badge variant="connected" />}
              </span>
              <span className="text-xs text-white/60 break-words">{account}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {expired && calendar.provider && (
              <Button
                size="sm"
                variant="cta"
                label={opening ? "Opening…" : "Reconnect"}
                icon={<RefreshCw className="size-4" />}
                onClick={() => connect(calendar.provider!)}
                disabled={opening !== null}
                className="h-10 px-4 text-sm"
              />
            )}
            <Button
              size="sm"
              variant="danger"
              label="Disconnect"
              icon={<Unplug className="size-4" />}
              onClick={() => setConfirmDisconnect(true)}
              className="h-10 px-4 text-sm"
            />
          </div>
        </div>

        {expired ? (
          <p className="flex items-start gap-2 text-sm text-[#ffc999]">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
            Your calendar connection expired. Reconnect so sponsors can keep booking calls. Until then, the agent asks
            them for a good day and time and hands the conversation to you.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold tracking-[1.2px] text-white/60">YOUR BOOKING PAGE</span>
            {calendar.bookingUrl ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <a
                  href={calendar.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 truncate rounded-[8px] border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/90 underline-offset-2 transition-colors hover:bg-white/10 hover:underline"
                >
                  {calendar.bookingUrl}
                </a>
                <Button
                  size="sm"
                  label="Copy link"
                  icon={<Copy className="size-4" />}
                  onClick={() => copyLink(calendar.bookingUrl!)}
                  className="h-10 px-4 text-sm"
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-white/60">Your booking page is being set up. It shows here in a moment.</p>
                <Button
                  variant="text"
                  size="sm"
                  label={checking ? "Checking…" : "Check again"}
                  onClick={() => reload()}
                  disabled={checking}
                />
              </div>
            )}
            <p className="text-xs text-white/50">The agent sends this link to sponsors who ask for a call.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <SectionCard
      title="Call booking"
      description="Connect your calendar so sponsors who ask for a call can book one with you. Without it, the agent asks the sponsor for a good day and time and hands the conversation to you."
    >
      {body()}

      <div className="flex flex-col gap-3 border-t border-white/10 pt-5">
        <span className="text-xs font-bold tracking-[1.2px] text-white/60">HOW IT WORKS</span>
        <ol className="flex flex-col gap-2">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm text-white/80">
              <span className="size-6 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <ConfirmModal
        isOpen={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        title="Disconnect your calendar?"
        message="Your booking page is removed, so the agent asks sponsors for a good day and time instead. Calls already booked stay in your calendar."
        confirmLabel="Disconnect"
        busyLabel="Disconnecting…"
        onConfirm={disconnect}
        destructive
      />
    </SectionCard>
  );
}
