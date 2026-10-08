"use client";

import { useState, type ReactNode } from "react";
import { Settings } from "lucide-react";
import toast from "react-hot-toast";
import Checkbox from "@/components/common/checkbox";
import GenericTable, { type Column } from "@/components/common/generic-table";
import Input from "@/components/common/input";
import Toggle from "@/components/common/toggle";
import type { EngagementSetting } from "@/components/engagement/data";

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Checkbox with a bold label, used for the Multiplier and visibility settings.
function CheckOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="cursor-pointer flex items-center gap-2 text-left text-xs font-semibold text-white"
    >
      <Checkbox checked={checked} variant="white" />
      {label}
    </button>
  );
}

interface SettingsTableProps {
  rows: EngagementSetting[];
  // Round icon before each campaign name (Overview); omitted for plain rows (Predictions).
  icon?: (row: EngagementSetting) => ReactNode;
  // How the live date reads: "Live since May 1, 2025" or "Live Activated May 1, 2025".
  liveLabel?: "since" | "Activated";
}

// Engagement settings table shared by the Overview (campaign types) and Predictions tabs:
// status, multiplier, participation threshold and visibility for each row.
// Changes stay on this page until the engagement API exists. Rows seed local state, so give each
// table its own `key` when the rows change.
export default function SettingsTable({ rows, icon, liveLabel = "since" }: SettingsTableProps) {
  const [types, setTypes] = useState<EngagementSetting[]>(rows);

  const update = (id: string, patch: Partial<EngagementSetting>) =>
    setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

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
          <Toggle
            label={t.active ? "Active" : "Inactive"}
            checked={t.active}
            onChange={(active) => update(t.id, { active })}
            labelPosition="right"
            labelClassName="text-xs font-semibold"
          />
          {t.active ? (
            <span className="flex items-center gap-1.5 text-xs text-white">
              <span className="size-2 rounded-full bg-success" />
              <span className="text-success">Live</span>
              {`${liveLabel} ${formatDate(t.liveSince)}`}
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
      cell: (t) => <CheckOption label="Multiplier" checked={t.multiplier} onChange={(multiplier) => update(t.id, { multiplier })} />,
    },
    {
      header: "Participation Settings",
      cls: "w-[200px] shrink-0 py-5",
      cell: (t) =>
        t.threshold === null ? (
          <div className="flex flex-col gap-2 text-xs text-white">
            <span className="font-semibold">N/A</span>
            <span className="leading-[19px] text-white/80">{t.thresholdNote}</span>
          </div>
        ) : (
          <Input
            label="Min. Participation Threshold"
            name={`threshold-${t.id}`}
            type="number"
            value={String(t.threshold)}
            onChange={(e) => update(t.id, { threshold: Math.max(0, Number(e.target.value) || 0) })}
            labelClassName="text-xs font-semibold text-white"
            inputClassName="w-[88px] bg-white"
          />
        ),
    },
    {
      header: "Visibility Settings",
      cls: "w-[200px] shrink-0 py-5",
      cell: (t) => (
        <div className="flex flex-col gap-2">
          <CheckOption label={t.visibilityLabel} checked={t.visibility} onChange={(visibility) => update(t.id, { visibility })} />
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

  // Settings sit at the top of each row; only the gear button is centred.
  return <GenericTable columns={columns} rows={types} getKey={(t) => t.id} cellClassName="items-start" empty="Nothing to show." />;
}
