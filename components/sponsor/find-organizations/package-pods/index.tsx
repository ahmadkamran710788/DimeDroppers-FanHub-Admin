"use client";

import { Fragment, useId, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import PackagePod from "@/components/sponsor/find-organizations/package-pods/package-pod";
import { openSplits, type OwnGames } from "@/components/sponsor/package-splits/data";
import type { PackageSplit, PackageTier, SponsorPackage } from "@/utils/types/sponsor-packages";

interface PackagePodsProps {
  packages: SponsorPackage[];
  // One card for a part of the opened package (null: the whole package, when it has no parts).
  renderCard: (pkg: SponsorPackage, split: PackageSplit | null) => ReactNode;
  // Under a pod's toggle: the organisation's max price field.
  podExtra?: (pkg: SponsorPackage) => ReactNode;
  // The sponsor's own parts of a package, so its pod says Active or Payment pending.
  own?: (tier: PackageTier) => { active: OwnGames; pending: OwnGames };
  // What a package without parts is priced for: "2 games".
  basisCount?: string;
  // The grid columns of the pods and of the cards.
  podsClassName?: string;
  cardsClassName?: string;
  // The open package, when the caller keeps it, so it stays open while the caller reloads the packages (after an
  // activation). undefined: the first one; null: closed.
  openTier?: PackageTier | null;
  onOpenTierChange?: (tier: PackageTier | null) => void;
}

// An organization's packages as pods (Community Partner, Fan Engagement Partner, Presenting Partner), and under them
// a whole card for each part of the opened one, in date order: open, sold and the sponsor's own. One opens at a time,
// the first to start with; clicking the open pod closes it. Used by the sponsor's panel and the organisation's preview.
export default function PackagePods({
  packages,
  renderCard,
  podExtra,
  own,
  basisCount,
  podsClassName,
  cardsClassName,
  openTier: keptTier,
  onOpenTierChange,
}: PackagePodsProps) {
  // undefined: the first package (nothing picked yet); null: closed by the sponsor. A package that left the list (a
  // new budget or event) falls back to the first.
  const [localTier, setLocalTier] = useState<PackageTier | null | undefined>(undefined);
  const openTier = onOpenTierChange ? keptTier : localTier;
  const setOpenTier = onOpenTierChange ?? setLocalTier;
  const cardsId = useId();
  const opened = openTier === null ? null : (packages.find((p) => p.tier === openTier) ?? packages[0] ?? null);
  const splits = opened?.splits ?? [];
  const cards: (PackageSplit | null)[] = splits.length > 0 ? splits : [null];

  return (
    <div className="flex flex-col gap-4">
      <div className={cn("grid gap-3", podsClassName)}>
        {packages.map((p) => (
          <PackagePod
            key={p.tier}
            pkg={p}
            open={p.tier === opened?.tier}
            onToggle={() => setOpenTier(p.tier === opened?.tier ? null : p.tier)}
            cardsId={cardsId}
            own={own?.(p.tier)}
            basisCount={basisCount}
          >
            {podExtra?.(p)}
          </PackagePod>
        ))}
      </div>

      {opened && (
        <div id={cardsId} role="region" aria-label={opened.name} className="flex flex-col gap-3">
          <div className="text-xs font-bold tracking-[1.2px] text-[#c4c4c4] uppercase">
            {splits.length > 1
              ? `${opened.name} · ${openSplits(opened).length} of ${splits.length} open`
              : opened.name}
          </div>
          <div className={cn("grid gap-3", cardsClassName)}>
            {cards.map((split) => (
              <Fragment key={split ? (split.splitKey ?? `taken-${split.number}`) : "whole"}>
                {renderCard(opened, split)}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
