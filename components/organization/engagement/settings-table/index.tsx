"use client";

import { useState, type ReactNode } from "react";
import { Settings } from "lucide-react";
import toast from "react-hot-toast";
import Checkbox from "@/components/common/checkbox";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Input from "@/components/common/input";
import Pagination from "@/components/common/pagination";
import StatusPill from "@/components/common/status-pill";
import Toggle from "@/components/common/toggle";
import type { EngagementSetting } from "@/components/organization/engagement/data";

// Rows per page, for local paging and for the page size the campaign tabs ask the API for.
export const ENGAGEMENT_PAGE_SIZE = 10;

// "2026-10-14" or a full ISO timestamp → "Oct 14, 2026".
const formatDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Checkbox with a bold label, used for the Multiplier and visibility settings.
function CheckOption({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="cursor-pointer flex items-center gap-2 text-left text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Checkbox checked={checked} variant="white" />
      {label}
    </button>
  );
}

// The fields a row's switches change.
type SettingPatch = Partial<Pick<EngagementSetting, "active" | "multiplier" | "threshold" | "visibility">>;

interface SettingsTableProps {
  rows: EngagementSetting[];
  // Round icon before each campaign name (Overview); omitted for plain rows (Predictions).
  icon?: (row: EngagementSetting) => ReactNode;
  // How the live date reads: "Live since May 1, 2025" or "Live Activated May 1, 2025".
  liveLabel?: "since" | "Activated";
  // Saves a change to the API; resolves false on failure so the row goes back. Rows without it
  // (sample Quests / Arcade) only change on this page.
  onSave?: (row: EngagementSetting, patch: SettingPatch) => Promise<boolean>;
  loading?: boolean;
  // Set when the API pages the rows: `rows` is just the current page (ENGAGEMENT_PAGE_SIZE long)
  // and `total` counts every row. Without it the table pages the rows it was given.
  serverPagination?: { page: number; total: number; onChange: (page: number) => void };
}

