"use client";

import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import { categoryLook } from "@/components/organization/fundable-needs/data";
import { cn } from "@/utils/cn";
import type { NeedCategoryOption } from "@/utils/types/needs";

interface NeedTypesProps {
  // From GET /options; null while loading.
  categories: NeedCategoryOption[] | null;
  // The options didn't load: the tiles are left out (the list still works).
  failed: boolean;
  // The category code the list is filtered to; "" for every type.
  value: string;
  onChange: (code: string) => void;
}

// The kinds of need an organisation can post: only the ones switched on in the API (the others aren't
// shown). Picking one filters the list below, picking it again (or "All types") shows every type.
export default function NeedTypes({ categories, failed, value, onChange }: NeedTypesProps) {
  if (failed) return null;
  const all = value === "";
  const available = categories?.filter((c) => c.isEnabled) ?? null;
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
          onClick={() => onChange("")}
          className={cn(
            "h-10 px-4 rounded-lg text-sm outline outline-1 backdrop-blur-none",
            all ? "bg-white/20 outline-white/40 text-white" : "bg-white/5 outline-white/10 text-white/60 hover:bg-white/10"
          )}
        />
      </div>
      {!available ? (
        <Loader />
      ) : available.length === 0 ? (
        <p className="text-sm text-white/60">No types of need are available yet.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
          {available.map(({ code, name }) => {
            const { icon: Icon, description } = categoryLook(name);
            const on = value === code;
            return (
              // A clickable card (filters the list to this type), not an action button.
              <button
                key={code}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(on ? "" : code)}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-[8px] border p-4 text-left text-white isolate transition-colors",
                  on ? "bg-white/[0.12] border-[#638BFE]" : "bg-surface-06 border-transparent hover:bg-white/[0.09]"
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-[8px] bg-white/10">
                  <Icon className="size-5 text-[#FF7AD6]" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className="text-[15px] font-semibold">{name}</span>
                {description && <span className="text-[13px] leading-[1.45] text-white/60">{description}</span>}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
