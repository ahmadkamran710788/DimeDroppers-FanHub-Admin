"use client";

import { DollarSign } from "lucide-react";
import Input from "@/components/common/input";
import { formatCents } from "@/components/sponsor/sponsor-api";
import { previewParts, unsoldGames } from "@/components/sponsor/package-splits/data";
import { parseMoney, plural, typedMoney } from "@/utils/helper";
import type { PackageSplitSetting } from "@/utils/types/sponsor-packages";

interface MaxPriceFieldProps {
  setting: PackageSplitSetting;
  currency: string;
  // The max typed in dollars; empty for no max.
  value: string;
  onChange: (text: string) => void;
  error?: string;
  disabled?: boolean;
}

// A package's "Max price per sponsor" on the organisation's preview: the price of one game, and the parts the typed
// max cuts the unsold games into, worked out as the backend does (sold parts keep their games). Saved with the
// preview's Save.
export default function MaxPriceField({ setting, currency, value, onChange, error, disabled }: MaxPriceFieldProps) {
  const unsold = unsoldGames(setting.splits);
  const amount = parseMoney(value);
  const maxCents = value.trim() && Number.isFinite(amount) ? Math.round(amount * 100) : null;
  const sizes = previewParts(unsold, setting.perGameCents, maxCents);
  const price = (games: number) => formatCents(games * setting.perGameCents, currency);

  function partsText() {
    if (setting.perGameCents <= 0) return "Switch on placements in this package to price it.";
    if (unsold === 0) return "No unsold games. A max applies to games added later.";
    if (sizes.length <= 1) return `One part: ${plural(unsold, "game")}, ${price(unsold)}`;
    // [8, 7] → "8 games ($480) and 7 games ($420)"; [1 × 15] → "15 × 1 game ($60)".
    const groups = [...new Set(sizes)].map((size) => ({ size, count: sizes.filter((s) => s === size).length }));
    const text = groups
      .map((g) => `${g.count > 1 ? `${g.count} × ` : ""}${plural(g.size, "game")} (${price(g.size)})`)
      .join(" and ");
    return `${sizes.length} parts: ${text}`;
  }

  return (
    <div className="rounded-[10px] border border-[#2a2a2a] bg-[#141414] p-3 flex flex-col gap-2">
      <Input
        variant="dark"
        label="Max price per sponsor"
        labelClassName="text-xs font-semibold text-white/80"
        name={`max-price-${setting.tier}`}
        inputMode="decimal"
        placeholder="No max"
        icon={<DollarSign className="w-4 h-4" />}
        value={value}
        onChange={(e) => {
          const typed = typedMoney(e.target.value);
          if (typed !== null) onChange(typed);
        }}
        error={error}
        disabled={disabled}
        inputClassName="h-10 text-sm pr-3 pl-10"
      />
      <p className="text-xs text-[#a8a8a8]">
        {`${formatCents(setting.perGameCents, currency)} per game · ${plural(unsold, "unsold game")}`}
        {setting.takenSplitCount > 0 &&
          ` · ${plural(setting.takenSplitCount, "sold part")} ${setting.takenSplitCount === 1 ? "keeps its" : "keep their"} games`}
      </p>
      <p className="text-xs text-[#d4d4d8]">{partsText()}</p>
    </div>
  );
}
