"use client";

import { useState } from "react";
import { SCOREKEEPER_REQUESTS, VIDEOGRAPHER_REQUESTS } from "@/components/requests/config";
import GameRequests from "@/components/requests/game-requests";

// Configs hold endpoint functions, so pages pass the role and the client side resolves it.
const ROLES = {
  scorekeeper: { config: SCOREKEEPER_REQUESTS, description: "Review fans asking to keep score for your games." },
  videographer: { config: VIDEOGRAPHER_REQUESTS, description: "Review fans asking to film your games." },
} as const;

// One role's per-game request queue (Scorekeeper Requests / Video Grapher Requests).
export default function RoleRequestsPage({ role }: { role: keyof typeof ROLES }) {
  const { config, description } = ROLES[role];
  const [pending, setPending] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-white/60 text-sm">{description}</p>
        {pending !== null && pending > 0 && (
          <span className="h-6 px-2.5 rounded-full bg-error/20 text-error text-xs font-semibold flex items-center">
            {`${pending} pending`}
          </span>
        )}
      </div>
      <GameRequests config={config} onPendingCount={setPending} />
    </div>
  );
}
