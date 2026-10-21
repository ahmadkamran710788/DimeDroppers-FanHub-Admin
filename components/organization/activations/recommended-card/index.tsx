"use client";

import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import type { FormSlot } from "@/components/organization/activations/helpers";
import type { ActivationCategory } from "@/utils/types/activations";

export interface RecommendedEntry {
  category: ActivationCategory;
  slot: FormSlot;
}

interface RecommendedCardProps {
  // The recommended slots of every column.
  entries: RecommendedEntry[];
  organizationTypeLabel: string;
  onToggle: (entry: RecommendedEntry) => void;
  onApply: () => void;
}

// "Recommended for you": the catalog's recommended slots; Apply ticks all of them.
export default function RecommendedCard({ entries, organizationTypeLabel, onToggle, onApply }: RecommendedCardProps) {
  if (entries.length === 0) return null;
  const allSelected = entries.every((e) => e.slot.enabled);

  return (
    <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
      <div className="flex flex-col gap-2">
        <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">Recommended for you</h3>
        <p className="text-xs text-white">Our picks for a {organizationTypeLabel.toLowerCase()} Fan Hub.</p>
      </div>

      <div className="h-px bg-border-divider" />

      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          // A clickable row (checkbox + text), not an action button.
          <button
            key={entry.slot.rowKey}
            type="button"
            role="checkbox"
            aria-checked={entry.slot.enabled}
            onClick={() => onToggle(entry)}
            className="flex items-start gap-3 text-left"
          >
            <span className="mt-1">
              <Checkbox variant="white" checked={entry.slot.enabled} />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-base font-semibold text-white">{entry.slot.name}</span>
              {entry.slot.description && <span className="text-sm text-white/40">{entry.slot.description}</span>}
            </span>
          </button>
        ))}
      </div>

      <div className="h-px bg-border-divider" />

      <Button variant="ghost" label="Apply" fullWidth onClick={onApply} disabled={allSelected} />
    </div>
  );
}
