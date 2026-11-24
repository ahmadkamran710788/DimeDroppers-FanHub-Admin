import { plural } from "@/utils/helper";
import type { CartSplit, PackageActivation, PackageSplit, SponsorPackage, SplitGame } from "@/utils/types/sponsor-packages";

// Package parts (FANHUB_SPONSOR_PACKAGE_SPLITS_FRONTEND.md): a package is priced by its upcoming games, and an
// organisation's max price cuts it into parts, each a run of games sold to one sponsor.

// "Nov 28" or "Nov 28, 2026", in the viewer's time zone (a game is a moment, not a calendar date).
const day = (iso: string, withYear: boolean) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(withYear && { year: "numeric" }) });

// "Nov 28 – Dec 18, 2026", "Dec 28, 2026 – Jan 4, 2027" or "Nov 28, 2026" for one day; null without dates.
export function dateRange(first: string | null, last: string | null): string | null {
  if (!first || !last) return first || last ? day((first ?? last) as string, true) : null;
  const from = new Date(first);
  const to = new Date(last);
  if (from.toDateString() === to.toDateString()) return day(first, true);
  return `${day(first, from.getFullYear() !== to.getFullYear())} – ${day(last, true)}`;
}

type SplitSpan = Pick<PackageSplit, "gameCount" | "firstGameAt" | "lastGameAt">;

// "8 games · Nov 28 – Dec 18, 2026".
export const splitSummary = (split: SplitSpan) =>
  [plural(split.gameCount, "game"), dateRange(split.firstGameAt, split.lastGameAt)].filter(Boolean).join(" · ");

// "8 games · Nov 28 – Dec 18, 2026" for an activation's games (in any order); null without any (a physical asset,
// or a package bought before parts).
export function gamesSummary(games: SplitGame[] | undefined) {
  if (!games?.length) return null;
  const times = games.flatMap((g) => (g.startsAt ? [g.startsAt] : [])).sort();
  return splitSummary({ gameCount: games.length, firstGameAt: times[0] ?? null, lastGameAt: times[times.length - 1] ?? null });
}

// "Sat, Nov 28, 7:00 PM": a game's day and time in the viewer's time zone; "Time to be set" without one.
export const gameTime = (game: SplitGame) =>
  game.startsAt
    ? new Date(game.startsAt).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Time to be set";

// The games a part of `games` games has with a max price, as the backend cuts them: as few parts as possible
// without one going over the max, the games shared as evenly as possible (the first parts take the extra one);
// one game per part when a game alone costs more; one part without a max. E.g. 15 games at $60, max $500: [8, 7].
export function previewParts(games: number, perGameCents: number, maxPriceCents: number | null): number[] {
  if (games <= 0) return [];
  if (!maxPriceCents || perGameCents <= 0) return [games];
  const perPart = Math.max(1, Math.floor(maxPriceCents / perGameCents));
  const count = Math.ceil(games / perPart);
  const base = Math.floor(games / count);
  const extra = games % count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

// The games of a package no sponsor has yet (its available parts), which a new max cuts again; sold parts keep
// their games.
export const unsoldGames = (splits: PackageSplit[]) =>
  splits.filter((s) => s.status === "AVAILABLE").reduce((n, s) => n + s.gameCount, 0);

// The package part a cart line is, as the cart shows it: its games and dates (parts aren't named or numbered).
export const cartSplitOf = (split: PackageSplit): CartSplit => ({
  gameCount: split.gameCount,
  firstGameAt: split.firstGameAt,
  lastGameAt: split.lastGameAt,
});

// The parts of a package a sponsor can buy now, in date order (an API from before parts sends none).
export const openSplits = (pkg: SponsorPackage) =>
  (pkg.splits ?? []).filter((s) => s.status === "AVAILABLE" && s.splitKey !== null);

// What a package pod shows as its price: the one price of its open parts, or the lowest with `from` when they differ;
// the whole package's price when it has no parts; null when every part is taken.
export function podPrice(pkg: SponsorPackage): { cents: number; from: boolean } | null {
  if ((pkg.splits ?? []).length === 0) return pkg.isAvailable ? { cents: pkg.totalCents, from: false } : null;
  const prices = openSplits(pkg).flatMap((s) => (s.totalCents === null ? [] : [s.totalCents]));
  if (prices.length === 0) return null;
  const lowest = Math.min(...prices);
  return { cents: lowest, from: prices.some((p) => p !== lowest) };
}

// The game ids of the sponsor's own package activations (active, or still being paid), and whether any of them is
// from before parts (no games: it holds the whole package until the backend fills its games in).
export interface OwnGames {
  ids: Set<string>;
  whole: boolean;
}

export const NO_OWN_GAMES: OwnGames = { ids: new Set(), whole: false };

export function ownGamesOf(activations: PackageActivation[]): OwnGames {
  const ids = new Set<string>();
  let whole = false;
  for (const a of activations) {
    if (a.kind !== "PACKAGE") continue;
    if (!a.games?.length) whole = true;
    for (const g of a.games ?? []) if (g.id) ids.add(g.id);
  }
  return { ids, whole };
}

// A taken part that is the sponsor's own: one of its games is in their activations (a part's games are held by one
// sponsor).
export const isOwnSplit = (split: PackageSplit, own: OwnGames) =>
  split.status === "TAKEN" && split.games.some((g) => g.id !== null && own.ids.has(g.id));

// The sponsor holds this package: a part of it, or the whole of it from before parts (it's taken with no parts).
export const holdsPackage = (pkg: SponsorPackage, own: OwnGames) => {
  const splits = pkg.splits ?? [];
  return splits.some((s) => isOwnSplit(s, own)) || (own.whole && splits.length === 0 && pkg.unavailableReason === "TAKEN");
};
