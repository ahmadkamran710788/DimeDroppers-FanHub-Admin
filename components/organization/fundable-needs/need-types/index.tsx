"use client";

import Button from "@/components/common/button";
import { NEED_TYPES } from "@/components/organization/fundable-needs/data";
import { cn } from "@/utils/cn";
import { plural } from "@/utils/helper";
import type { FundableNeed, NeedType } from "@/utils/types/fundable-need";

interface NeedTypesProps {
  needs: FundableNeed[];
  // The type the list is filtered to; "all" for every type.
  value: NeedType | "all";
  onChange: (value: NeedType | "all") => void;
}

// The ten types of need with how many the organisation has of each; picking one filters the list
// below, picking it again (or "All types") shows every type.
export default function NeedTypes({ needs, value, onChange }: NeedTypesProps) {
  const all = value === "all";
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display font-black text-xl lg:text-[28px] uppercase text-white leading-tight">
          Types of fundable needs
        </h3>
        <Button
          size="sm"
          label="All types"
          aria-pressed={all}
          onClick={() => onChange("all")}
          className={cn(
            "h-10 px-4 rounded-lg text-sm outline outline-1 backdrop-blur-none",
            all ? "bg-white/20 outline-white/40 text-white" : "bg-white/5 outline-white/10 text-white/60 hover:bg-white/10"
          )}
        />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {NEED_TYPES.map(({ name, description, icon: Icon }) => {
          const count = needs.filter((n) => n.type === name).length;
          const on = value === name;
          return (
            // A clickable card (filters the list to this type), not an action button.
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? "all" : name)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-[8px] border p-4 text-left text-white backdrop-blur-[24px] transition-colors",
                on ? "bg-white/[0.12] border-[#638BFE]" : "bg-surface-06 border-transparent hover:bg-white/[0.09]"
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-[8px] bg-white/10">
                  <Icon className="size-5 text-[#FF7AD6]" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    count ? "bg-[#638BFE]/25 text-white" : "bg-white/10 text-white/60"
                  )}
                >
                  {count ? plural(count, "need") : "None yet"}
                </span>
              </span>
              <span className="text-[15px] font-semibold">{name}</span>
              <span className="text-[13px] leading-[1.45] text-white/60">{description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
