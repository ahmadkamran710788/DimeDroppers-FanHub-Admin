"use client";

import { useCallback, useState } from "react";
import Tabs from "@/components/common/tabs";
import GameRequests from "@/components/requests/game-requests";
import { SCOREKEEPER_REQUESTS, VIDEOGRAPHER_REQUESTS } from "@/components/requests/config";

const TABS = ["Score Keepers", "Video Graphers"] as const;
type Tab = (typeof TABS)[number];

const CONFIG = {
  "Score Keepers": SCOREKEEPER_REQUESTS,
  "Video Graphers": VIDEOGRAPHER_REQUESTS,
} as const;

// Per-game staff requests in one place: fans asking to keep score for or film a game.
export default function RequestsPage() {
  const [tab, setTab] = useState<Tab>("Score Keepers");
  // Pending counts per tab (each API's pendingCount; undefined until that tab has loaded).
  const [pending, setPending] = useState<Partial<Record<Tab, number>>>({});

  const handlePendingCount = useCallback(
    (count: number) => setPending((prev) => ({ ...prev, [tab]: count })),
    [tab]
  );

  return (
    <div className="flex flex-col gap-6">
      <p className="text-white/60 text-sm">Review fans asking to keep score for or film your games.</p>

      <Tabs tabs={TABS} active={tab} onChange={setTab} counts={pending} />

      {/* Keyed per tab so the status filter and page reset when switching roles. */}
      <GameRequests key={tab} config={CONFIG[tab]} onPendingCount={handlePendingCount} />
    </div>
  );
}
