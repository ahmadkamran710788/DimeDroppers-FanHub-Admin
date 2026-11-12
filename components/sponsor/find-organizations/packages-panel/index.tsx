"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import ConfirmModal from "@/components/common/confirm-modal";
import Loader from "@/components/common/loader";
import { CARD } from "@/components/sponsor/styles";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import GamesBreakdown, { basisCount, priceBasisText } from "@/components/sponsor/find-organizations/games-breakdown";
import PackageCard from "@/components/sponsor/find-organizations/package-card";
import PhysicalAddOns from "@/components/sponsor/find-organizations/physical-add-ons";
import StoreChecklist from "@/components/sponsor/store-checklist";
import CheckoutPaymentModal from "@/components/sponsor/checkout/checkout-payment-modal";
import PaymentChoice from "@/components/sponsor/checkout/payment-choice";
import { toastOutcome, type CheckoutOutcome } from "@/components/sponsor/checkout/settle-checkout";
import { useCheckout } from "@/components/sponsor/checkout/use-checkout";
import { nearText, type EventFilters } from "@/components/sponsor/find-organizations/data";
import {
  activeActivations,
  formatCents,
  sponsorRequest,
  toQuery,
  type ActiveActivations,
} from "@/components/sponsor/sponsor-api";
import { cartItemKey, useSponsorCart } from "@/context/sponsor-cart";
import { backendFetch } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import type {
  ActivatePackageRequest,
  NearStores,
  PackageActivationResult,
  SponsorCartKind,
  SponsorEventOption,
  SponsorNearLocation,
  SponsorOrganizationListItem,
  SponsorPackages,
  UnavailableReason,
} from "@/utils/types/sponsor-packages";

