"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import { CARD } from "@/components/sponsor/styles";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import GamesBreakdown from "@/components/sponsor/find-organizations/games-breakdown";
import PackageCard from "@/components/sponsor/find-organizations/package-card";
import PhysicalAddOns from "@/components/sponsor/find-organizations/physical-add-ons";
import { formatCents, sponsorRequest } from "@/components/sponsor/sponsor-api";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type {
  ActivatePackageRequest,
  PackageActivation,
  SponsorEventOption,
  SponsorOrganizationListItem,
  SponsorPackages,
  UnavailableReason,
} from "@/utils/types/sponsor-packages";

const EVENT_REASONS: Record<UnavailableReason, string> = {
  NO_SLOTS: "No slots switched on",
  NO_TEAMS: "No teams yet",
  NO_GAMES: "No teams yet, so no games to count",
  EVENT_ENDED: "Event ended",
  TOURNAMENT_INCOMPLETE: "Format not set yet",
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;

// What the sponsor is about to activate, with the idempotency key made when the confirm opened.
interface Pending {
  label: string;
  totalCents: number;
  currency: string;
  body: ActivatePackageRequest;
  key: string;
}

interface PackagesPanelProps {
  org: SponsorOrganizationListItem;
  // After an activation, so the results can refresh their counts.
  onActivated?: () => void;
}

// The selected organization's packages and exclusivities, priced for it (teams) or for one of its
// events (games). A tournament picks an event first. Activating is final: no payment yet.
export default function PackagesPanel({ org, onActivated }: PackagesPanelProps) {
  const isTournament = org.organizationType === "TOURNAMENT";
  const [events, setEvents] = useState<{ orgId: string; items: SponsorEventOption[]; error?: string } | null>(null);
  const [eventId, setEventId] = useState("");
  const [loaded, setLoaded] = useState<{ key: string; view?: SponsorPackages; error?: string } | null>(null);
  // Bumped to refetch the packages (after a 409 or an activation).
  const [reloads, setReloads] = useState(0);
  const [pending, setPending] = useState<Pending | null>(null);

  // A tournament's events.
  useEffect(() => {
    if (!isTournament) return;
    let cancelled = false;
    backendEvents(org.id).then((items) => {
      if (cancelled) return;
      if (!items) {
        setEvents({ orgId: org.id, items: [], error: "Couldn't load this tournament's events." });
        return;
      }
      setEvents({ orgId: org.id, items });
      // Start on the first event that can be sponsored.
      setEventId(items.find((e) => e.isOffered)?.id ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [isTournament, org.id]);

  const eventsForOrg = events?.orgId === org.id ? events : null;
  const packagesKey = isTournament ? (eventId ? `${org.id}|${eventId}|${reloads}` : "") : `${org.id}|${reloads}`;

  useEffect(() => {
    if (!packagesKey) return;
    let cancelled = false;
    sponsorRequest<SponsorPackages>("GET", routes.api.sponsorOrgPackages(org.id), {
      params: isTournament ? { eventId } : undefined,
    }).then((r) => {
      if (!cancelled) setLoaded({ key: packagesKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [packagesKey, org.id, isTournament, eventId]);

  const packages = loaded?.key === packagesKey ? loaded : null;
  const view = packages?.view;

  const ask = (label: string, totalCents: number, currency: string, body: Omit<ActivatePackageRequest, "schoolId" | "eventId">) =>
    setPending({
      label,
      totalCents,
      currency,
      body: { schoolId: org.id, ...(isTournament && { eventId }), ...body, expectedTotalCents: totalCents },
      // One key per confirmation: a retry of the same click never makes a second activation.
      key: crypto.randomUUID(),
    });

  const activate = async () => {
    if (!pending) return false;
    const r = await sponsorRequest<PackageActivation>("POST", routes.api.sponsorActivations, {
      body: pending.body,
      headers: { "Idempotency-Key": pending.key },
    });
    if (r.view) {
      toast.success(`${r.view.packageName} activated for ${org.name ?? "the organization"}`);
      setReloads((n) => n + 1);
      onActivated?.();
      return true;
    }
    toast.error(r.message ?? "Couldn't activate, please try again.");
    // 409: the price changed; show the new one before asking again.
    if (r.status === 409) setReloads((n) => n + 1);
    return r.status === 409;
  };

  return (
    <section
      aria-label="Packages"
      className={cn(CARD, "flex-[1.3_1_460px] min-w-0 rounded-[8px] p-4 lg:p-[26px] flex flex-col gap-[18px]")}
    >
      <div className="flex items-center gap-[14px]">
        <OrgMonogram initials={org.initials} logoUrl={org.logoUrl} size="md" />
        <div className="min-w-0">
          <div className="text-[13px] tracking-[1px] text-[#a8a8a8] font-semibold">SPONSORSHIP PACKAGES</div>
          <h3 className="font-display font-extrabold text-2xl lg:text-[30px] uppercase leading-[1.05] break-words">
            {org.name ?? "Unnamed organization"}
          </h3>
        </div>
      </div>

      {/* A tournament: its events (only offered ones can be opened). */}
      {isTournament && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-bold tracking-[1.2px] text-[#c4c4c4]">EVENT</div>
          {!eventsForOrg ? (
            <Loader />
          ) : eventsForOrg.items.length === 0 ? (
            <p className="text-sm text-[#a8a8a8]">{eventsForOrg.error ?? "This tournament has no events selling packages yet."}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {eventsForOrg.items.map((e) => (
                // A whole clickable row, not an action button, so it stays a native button.
                <button
                  key={e.id}
                  type="button"
                  disabled={!e.isOffered}
                  aria-pressed={e.id === eventId}
                  onClick={() => setEventId(e.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-[10px] border flex flex-col gap-0.5 text-white",
                    e.id === eventId ? "bg-[#17151f] border-[#8b6dff]" : "bg-transparent border-[#222]",
                    e.isOffered ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                  )}
                >
                  <span className="text-[15px] font-semibold">{e.name?.trim() || "Untitled event"}</span>
                  <span className="text-[13px] text-[#a8a8a8]">
                    {[
                      fmtDate(e.startDate),
                      [e.city, e.state].filter(Boolean).join(", "),
                      `${e.teamCount} teams · ${e.divisionCount} divisions · ${e.games} games`,
                      e.tournamentFormatLabel,
                      e.unavailableReason && EVENT_REASONS[e.unavailableReason],
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isTournament && !eventId ? (
        eventsForOrg && eventsForOrg.items.length > 0 && (
          <p className="text-sm text-[#a8a8a8]">None of this tournament&apos;s events can be sponsored yet.</p>
        )
      ) : !packages ? (
        <Loader />
      ) : !view ? (
        <p className="text-sm text-[#a8a8a8]">{packages.error ?? "Packages are not available yet."}</p>
      ) : (
        <>
          <p className="text-[13px] text-[#a8a8a8]">
            {`Priced by ${view.priceBasis.basisLabel.toLowerCase()}: ${view.priceBasis.quantity}${
              view.priceBasis.tournamentFormatLabel ? ` · ${view.priceBasis.tournamentFormatLabel}` : ""
            }`}
          </p>
          <GamesBreakdown priceBasis={view.priceBasis} />
          {view.packages.length === 0 ? (
            <p className="text-sm text-[#a8a8a8]">Packages are not available yet.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-3">
              {view.packages.map((p) => (
                <PackageCard
                  key={p.tier}
                  pkg={p}
                  onActivate={() => ask(`the ${p.name} package`, p.totalCents, p.currency, { tier: p.tier })}
                />
              ))}
            </div>
          )}
          <PhysicalAddOns
            orgName={org.name ?? "Organization"}
            exclusivities={view.exclusivities}
            onActivate={(x) => ask(x.name, x.totalCents, x.currency, { exclusivityId: x.activationId })}
          />
        </>
      )}

      <ConfirmModal
        isOpen={!!pending}
        onClose={() => setPending(null)}
        title="Activate"
        message={
          pending
            ? `Activate ${pending.label} with ${org.name ?? "this organization"} for ${formatCents(pending.totalCents, pending.currency)}? It starts right away; there's no payment step yet.`
            : ""
        }
        confirmLabel="Activate"
        busyLabel="Activating…"
        onConfirm={activate}
      />
    </section>
  );
}

// GET /organizations/:id/events answers the events as the whole `data` list.
async function backendEvents(orgId: string): Promise<SponsorEventOption[] | null> {
  try {
    const res = await backendFetch(routes.api.sponsorOrgEvents(orgId), { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return Array.isArray(json?.data) ? (json.data as SponsorEventOption[]) : null;
  } catch {
    return null;
  }
}
