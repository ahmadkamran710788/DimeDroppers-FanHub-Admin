"use client";

import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import GenericTable, { type Column } from "@/components/common/GenericTable";
import StatusPill from "@/components/common/StatusPill";
import { getScorekeeperEmail, getScorekeeperName } from "@/utils/helper";
import type { ExposureGame } from "@/utils/types/exposure-event";
import type {
  ScorekeeperBulkAssignResponse,
  ScorekeeperPoolMember,
  ScorekeeperPoolResponse,
} from "@/utils/types/scorekeeper";
import { ChevronDown, Loader2, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

// ─── Local presentational helpers (kept self-contained; the modal has private copies) ──

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const dash = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : v;

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const color = s === "cancelled" ? "bg-red-400" : s === "tentative" ? "bg-yellow-400" : "bg-green-400";
  return <StatusPill label={status} color={color} className="h-5 px-2" textClassName="text-[11px] capitalize" />;
}

// ─── Games view with scorekeeper assignment ─────────────────────────────────────

export default function GameScheduleView({ games }: { games: ExposureGame[] }) {
  // Assignment workflow state. `assigning` opens the toolbar; picking a member
  // (`selectedFanId`) reveals the per-row checkboxes.
  const [assigning, setAssigning] = useState(false);
  const [pool, setPool] = useState<ScorekeeperPoolMember[]>([]);
  const [poolLoading, setPoolLoading] = useState(true); // fetched eagerly on mount
  const [poolLoaded, setPoolLoaded] = useState(false);
  const [selectedFanId, setSelectedFanId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [linking, setLinking] = useState(false);
  // Local, optimistic assignments (gameId → fanId) applied after a successful link, so the
  // "Official Scorekeeper" column updates without waiting for the modal to refetch `games`.
  const [assignedOverrides, setAssignedOverrides] = useState<Record<string, string>>({});

  const inSelection = assigning && selectedFanId !== null;
  const allSelected = games.length > 0 && selectedIds.size === games.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Fetch the ACTIVE pool eagerly so the Official Scorekeeper column can resolve names on
  // first render (and the assign dropdown reuses the same data).
  useEffect(() => {
    let cancelled = false;
    apiCall<ScorekeeperPoolResponse>({
      endpoint: routes.api.proxyListScorekeeperPool,
      method: "GET",
      data: { status: "ACTIVE" }, // → ?status=ACTIVE, forwarded verbatim by the proxy
    }).then((res) => {
      if (cancelled) return;
      // Only members with a linkable fanId can be assigned / resolved to a name.
      const members = res.success && res.data ? (res.data.data ?? []).filter((m) => m.fanId) : [];
      setPool(members);
      setPoolLoaded(res.success);
      setPoolLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // fanId → display name, for the Official Scorekeeper column and dropdown.
  const nameByFanId: Record<string, string> = {};
  for (const m of pool) if (m.fanId) nameByFanId[m.fanId] = getScorekeeperName(m);

  const openAssign = () => setAssigning(true);

  const cancel = () => {
    setAssigning(false);
    setSelectedFanId(null);
    setSelectedIds(new Set());
  };

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => (prev.size === games.length ? new Set() : new Set(games.map((g) => g.id))));
  };

  // The scorekeeper currently assigned to a game (in-session override wins over the server value).
  const assignedFanId = (g: ExposureGame) => assignedOverrides[g.id] ?? g.officialScorekeeperFanId;

  // Picking a scorekeeper pre-checks the games already linked to them; switching recomputes.
  const selectScorekeeper = (fanId: string | null) => {
    setSelectedFanId(fanId);
    setSelectedIds(fanId ? new Set(games.filter((g) => assignedFanId(g) === fanId).map((g) => g.id)) : new Set());
  };

  const link = async () => {
    if (!selectedFanId || selectedIds.size === 0) return;
    // Capture before cancel() resets the selection state.
    const fanId = selectedFanId;
    const ids = [...selectedIds];
    setLinking(true);
    const res = await apiCall<ScorekeeperBulkAssignResponse>({
      endpoint: routes.api.proxyBulkAssignScorekeeper,
      method: "PUT",
      data: { fanId, scheduleEventIds: ids },
      showSuccessToast: true,
      successMessage: "Scorekeeper assigned to the selected games",
    });
    setLinking(false);
    if (res.success) {
      setAssignedOverrides((prev) => {
        const next = { ...prev };
        for (const id of ids) next[id] = fanId;
        return next;
      });
      cancel();
    }
  };

  const columns: Column<ExposureGame>[] = [];
  if (inSelection) {
    columns.push({
      header: "",
      cls: "w-10 justify-center",
      cell: (g) => (
        <input
          type="checkbox"
          checked={selectedIds.has(g.id)}
          onChange={() => toggleId(g.id)}
          aria-label={`Select ${g.title ?? g.opponent ?? "game"}`}
          className="w-4 h-4 accent-sky-500 cursor-pointer"
        />
      ),
    });
  }
  columns.push(
    { header: "Date", cls: "w-32", cell: (g) => formatDateTime(g.start) },
    { header: "Matchup", cls: "flex-1", cell: (g) => dash(g.title ?? g.opponent) },
    { header: "Division", cls: "w-28", cell: (g) => dash(g.sports) },
    { header: "Location", cls: "flex-1", cell: (g) => dash(g.location) },
    { header: "Result", cls: "w-20 justify-center", cell: (g) => dash(g.result) },
    { header: "Status", cls: "w-24 justify-center", cell: (g) => (g.status ? <StatusBadge status={g.status} /> : "—") },
    {
      header: "Official Scorekeeper",
      cls: "w-44",
      cell: (g) => {
        const fanId = assignedFanId(g);
        if (!fanId) return "—";
        const name = nameByFanId[fanId];
        if (name) return name;
        return poolLoading ? "…" : "Assigned";
      },
    }
  );

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3 min-h-9">
        {inSelection ? (
          <span className="text-white/60 text-xs">
            {selectedIds.size} selected
            {games.length > 0 && (
              <label className="inline-flex items-center gap-1.5 ml-3 cursor-pointer align-middle">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-sky-500 cursor-pointer"
                />
                <span className="text-white/70">Select all</span>
              </label>
            )}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {!assigning ? (
            <button
              type="button"
              onClick={openAssign}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              Assign Scorekeeper
            </button>
          ) : (
            <>
              {poolLoading ? (
                <span className="inline-flex items-center gap-2 text-white/50 text-xs h-9 px-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading scorekeepers…
                </span>
              ) : pool.length === 0 ? (
                <span className="text-white/50 text-xs h-9 inline-flex items-center px-2">
                  {poolLoaded ? "No active scorekeepers." : "Couldn't load scorekeepers."}
                </span>
              ) : (
                <div className="relative inline-flex items-center">
                  <select
                    value={selectedFanId ?? ""}
                    onChange={(e) => selectScorekeeper(e.target.value || null)}
                    aria-label="Select scorekeeper"
                    className="h-9 w-56 appearance-none truncate rounded-lg bg-white/10 text-white text-xs font-medium pl-3 pr-8 border border-white/15 outline-none focus:border-sky-400 transition-colors cursor-pointer"
                  >
                    <option value="" disabled className="text-slate-900">
                      Select scorekeeper…
                    </option>
                    {pool.map((m) => {
                      const email = getScorekeeperEmail(m);
                      return (
                        <option key={m.id} value={m.fanId as string} className="text-slate-900">
                          {getScorekeeperName(m)}
                          {email ? ` — ${email}` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-2 w-4 h-4 text-white/60 pointer-events-none" />
                </div>
              )}

              {inSelection && (
                <button
                  type="button"
                  onClick={link}
                  disabled={selectedIds.size === 0 || linking}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-white text-xs font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "var(--gradient-cta)" }}
                >
                  {linking && <Loader2 className="w-4 h-4 animate-spin" />}
                  Link{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                </button>
              )}

              <button
                type="button"
                onClick={cancel}
                aria-label="Cancel"
                className="size-9 shrink-0 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </>
          )}
        </div>
      </div>

      <GenericTable
        columns={columns}
        rows={games}
        getKey={(g) => g.id}
        empty="No games found for this event."
      />
    </div>
  );
}
