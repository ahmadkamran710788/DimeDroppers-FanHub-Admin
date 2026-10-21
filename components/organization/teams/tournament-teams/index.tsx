"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import SearchInput from "@/components/common/search-input";
import TournamentEventRow from "@/components/organization/teams/tournament-event-row";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type { DivisionTeamsTreeResponse, TournamentTotals, TreeEvent } from "@/utils/types/exposure-event";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

interface Loaded {
  // The page + search this result answers, so a stale reply is told apart.
  key: string;
  events: TreeEvent[];
  total: number;
  totalPages: number;
}

interface TournamentTeamsProps {
  // Hands the organisation-wide totals (every answer carries them) to the page's stat cards.
  onTotals: (totals: TournamentTotals) => void;
}

// A tournament's Teams page body, in three layers: Events → Divisions → Teams, from GET
// /fanhub/org/exposure/events/division-teams. The API pages the events (newest first) and the
// search matches team names: only events with a matching team come back, with just those teams.
export default function TournamentTeams({ onTotals }: TournamentTeamsProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  // Debounce typing into the search sent to the API.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [query]);

  const key = `${page}|${search}`;
  useEffect(() => {
    let cancelled = false;
    apiCall<DivisionTeamsTreeResponse>({
      endpoint: routes.api.exposureEventsDivisionTeams,
      method: "GET",
      data: { page, limit: PAGE_SIZE, ...(search && { search }) },
    }).then((result) => {
      if (cancelled) return;
      const body = result.success ? result.data?.data?.[0] : undefined;
      if (body?.totals) onTotals(body.totals);
      setLoaded({
        key,
        events: body?.events ?? [],
        total: body?.pagination.total ?? 0,
        totalPages: body?.pagination.totalPages ?? 1,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [key, page, search, onTotals]);

  const loading = loaded?.key !== key;
  const pageCount = Math.max(1, loaded?.totalPages ?? 1);

  return (
    <div className="flex flex-col gap-6">
      <SearchInput
        variant="dark"
        placeholder="Search teams..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
        aria-label="Search teams"
        className="w-full sm:w-72"
      />

      {loading ? (
        <Loader />
      ) : !loaded || loaded.events.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/60">{search ? "No teams match your search." : "No events synced yet."}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {loaded.events.map((e) => (
            // Keyed by the search too, so a search opens the matching events afresh.
            <TournamentEventRow key={`${e.id}|${search}`} event={e} defaultOpen={!!search} />
          ))}
        </ul>
      )}

      {!loading && loaded && loaded.total > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm text-white/60">
            {`Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, loaded.total)} of ${loaded.total} events`}
          </span>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
