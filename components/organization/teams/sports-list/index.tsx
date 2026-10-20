"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import Button from "@/components/common/button";
import FilterChipMenu from "@/components/common/filter-chip-menu";
import Loader from "@/components/common/loader";
import RowActionsMenu from "@/components/common/row-actions-menu";
import SearchInput from "@/components/common/search-input";
import { sportIcon } from "@/components/organization/teams/data";
import { sportRing, type Department, type DepartmentTeam } from "@/components/organization/teams/use-org-teams";
import { routes } from "@/utils/routes";

const ALL = "All Activities";

interface SportsListProps {
  departments: Department[];
  loading: boolean;
  // Fallback crest when a team has no logo URL.
  crest: string;
  onRenameSport: (sport: Department) => void;
  onEditTeam: (team: DepartmentTeam, sport: Department) => void;
}

// Teams grouped by sport, like the fan app's Team Info screen: a search, an Activity filter, then one
// section per sport with its teams. A sport with no teams still shows.
export default function SportsList({ departments, loading, crest, onRenameSport, onEditTeam }: SportsListProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activity, setActivity] = useState(ALL);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return departments
      .filter((d) => activity === ALL || d.name === activity)
      .map((d) => ({
        ...d,
        // A search on the sport's name keeps all its teams.
        teams: !q || d.name.toLowerCase().includes(q) ? d.teams : d.teams.filter((t) => t.name.toLowerCase().includes(q)),
      }))
      .filter((d) => !q || d.teams.length > 0 || d.name.toLowerCase().includes(q));
  }, [departments, query, activity]);

  if (loading) return <Loader />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3">
        <SearchInput
          variant="dark"
          placeholder="Search activities or teams..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search activities or teams"
          className="w-full sm:w-72"
        />
        <FilterChipMenu
          label={activity}
          ariaLabel="Filter by activity"
          items={[ALL, ...departments.map((d) => d.name)].map((name) => ({ label: name, onSelect: () => setActivity(name) }))}
        />
      </div>

      {departments.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/60">
          No activities yet. Click <span className="font-semibold text-white">Add Activity</span> to add your first one.
        </p>
      ) : sections.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/60">No activities or teams match your search.</p>
      ) : (
        sections.map((sport) => (
          <section key={sport.id} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Image src={sportIcon(sport.name)} alt="" width={24} height={24} className="shrink-0" />
              <h3 className="font-display font-black text-2xl lg:text-[28px] uppercase text-white leading-none truncate">{sport.name}</h3>
              <Button
                size="icon"
                icon={<Pencil className="size-4" />}
                aria-label={`Rename ${sport.name}`}
                onClick={() => onRenameSport(sport)}
              className="size-8 shrink-0 bg-transparent hover:bg-white/10"
              />
            </div>

            {sport.teams.length === 0 ? (
              <p className="rounded-[8px] p-6 text-sm text-white/60 bg-white/5 border border-white/10">No teams in this activity yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {sport.teams.map((team) => {
                  const logo = team.logoUrl || crest;
                  return (
                    <li key={team.id} className="flex items-center gap-4 rounded-[8px] p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      {/* Clickable row (not an action button): opens the team's details. */}
                      <Link href={routes.ui.teamDetails(team.id)} className="flex-1 min-w-0 flex items-center gap-4">
                        <Image
                          src={logo}
                          alt=""
                          width={48}
                          height={48}
                          // The org logo is a remote (presigned) URL with no configured image host.
                          unoptimized={logo.startsWith("http")}
                          className="size-12 shrink-0 rounded-full object-cover bg-black/40 p-0.5 border-2"
                          style={{ borderColor: sportRing(sport.name) }}
                        />
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-base font-semibold text-white break-words">{team.name}</span>
                          {team.gender && <span className="text-xs text-white/50">{team.gender}</span>}
                        </div>
                      </Link>
                      {team.level && (
                        <span className="shrink-0 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white whitespace-nowrap">{team.level}</span>
                      )}
                      <RowActionsMenu
                        ariaLabel={`Actions for ${team.name}`}
                        items={[
                          { label: "View Team", onSelect: () => router.push(routes.ui.teamDetails(team.id)) },
                          { label: "Edit Team", onSelect: () => onEditTeam(team, sport) },
                        ]}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))
      )}
    </div>
  );
}