// Engagement settings table shared by the Overview (campaign types) and the campaign tabs:
// status, multiplier, participation threshold and visibility for each row. Rows seed local
// state, so give each table its own `key` when the rows change.
export default function SettingsTable({
  rows,
  icon,
  liveLabel = "since",
  onSave,
  loading = false,
  serverPagination,
}: SettingsTableProps) {
  const [types, setTypes] = useState<EngagementSetting[]>(rows);
  const [page, setPage] = useState(1);
  // Thresholds being typed, saved when the field loses focus.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const apply = (id: string, patch: SettingPatch) => setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  // Shows the change at once and puts the row back if the API refuses it (apiCall toasts why).
  const update = async (row: EngagementSetting, patch: SettingPatch) => {
    apply(row.id, patch);
    if (!onSave) return;
    const before = Object.fromEntries(Object.keys(patch).map((k) => [k, row[k as keyof SettingPatch]])) as SettingPatch;
    if (!(await onSave(row, patch))) apply(row.id, before);
  };

  const saveThreshold = (row: EngagementSetting) => {
    const draft = drafts[row.id];
    if (draft === undefined) return;
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    const threshold = draft.trim() === "" ? null : Math.max(0, Math.round(Number(draft)) || 0);
    if (threshold !== row.threshold) void update(row, { threshold });
  };

  const columns: Column<EngagementSetting>[] = [
    {
      header: "Campaign",
      cls: "flex-1 min-w-[240px] py-5",
      cell: (t) => (
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <span className="size-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white">
              {icon(t)}
            </span>
          )}
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-semibold text-white">{t.name}</span>
            <span className="text-xs font-normal leading-[19px] text-white/40">{t.description}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      cls: "w-[200px] shrink-0 py-5",
      cell: (t) => (
        <div className="flex flex-col gap-3">
          {!t.statusLocked && (
            <Toggle
              // A campaign's badge says what fans see, so its switch just reads On / Off.
              label={t.statusBadge ? (t.active ? "On" : "Off") : t.active ? "Active" : "Inactive"}
              checked={t.active}
              onChange={(active) => void update(t, { active })}
              labelPosition="right"
              labelClassName="text-xs font-semibold"
            />
          )}
          {t.statusBadge ? (
            <StatusPill label={t.statusBadge.label} color={t.statusBadge.color} className="self-start whitespace-nowrap" />
          ) : t.active ? (
            <span className="flex items-center gap-1.5 text-xs text-white">
              <span className="size-2 rounded-full bg-success" />
              <span className="text-success">Live</span>
              {t.liveSince && `${liveLabel} ${formatDate(t.liveSince)}`}
            </span>
          ) : (
            <span className="text-xs text-white/50">Paused</span>
          )}
        </div>
      ),
    },
    {
      header: "Multiplier",
      cls: "w-[140px] shrink-0 py-5",
      cell: (t) => (
        <div className="flex flex-col gap-2">
          <CheckOption
            label="Multiplier"
            checked={t.multiplier}
            onChange={(multiplier) => void update(t, { multiplier })}
            disabled={t.statusLocked}
          />
          {t.multiplierNote && <span className="text-xs leading-[19px] text-white/50">{t.multiplierNote}</span>}
        </div>
      ),
    },
    {
      header: "Participation Settings",
      cls: "w-[200px] shrink-0 py-5",
      cell: (t) =>
        t.thresholdNote ? (
          <div className="flex flex-col gap-2 text-xs text-white">
            <span className="font-semibold">N/A</span>
            <span className="leading-[19px] text-white/80">{t.thresholdNote}</span>
          </div>
        ) : (
          <Input
            label="Min. Participation Threshold"
            name={`threshold-${t.id}`}
            type="number"
            value={drafts[t.id] ?? (t.threshold === null ? "" : String(t.threshold))}
            placeholder="None"
            onChange={(e) => {
              const value = e.target.value;
              if (onSave) setDrafts((prev) => ({ ...prev, [t.id]: value }));
              else apply(t.id, { threshold: Math.max(0, Number(value) || 0) });
            }}
            onBlur={() => saveThreshold(t)}
            labelClassName="text-xs font-semibold text-white"
            inputClassName="w-[88px] bg-white"
            disabled={t.statusLocked}
          />
        ),
    },
    {
      header: "Visibility Settings",
      cls: "w-[200px] shrink-0 py-5",
      cell: (t) => (
        <div className="flex flex-col gap-2">
          <CheckOption
            label={t.visibilityLabel}
            checked={t.visibility}
            onChange={(visibility) => void update(t, { visibility })}
            disabled={t.statusLocked}
          />
          <span className="text-xs leading-[19px] text-white/80">{t.visibilityHint}</span>
        </div>
      ),
    },
    {
      header: "Actions",
      cls: "w-20 shrink-0 py-5 justify-end items-center",
      cell: (t) => (
        <button
          type="button"
          aria-label={`${t.name} settings`}
          // Per-type settings pages aren't designed yet.
          onClick={() => toast("Coming soon.")}
          className="cursor-pointer size-12 rounded-lg bg-white/25 hover:bg-white/35 flex items-center justify-center text-white transition-colors"
        >
          <Settings className="size-6" strokeWidth={1.5} />
        </button>
      ),
    },
  ];

  // The API pages the rows (campaign tabs), or every row is here and pages are sliced locally.
  const total = serverPagination ? serverPagination.total : types.length;
  const pageCount = Math.max(1, Math.ceil(total / ENGAGEMENT_PAGE_SIZE));
  const currentPage = Math.min(serverPagination ? serverPagination.page : page, pageCount);
  const visible = serverPagination
    ? types
    : types.slice((currentPage - 1) * ENGAGEMENT_PAGE_SIZE, currentPage * ENGAGEMENT_PAGE_SIZE);
  const from = total === 0 ? 0 : (currentPage - 1) * ENGAGEMENT_PAGE_SIZE + 1;
  const to = Math.min(currentPage * ENGAGEMENT_PAGE_SIZE, total);

  // Settings sit at the top of each row; only the gear button is centred.
  return (
    <div className="flex flex-col">
      <GenericTable
        columns={columns}
        rows={visible}
        getKey={(t) => t.id}
        loading={loading}
        cellClassName="items-start"
        empty="Nothing to show."
      />
      {/* With API paging the footer stays while the next page loads, so it doesn't jump. */}
      {(serverPagination ? total > 0 : !loading && total > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/20">
          <span className="text-xs text-white/80">{`Showing ${from} to ${to} of ${total}`}</span>
          <Pagination page={currentPage} pageCount={pageCount} onChange={serverPagination ? serverPagination.onChange : setPage} />
        </div>
      )}
    </div>
  );
}
