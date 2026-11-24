"use client";

import { useEffect, useState } from "react";
import FilterDropdown from "@/components/common/filter-dropdown";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import { CalendarDays } from "lucide-react";
import { orgKindOf, useAuth } from "@/context/auth";
import GamesBreakdown, { basisCount, priceBasisText } from "@/components/sponsor/find-organizations/games-breakdown";
import PackageCard from "@/components/sponsor/find-organizations/package-card";
import PhysicalAddOns from "@/components/sponsor/find-organizations/physical-add-ons";
import MaxPriceField from "@/components/organization/sponsors/package-splits/max-price-field";
import { maxPricesSchema } from "@/components/organization/sponsors/package-splits/schema";
import { usePackageSplits } from "@/components/organization/sponsors/package-splits/use-package-splits";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import { backendFetch } from "@/utils/api-call";
import { parseMoney } from "@/utils/helper";
import { routes } from "@/utils/routes";
import { validateAndSetErrors } from "@/utils/validation";
import type {
  PackageSplitSettings,
  PackageTier,
  SponsorEventOption,
  SponsorPackages,
  UnavailableReason,
} from "@/utils/types/sponsor-packages";

const EVENT_REASONS: Record<UnavailableReason, string> = {
  NO_SLOTS: "no slots switched on",
  NO_TEAMS: "no teams yet",
  NO_GAMES: "no upcoming games",
  NO_UPCOMING_GAMES: "no upcoming games",
  EVENT_ENDED: "ended",
  TOURNAMENT_INCOMPLETE: "format not set",
  TAKEN: "taken by a sponsor",
  FULL: "all sponsor spots taken",
};

