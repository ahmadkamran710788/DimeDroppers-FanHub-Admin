"use client";

import { useEffect, useState } from "react";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { TeamDonations } from "@/utils/types/campaign";

// Paid-donation totals per team, for the Giving Overview.
export function useDonationsByTeam() {
  const [teams, setTeams] = useState<TeamDonations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiCall<{ data: { teams: TeamDonations[] }[] }>({ endpoint: routes.api.donationsByTeam, method: "GET" }).then((result) => {
      if (cancelled) return;
      setTeams(result.success ? (result.data?.data?.[0]?.teams ?? []) : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { teams, loading };
}
