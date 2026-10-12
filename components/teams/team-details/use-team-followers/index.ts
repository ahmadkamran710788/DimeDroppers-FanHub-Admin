"use client";

import { useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";

export type FollowerRelationship = "PLAYER" | "PARENT" | "STAFF" | "FAN";

// One row of the Followers tab.
export interface TeamFollower {
  id: string;
  name: string;
  email: string;
  type: string;
  // ISO date the follow started.
  followedAt: string;
}

// One page of GET /fanhub/org/roster/followers.
interface FollowersPage {
  items: {
    fan: { id: string; name: string; email: string; avatarUrl: string | null };
    followedAt: string;
    relationship: FollowerRelationship;
  }[];
  pagination: { page: number; isLast: boolean };
}

const RELATIONSHIP_LABEL: Record<FollowerRelationship, string> = {
  PLAYER: "Player",
  PARENT: "Parent",
  STAFF: "Staff",
  FAN: "Fan",
};

// The API's page size cap; every page is loaded so the tab can search and paginate locally.
const PAGE_LIMIT = 200;

// Everyone following a team, from the roster API.
export function useTeamFollowers(schoolTeamId: string) {
  const [followers, setFollowers] = useState<TeamFollower[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows: TeamFollower[] = [];
      for (let page = 1; ; page++) {
        const result = await apiCall<{ data: FollowersPage[] }>({
          endpoint: routes.api.rosterFollowers,
          method: "GET",
          data: { schoolTeamId, page, limit: PAGE_LIMIT },
        });
        const data = result.success ? result.data?.data?.[0] : undefined;
        if (!data) break;
        rows.push(
          ...data.items.map((f) => ({
            id: f.fan.id,
            name: f.fan.name,
            email: f.fan.email,
            type: RELATIONSHIP_LABEL[f.relationship] ?? f.relationship,
            followedAt: f.followedAt,
          }))
        );
        if (data.pagination.isLast) break;
      }
      if (cancelled) return;
      setFollowers(rows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [schoolTeamId]);

  return { followers, loading };
}