// GET /org/sponsor-packages/events answers the events as the whole `data` list.
async function loadEvents(): Promise<SponsorEventOption[] | null> {
  try {
    const res = await backendFetch(routes.api.orgSponsorEvents, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return Array.isArray(json?.data) ? (json.data as SponsorEventOption[]) : null;
  } catch {
    return null;
  }
}

// A saved max as the field shows it: "500", "499.5"; empty for none.
const maxText = (cents: number | null) => (cents === null ? "" : String(cents / 100));

// The saved max of each package, as typed text.
const savedMaxes = (settings: PackageSplitSettings | null): Partial<Record<PackageTier, string>> =>
  Object.fromEntries((settings?.packages ?? []).map((p) => [p.tier, maxText(p.maxPriceCents)]));

// "What sponsors can buy": the organization's three packages and its physical assets, priced exactly as
// sponsors see them (GET /org/sponsor-packages/packages). A tournament picks one of its events first;
// an event it doesn't offer answers 404, shown as an empty state. Each package takes a max price per sponsor
// (GET / PUT /org/sponsor-packages/splits): its games are then cut into parts sold to one sponsor each.
export default function PackagesPreview() {
  const { org } = useAuth();
  const kind = orgKindOf(org);
  const isTournament = kind === "tournament";
  const [events, setEvents] = useState<SponsorEventOption[] | null>(null);
  const [eventId, setEventId] = useState("");
  const [loaded, setLoaded] = useState<{ key: string; view?: SponsorPackages; error?: string } | null>(null);
  // Bumped after the max prices are saved, so the packages show their new parts.
  const [reloads, setReloads] = useState(0);
  // The max prices being typed (by tier) for the scope they were typed in; the saved ones otherwise.
  const [drafts, setDrafts] = useState<{ key: string; values: Partial<Record<PackageTier, string>> } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isTournament) return;
    loadEvents().then((items) => {
      setEvents(items ?? []);
      // Start on the first event sponsors can buy, else the first one.
      const first = items?.find((e) => e.isOffered) ?? items?.[0];
      if (first) setEventId(first.id);
    });
  }, [isTournament]);

  // Nothing loads until the org type is known, and for a tournament until an event is picked.
  const key = kind === null ? "" : isTournament ? eventId : "school";
  const packagesKey = key ? `${key}|${reloads}` : "";
  useEffect(() => {
    if (!packagesKey) return;
    let cancelled = false;
    sponsorRequest<SponsorPackages>("GET", routes.api.orgSponsorPackages, {
      params: isTournament ? { eventId: key } : undefined,
    }).then((r) => {
      if (!cancelled) setLoaded({ key: packagesKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [packagesKey, key, isTournament]);

  const splits = usePackageSplits(key, isTournament ? eventId : undefined);
  const saved = savedMaxes(splits.view);
  const typed = drafts?.key === key ? drafts.values : {};
  const maxOf = (tier: PackageTier) => typed[tier] ?? saved[tier] ?? "";
  const changed = (splits.view?.packages ?? []).filter((p) => maxOf(p.tier).trim() !== (saved[p.tier] ?? ""));

  // The previous scope's packages stay up while the next ones load after a save, so the cards don't jump.
  const current = loaded && (loaded.key === packagesKey || loaded.key.startsWith(`${key}|`)) ? loaded : null;
  const view = current?.view;
  const event = events?.find((e) => e.id === eventId);

  function type(tier: PackageTier, text: string) {
    setDrafts({ key, values: { ...typed, [tier]: text } });
    if (errors[tier]) setErrors((prev) => ({ ...prev, [tier]: "" }));
  }

  function discard() {
    setDrafts(null);
    setErrors({});
  }

  async function saveMaxes() {
    const settings = splits.view;
    if (!settings || changed.length === 0) return;
    const values = Object.fromEntries(changed.map((p) => [p.tier, maxOf(p.tier)]));
    const { maxPriceCentsMin, maxPriceCentsMax } = settings.limits;
    const schema = maxPricesSchema(changed.map((p) => p.tier), maxPriceCentsMin, maxPriceCentsMax);
    if (!(await validateAndSetErrors(schema, values, setErrors))) return;
    const ok = await splits.save(
      changed.map((p) => {
        const text = maxOf(p.tier).trim();
        return { tier: p.tier, maxPriceCents: text ? Math.round(parseMoney(text) * 100) : null };
      })
    );
    if (!ok) return;
    setDrafts(null);
    setReloads((n) => n + 1);
  }

  return (
    <section className="rounded-[8px] p-6 flex flex-col gap-6 isolate bg-surface-06 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-display font-extrabold text-2xl uppercase text-white leading-none">What sponsors can buy</h3>
          <p className="text-sm text-white/70">
            Your packages and physical assets, priced as sponsors see them. Set a max price per sponsor to sell a
            package in parts, each a run of games for one sponsor.
          </p>
        </div>
        {isTournament && events && events.length > 0 && (
          <FilterDropdown
            label="Select event"
            icon={<CalendarDays className="w-5 h-5" strokeWidth={1.5} />}
            options={events.map((e) => ({
              label: `${e.name?.trim() || "Untitled event"}${e.isOffered ? "" : ` (${e.unavailableReason ? EVENT_REASONS[e.unavailableReason] : "not offered"})`}`,
              value: e.id,
            }))}
            value={eventId}
            onChange={(id) => id && setEventId(id)}
            clearable={false}
            align="right"
          />
        )}
      </div>

      {isTournament && events?.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/60">
          None of your events sell sponsor packages yet. Set an event&apos;s format in Inventory first.
        </p>
      ) : !current ? (
        <Loader />
      ) : !view ? (
        <p className="py-8 text-center text-sm text-white/60">
          {isTournament && event && !event.isOffered
            ? `Sponsors can't buy packages for this event yet: ${event.unavailableReason ? EVENT_REASONS[event.unavailableReason] : "it isn't offered"}.`
            : (current.error ?? "Packages are not available yet.")}
        </p>
      ) : (
        <>
          <p className="text-sm text-white/70">{priceBasisText(view.priceBasis)}</p>
          <GamesBreakdown priceBasis={view.priceBasis} />
          {view.packages.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/60">Packages are not available yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3 text-white">
                {view.packages.map((p) => {
                  const setting = splits.view?.packages.find((s) => s.tier === p.tier);
                  return (
                    <PackageCard key={p.tier} pkg={p} showPlacementValues basisCount={basisCount(view.priceBasis)}>
                      {setting && splits.view && (
                        <MaxPriceField
                          setting={setting}
                          currency={splits.view.currency}
                          value={maxOf(p.tier)}
                          onChange={(text) => type(p.tier, text)}
                          error={errors[p.tier]}
                          disabled={splits.saving}
                        />
                      )}
                    </PackageCard>
                  );
                })}
              </div>
              {splits.view ? (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {changed.length > 0 && (
                    <span className="text-sm text-white/70">{`${changed.length} max price${changed.length === 1 ? "" : "s"} not saved`}</span>
                  )}
                  {changed.length > 0 && (
                    <Button variant="secondary" label="Discard" onClick={discard} disabled={splits.saving} />

                  )}
                  <Button
                    variant="cta"
                    label={splits.saving ? "Saving…" : "Save max prices"}
                    onClick={saveMaxes}
                    disabled={changed.length === 0 || splits.saving}
                  />
                </div>
              ) : (
                splits.error && <p className="text-sm text-white/60">{`Max prices can't be set right now: ${splits.error}`}</p>
              )}
            </>
          )}
          <div className="text-white">
            <PhysicalAddOns orgName={view.organization.name ?? "Your organization"} physicalAssets={view.physicalAssets} />
          </div>
        </>
      )}
    </section>
  );
}
