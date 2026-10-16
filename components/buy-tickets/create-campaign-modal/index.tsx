"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Modal from "@/components/common/modal";
import CampaignFields from "@/components/buy-tickets/campaign-fields";
import { gameChanges, inputFor, newRow, type TicketTypeRow, type TierField } from "@/components/buy-tickets/campaign-tier";
import GamePicker, { type PickerGame } from "@/components/buy-tickets/game-picker";
import { campaignSchema } from "@/components/buy-tickets/schema";
import apiCall from "@/utils/api-call";
import { formatMoney } from "@/utils/helper";
import { routes } from "@/utils/routes";
import type { ScheduleItem, ScheduleListResponse } from "@/utils/types/schedule";
import type { TicketCampaign, TicketGamesPage } from "@/utils/types/tickets";
import { validateAndSetErrors } from "@/utils/validation";

interface CreateCampaignModalProps {
  onClose: () => void;
  // Set to edit this campaign; otherwise a new one is created.
  campaign?: TicketCampaign | null;
  // Called after the API saved something, so the page can reload.
  onSaved: () => void;
}

// The API answers in a `data` list; mutations clear every cached tickets read.
const INVALIDATES = ["fanhub/org/tickets"];

const LABEL = "text-sm font-medium text-midnight-navy";

const DAY_MS = 24 * 60 * 60 * 1000;

// The real start: `start` is the local wall-clock time with a "Z", `utcTime` the true UTC instant.
const realStart = (e: { start: string; utcTime?: string | null }) => new Date(e.utcTime || e.start).getTime();

const byStart = (a: PickerGame, b: PickerGame) => realStart(a) - realStart(b);

// Tickets are sold for games only: practice sessions and cancelled events are left out. Events
// without a type count as games. (The API can't filter by type yet, so it's done here.)
const isTicketable = (e: ScheduleItem) => e.activityType !== "PRACTICE" && e.status !== "cancelled";

const toPickerGame = (e: ScheduleItem): PickerGame => ({
  id: e.id,
  title: e.title,
  opponent: e.opponent,
  start: e.start,
  utcTime: e.utcTime || e.start,
  sports: e.sports,
  level: e.level,
});