const EVENT_REASONS: Record<UnavailableReason, string> = {
  NO_SLOTS: "No slots switched on",
  NO_TEAMS: "No teams yet",
  NO_GAMES: "No teams yet, so no games to count",
  NO_UPCOMING_GAMES: "No upcoming games",
  EVENT_ENDED: "Event ended",
  TOURNAMENT_INCOMPLETE: "Format not set yet",
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;

// A package or a physical asset, never both.
type Choice = Pick<ActivatePackageRequest, "tier" | "physicalAssetId">;

// A 409 because a store already has this package here (another tab, or a cart activation): the API names
// the store(s). Any other 409 is a price change.
const STORE_TAKEN = /already has this package or physical asset active here/i;

const NO_STORES: NearStores = { nearLocations: [], nearLocationCount: 0 };

// What the sponsor is about to activate (its payment and idempotency key are in useCheckout).
interface Pending {
  label: string;
  totalCents: number;
  currency: string;
  choice: Choice;
  // The stores near it, which ones already had it when the confirm opened, and the ones ticked.
  stores: SponsorNearLocation[];
  taken: Set<string>;
  picked: string[];
  // Near stores the API didn't list (it lists the nearest 10).
  moreStores: number;
}

// An activation whose new payment method is being entered in Stripe's form.
interface Paying {
  name: string;
  body: ActivatePackageRequest;
}

interface PackagesPanelProps {
  org: SponsorOrganizationListItem;
  // The search's stores, radius and genders: a tournament lists only the events its card counted.
  eventFilters?: EventFilters;
  // The search's sponsor budget in cents: only the packages within it are listed (physical assets aren't
  // counted against it); undefined for any price.
  budgetCents?: number;
  // The radius the search used, sent with the stores an activation is for; null without stores.
  radiusMiles: number | null;
  // After an activation, so the results can refresh their counts.
  onActivated?: () => void;
}

// The selected organization's packages and physical assets, priced for it (teams) or for one of its
// events (games). A tournament picks an event first. Each one is activated on its own or added to the
// cart to activate with others, for the brand's stores near it (ticked in the confirm). It is paid in the
// confirm (a saved method, or a new one in Stripe's form) and goes live once paid.
export default function PackagesPanel({ org, eventFilters, budgetCents, radiusMiles, onActivated }: PackagesPanelProps) {
  const isTournament = org.organizationType === "TOURNAMENT";
  const cart = useSponsorCart();
  const eventQuery = toQuery({ ...eventFilters });
  const [events, setEvents] = useState<{ orgId: string; items: SponsorEventOption[]; error?: string } | null>(null);
  const [eventId, setEventId] = useState("");
  const [loaded, setLoaded] = useState<{ key: string; view?: SponsorPackages; error?: string } | null>(null);
  // Bumped to refetch the packages (after a 409 or an activation).
  const [reloads, setReloads] = useState(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const pay = useCheckout();
  const [paying, setPaying] = useState<Paying | null>(null);
  // What the sponsor already has active here (cart item key → its stores).
  const [activeLoaded, setActiveLoaded] = useState<{ key: string; active: ActiveActivations } | null>(null);

  // A tournament's events.
  useEffect(() => {
    if (!isTournament) return;
    let cancelled = false;
    backendEvents(org.id, eventQuery).then((items) => {
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
  }, [isTournament, org.id, eventQuery]);

  const eventsForOrg = events?.orgId === org.id ? events : null;
  const packagesKey = isTournament
    ? eventId
      ? `${org.id}|${eventId}|${budgetCents}|${reloads}`
      : ""
    : `${org.id}|${budgetCents}|${reloads}`;

  useEffect(() => {
    if (!packagesKey) return;
    let cancelled = false;
    sponsorRequest<SponsorPackages>("GET", routes.api.sponsorOrgPackages(org.id), {
      params: { eventId: isTournament ? eventId : undefined, budgetCents },
    }).then((r) => {
      if (!cancelled) setLoaded({ key: packagesKey, view: r.view, error: r.view ? undefined : r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [packagesKey, org.id, isTournament, eventId, budgetCents]);

  const packages = loaded?.key === packagesKey ? loaded : null;
  const view = packages?.view;

  const activeKey = `${org.id}|${reloads}`;
  useEffect(() => {
    let cancelled = false;
    activeActivations(org.id).then((active) => {
      // If it can't be checked, the sponsor isn't blocked.
      if (!cancelled) setActiveLoaded({ key: activeKey, active: active ?? new Map() });
    });
    return () => {
      cancelled = true;
    };
  }, [activeKey, org.id]);

  const activeMap = activeLoaded?.key === activeKey ? activeLoaded.active : null;

  // The brand's stores near what is being activated: near the organization, or near the picked event of a
  // tournament (its nearest venue). None without a search near stores.
  const near: NearStores =
    radiusMiles === null
      ? NO_STORES
      : isTournament
        ? (eventsForOrg?.items.find((e) => e.id === eventId) ?? NO_STORES)
        : org;
  const nearStores = near.nearLocations;

  // The body of one activation (alone or as a cart item): this organization, the event for a
  // tournament, the package or physical asset, at the price shown, for the stores given (with the radius
  // they were found within).
  const target = (choice: Choice, totalCents: number, storeIds: string[] = []): ActivatePackageRequest => ({
    schoolId: org.id,
    ...(isTournament && { eventId }),
    ...choice,
    expectedTotalCents: totalCents,
    ...(storeIds.length > 0 && radiusMiles !== null && { sponsorLocationIds: storeIds, radiusMiles }),
  });

  // The stores this package or asset is already active for here; undefined when it isn't active.
  const takenFor = (choice: Choice) => activeMap?.get(cartItemKey(target(choice, 0)));

  // Active, with no store left to add it for: one disabled "Active".
  const isActive = (choice: Choice) => {
    const taken = takenFor(choice);
    return !!taken && (nearStores.length === 0 || nearStores.every((s) => taken.has(s.id)));
  };

  // Active, but still open for some of the near stores.
  const activeNote = (choice: Choice) => {
    const taken = takenFor(choice);
    if (!taken || isActive(choice)) return undefined;
    const covered = nearStores.filter((s) => taken.has(s.id)).length;
    return covered
      ? `Active for ${covered} of ${nearStores.length} stores`
      : "Already active here; you can add it for these stores";
  };

  // The near stores that don't have it yet.
  const freeStores = (choice: Choice) => {
    const taken = takenFor(choice);
    return nearStores.filter((s) => !taken?.has(s.id));
  };

  const ask = (label: string, totalCents: number, currency: string, choice: Choice) => {
    const taken = takenFor(choice) ?? new Set<string>();
    setPending({
      label,
      totalCents,
      currency,
      choice,
      stores: nearStores,
      taken,
      picked: freeStores(choice).map((s) => s.id),
      moreStores: near.nearLocationCount - nearStores.length,
    });
    // Fresh saved methods and a new idempotency key: a retry of the same click never pays twice.
    pay.start();
  };

  // The stores the open confirm is for: once the active list is reloaded (after a 409), a store that got
  // the package meanwhile is shown as taken and left out.
  const pendingTaken = pending ? (takenFor(pending.choice) ?? pending.taken) : new Set<string>();
  const pendingPicked = pending ? pending.picked.filter((id) => !pendingTaken.has(id)) : [];
  // Near stores to choose from: an activation is then for at least one of them, never for none.
  const pendingHasStores = !!pending && pending.stores.length > 0 && radiusMiles !== null;
  const needsStore = pendingHasStores && pendingPicked.length === 0;

  const addToCart = (kind: SponsorCartKind, name: string, totalCents: number, currency: string, choice: Choice) => {
    // Every near store that doesn't have it yet; the cart can untick some before checkout.
    const stores = freeStores(choice);
    const error = cart.add({
      item: target(choice, totalCents, stores.map((s) => s.id)),
      kind,
      name,
      organization: { id: org.id, name: org.name, logoUrl: org.logoUrl },
      event: view?.event ? { id: view.event.id, name: view.event.name } : null,
      totalCents,
      currency,
      ...(stores.length > 0 && radiusMiles !== null && { stores: { near: stores, radiusMiles } }),
    });
    if (error) toast.error(error);
    else toast.success(`${name} added to your cart`);
  };

  // A $0 activation is live at once, with nothing to pay.
  const pendingIsPaid = !!pending && pending.totalCents > 0;

  // How the payment ended (not Stripe's form): tells the sponsor, and once it is live or clearing, takes its
  // copy out of the cart (it would be activated a second time) and refreshes what's active. false keeps the
  // confirm open, to pay another way.
  const finish = (outcome: CheckoutOutcome, name: string, body: ActivatePackageRequest) => {
    toastOutcome(outcome, `${name} activated for ${org.name ?? "the organization"}`);
    if (outcome.kind === "failed") return false;
    if (outcome.kind === "paid" || outcome.kind === "processing") cart.remove(cartItemKey(body));
    setReloads((n) => n + 1);
    onActivated?.();
    return true;
  };

  const activate = async () => {
    if (!pending || needsStore) return false;
    if (pendingIsPaid && !pay.choice) return false;
    const body = target(pending.choice, pending.totalCents, pendingPicked);
    const r = await sponsorRequest<PackageActivationResult>("POST", routes.api.sponsorActivations, {
      body: pendingIsPaid ? { ...body, ...pay.choice } : body,
      headers: { "Idempotency-Key": pay.key },
    });
    if (r.view) {
      const outcome = await pay.settle(r.view.checkout);
      if (outcome.kind === "needs-form") {
        // The confirm closes; Stripe's form opens for the new method.
        setPaying({ name: r.view.packageName, body });
        return true;
      }
      return finish(outcome, r.view.packageName, body);
    }
    toast.error(r.message ?? "Couldn't activate, please try again.");
    // A declined payment (Stripe's own sentence) or a method that can't pay: nothing was charged, and the
    // confirm stays open to pay another way, with a new key (the same one would answer this failure again).
    if (r.status === 400) {
      pay.renewKey();
      return false;
    }
    if (r.status !== 409) return false;
    // A store that got it meanwhile: reload what's active, and keep the confirm open with that store taken.
    // Any other 409 is a price change: reload and close, so the new price shows before asking again.
    setReloads((n) => n + 1);
    return !STORE_TAKEN.test(r.message ?? "");
  };

  return (
    <section
      aria-label="Packages"
      className={cn(CARD, "flex-[1.3_1_460px] min-w-0 rounded-[8px] p-4 lg:p-[26px] flex flex-col gap-[18px]")}
    >
      <div className="flex items-center gap-[14px]">
        <OrgMonogram logoUrl={org.logoUrl} size="md" />
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
                  {e.nearLocations.length > 0 && (
                    <span className="text-[13px] text-[#c9b8ff]">{`Near ${nearText(e)}`}</span>
                  )}
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
      ) : !packages || !activeMap ? (
        <Loader />
      ) : !view ? (
        <p className="text-sm text-[#a8a8a8]">{packages.error ?? "Packages are not available yet."}</p>
      ) : (
        <>
          <p className="text-[13px] text-[#a8a8a8]">{priceBasisText(view.priceBasis)}</p>
          <GamesBreakdown priceBasis={view.priceBasis} />
          {view.packages.length === 0 ? (
            <p className="text-sm text-[#a8a8a8]">
              {budgetCents ? "No packages within your sponsor budget." : "Packages are not available yet."}
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-3">
              {view.packages.map((p) => (
                <PackageCard
                  key={p.tier}
                  pkg={p}
                  onActivate={() => ask(`the ${p.name} package`, p.totalCents, p.currency, { tier: p.tier })}
                  onAddToCart={() => addToCart("PACKAGE", p.name, p.totalCents, p.currency, { tier: p.tier })}
                  inCart={cart.has(target({ tier: p.tier }, p.totalCents))}
                  active={isActive({ tier: p.tier })}
                  activeNote={activeNote({ tier: p.tier })}
                  basisCount={basisCount(view.priceBasis)}
                />
              ))}
            </div>
          )}
          <PhysicalAddOns
            orgName={org.name ?? "Organization"}
            physicalAssets={view.physicalAssets}
            onActivate={(x) => ask(x.name, x.totalCents, x.currency, { physicalAssetId: x.activationId })}
            onAddToCart={(x) =>
              addToCart("PHYSICAL_ASSET", x.name, x.totalCents, x.currency, { physicalAssetId: x.activationId })
            }
            isInCart={(x) => cart.has(target({ physicalAssetId: x.activationId }, x.totalCents))}
            isActive={(x) => isActive({ physicalAssetId: x.activationId })}
            activeNote={(x) => activeNote({ physicalAssetId: x.activationId })}
          />
        </>
      )}

      <ConfirmModal
        isOpen={!!pending}
        onClose={() => setPending(null)}
        title="Activate"
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        message={
          !pending
            ? ""
            : pendingIsPaid
              ? `Activate ${pending.label} with ${org.name ?? "this organization"} for ${formatCents(pending.totalCents, pending.currency)}? It goes live once paid.`
              : `Activate ${pending.label} with ${org.name ?? "this organization"}? It's free and starts right away.`
        }
        confirmLabel={pending && pendingIsPaid ? `Pay ${formatCents(pending.totalCents, pending.currency)}` : "Activate"}
        busyLabel={pendingIsPaid ? "Paying…" : "Activating…"}
        onConfirm={activate}
        confirmDisabled={needsStore || (pendingIsPaid && !pay.choice)}
      >
        {pending && pendingHasStores && radiusMiles !== null && (
          <StoreChecklist
            tone="light"
            stores={pending.stores}
            picked={pendingPicked}
            taken={pendingTaken}
            radiusMiles={radiusMiles}
            moreCount={pending.moreStores}
            onChange={(picked) => setPending((prev) => prev && { ...prev, picked })}
          />
        )}
        {pendingIsPaid && <PaymentChoice checkout={pay} />}
      </ConfirmModal>

      <CheckoutPaymentModal
        checkout={pay.formCheckout}
        summary={paying ? `${paying.name} with ${org.name ?? "this organization"}` : ""}
        returnPath={routes.ui.sponsor.mySponsorshipsPaymentReturn}
        closeLabel="Cancel payment"
        onClose={() => {
          setPaying(null);
          pay.abandonForm().then(() => setReloads((n) => n + 1));
        }}
        onDone={(outcome) => {
          pay.closeForm();
          setPaying(null);
          if (!paying) return;
          // The form only reports once Stripe took the payment; a backend that still asks for it isn't done yet.
          const settled: CheckoutOutcome =
            outcome.kind === "needs-form" ? { kind: "pending", checkout: outcome.checkout } : outcome;
          finish(settled, paying.name, paying.body);
        }}
      />
    </section>
  );
}

// GET /organizations/:id/events answers the events as the whole `data` list.
async function backendEvents(orgId: string, query: string): Promise<SponsorEventOption[] | null> {
  try {
    const res = await backendFetch(`${routes.api.sponsorOrgEvents(orgId)}${query}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return Array.isArray(json?.data) ? (json.data as SponsorEventOption[]) : null;
  } catch {
    return null;
  }
}