// Create / Edit Campaign dialog. Create: the ticketing type (campaign title), its ticket types ("+ Add"
// blocks, each with an amount and tickets per game) and the games it sells for. Edit: those details
// read-only, only the games change. A game sells through one active campaign at a time, so games of
// another campaign show but can't be picked. Mount it per open.
export default function CreateCampaignModal({ onClose, campaign, onSaved }: CreateCampaignModalProps) {
  const isEdit = !!campaign;
  const [title, setTitle] = useState(campaign?.title ?? "");
  // The "+ Add" blocks of a new campaign (edit shows the saved types read-only).
  const [rows, setRows] = useState<TicketTypeRow[]>(() => [newRow()]);
  const [gameIds, setGameIds] = useState<string[]>(() => campaign?.games.map((g) => g.id) ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  // Upcoming games (not started, no practice sessions), each marked with another campaign it sells through.
  const [upcoming, setUpcoming] = useState<PickerGame[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  // "Now" when the games loaded, so "Ended" stays stable across renders.
  const [loadedAt, setLoadedAt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    Promise.all([
      // `from` is matched against `start`, which can be up to a day off the real time, so ask from
      // a day earlier and keep what is really upcoming below.
      apiCall<ScheduleListResponse>({
        endpoint: routes.api.listSchedules,
        method: "GET",
        data: { page: 1, limit: 100, sortOrder: "asc", from: new Date(now.getTime() - DAY_MS).toISOString() },
      }),
      // Which campaign each game already sells through.
      apiCall<{ data: TicketGamesPage[] }>({ endpoint: routes.api.ticketGames, method: "GET", data: { page: 1, limit: 100, status: "all" } }),
    ]).then(([schedules, tickets]) => {
      if (cancelled) return;
      const events = schedules.success ? ((schedules.data as ScheduleListResponse | null)?.data?.[0]?.items ?? []) : [];
      const sellingIn = new Map(
        (tickets.success ? (tickets.data?.data?.[0]?.items ?? []) : [])
          .filter((g) => g.campaign && g.campaign.status === "ACTIVE" && g.campaign.id !== campaign?.id)
          .map((g) => [g.id, g.campaign!.title])
      );
      setUpcoming(
        events
          .filter((e) => isTicketable(e) && realStart(e) > now.getTime())
          .map((e) => ({ ...toPickerGame(e), takenBy: sellingIn.get(e.id) }))
          .sort(byStart)
      );
      setLoadedAt(now.getTime());
      setGamesLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [campaign?.id]);

  // Every upcoming game, plus (when editing) the other games the campaign is attached to — past
  // ones or a practice session — so they can be detached. "Ended" goes by the real start time.
  const games = (() => {
    const upcomingIds = new Set(upcoming.map((g) => g.id));
    const others = (campaign?.games ?? [])
      .filter((g) => !upcomingIds.has(g.id))
      .map((g) => ({ ...g, ended: realStart(g) <= loadedAt }));
    return [...upcoming, ...others].sort(byStart);
  })();

  // Field errors are keyed by yup path, e.g. "types[0].title".
  const errorKey = (i: number, field: TierField) => `types[${i}].${field}`;

  const update = (i: number, field: TierField, value: string | number) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
    const key = errorKey(i, field);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const removeRow = (i: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    // Row indices shift after a removal, so stale path-keyed errors no longer line up.
    setErrors({});
  };

  // apiCall toasts any refusal, e.g. "This game already sells tickets through another campaign".
  const create = async () => {
    const { success } = await apiCall({
      endpoint: routes.api.ticketCampaigns,
      method: "POST",
      data: { title: title.trim(), ticketTypes: rows.map(inputFor), scheduleEventIds: gameIds },
      invalidates: INVALIDATES,
      showSuccessToast: true,
      successMessage: "Campaign created",
    });
    return success;
  };

  // Edit only changes the games: one POST for the games to attach and a DELETE per game to detach.
  // Stops at the first refusal (e.g. "Tickets have already been sold for this game").
  const saveEdits = async (c: TicketCampaign) => {
    const { attach, detach } = gameChanges(gameIds, c);
    const calls = [
      ...(attach.length ? [{ endpoint: routes.api.ticketCampaignGames(c.id), method: "POST" as const, data: { scheduleEventIds: attach } }] : []),
      ...detach.map((id) => ({ endpoint: routes.api.ticketCampaignGame(c.id, id), method: "DELETE" as const, data: undefined })),
    ];
    for (const call of calls) {
      const { success } = await apiCall({ ...call, invalidates: INVALIDATES });
      if (!success) return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!isEdit && !(await validateAndSetErrors(campaignSchema, { title, types: rows }, setErrors))) return;
    setSaving(true);
    const ok = campaign ? await saveEdits(campaign) : await create();
    setSaving(false);
    // Edits save in steps, so refresh even when a later step was refused.
    if (isEdit || ok) onSaved();
    if (!ok) return;
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? "Edit Campaign" : "Create Campaign"}
      className="max-w-[min(760px,calc(100vw-2rem))] items-stretch max-h-[calc(100dvh-2rem)] overflow-hidden p-4 sm:p-6 gap-4 sm:gap-6"
    >
      <div className="w-full flex-1 min-h-0 flex flex-col gap-5 overflow-y-auto overscroll-contain pr-1">
        {campaign ? (
          // Edit: the campaign's details are read-only; only its games can change.
          <div className="w-full shrink-0 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className={LABEL}>Ticketing Type</span>
              <span className="text-base font-semibold text-midnight-navy">{campaign.title}</span>
            </div>
            <div className="flex flex-col rounded-[12px] border border-[rgba(11,28,45,0.12)] overflow-hidden">
              <div className="flex items-center gap-4 px-4 h-10 bg-[#F5F6F8] border-b border-[rgba(11,28,45,0.12)] text-xs font-semibold uppercase tracking-wide text-midnight-navy/70">
                <span className="flex-1">Tickets</span>
                <span className="w-20 text-right">Amount</span>
                <span className="w-24 text-right">Per Game</span>
              </div>
              {[...campaign.ticketTypes]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((t) => (
                  <div key={t.id} className="flex items-start gap-4 px-4 py-3 border-b last:border-b-0 border-[rgba(11,28,45,0.08)]">
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="text-sm font-medium text-midnight-navy break-words">{t.title}</span>
                      {t.description && <span className="text-xs text-midnight-navy/60 break-words">{t.description}</span>}
                    </div>
                    <span className="w-20 text-right text-sm text-midnight-navy">{formatMoney(t.price)}</span>
                    <span className="w-24 text-right text-sm text-midnight-navy">{t.quantityPerGame.toLocaleString("en-US")}</span>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <>
          <Input
            label="Ticketing Type"
            name="campaignTitle"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
            }}
            placeholder="e.g. 2026 Season Tickets"
            error={errors.title}
            labelClassName={LABEL}
            className="shrink-0"
          />

          <div className="w-full shrink-0 flex flex-col rounded-[12px] border border-[rgba(11,28,45,0.12)] overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-4 px-4 h-12 bg-[#F5F6F8] border-b border-[rgba(11,28,45,0.12)]">
              <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-midnight-navy/70">Tickets</span>
              <span className="hidden sm:block w-[152px] text-xs font-semibold uppercase tracking-wide text-midnight-navy/70">
                Available Tickets
              </span>
              <Button
                variant="cta"
                size="sm"
                label="Add"
                icon={<Plus className="size-4" strokeWidth={2.5} />}
                onClick={() => setRows((prev) => [...prev, newRow()])}
                disabled={rows.length >= 20}
                className="rounded-[8px] text-sm"
              />
            </div>

            {/* Ticket types */}
            <div className="flex flex-col">
              {rows.map((row, i) => (
                <div
                  key={row.key}
                  className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 border-b last:border-b-0 border-[rgba(11,28,45,0.08)]"
                >
                  <CampaignFields row={row} onChange={(f, v) => update(i, f, v)} errorOf={(f) => errors[errorKey(i, f)]} />
                  <div className="w-[68px] shrink-0 flex sm:justify-center sm:pt-8">
                    {rows.length > 1 && (
                      <Button
                        size="icon"
                        variant="text"
                        icon={<Trash2 className="size-5" />}
                        onClick={() => removeRow(i)}
                        aria-label={`Remove ${row.title || `ticket ${i + 1}`}`}
                        className="rounded-[8px] text-error hover:text-error hover:bg-error/10"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.types && <p className="px-4 pb-3 text-sm text-error">{errors.types}</p>}
          </div>
          </>
        )}

        <GamePicker
          label={isEdit ? "Games for this campaign" : "Games"}
          games={games}
          loading={gamesLoading}
          selected={gameIds}
          onChange={setGameIds}
        />
      </div>

      <div className="w-full flex gap-3">
        <Button label="Cancel" variant="secondary" onClick={onClose} fullWidth />
        <Button
          label={saving ? "Saving…" : isEdit ? "Save Changes" : "Create Campaign"}
          variant="cta"
          onClick={() => void handleSave()}
          disabled={saving}
          fullWidth
        />
      </div>
    </Modal>
  );
}
