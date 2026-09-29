"use client";

import ActivationDonut from "@/components/setup/ActivationDonut";
import Button from "@/components/common/button";
import Checkbox from "@/components/common/checkbox";
import { ACTIVATION_BY_ID, CATEGORIES, RECOMMENDED_FOR_YOU } from "@/components/activations/data";
import { useActivationSelection } from "@/components/activations/useActivationSelection";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { ArrowRight, Equal } from "lucide-react";
import { useRouter } from "next/navigation";

interface Stat {
  label: string;
  value: string;
  caption: string;
}

function StatCard({ label, value, caption }: Stat) {
  return (
    <div className="rounded-[8px] p-6 flex flex-col gap-3 backdrop-blur-[48px] bg-surface-07">
      <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight min-h-[70px]">
        {label}
      </h3>
      <div className="flex flex-col gap-2">
        <div className="h-[60px] rounded-[8px] bg-[rgba(235,235,235,0.25)] backdrop-blur-[48px] flex items-center justify-center">
          <span className="font-display font-black text-[28px] text-white leading-none">{value}</span>
        </div>
        <span className="text-xs text-white/80">{caption}</span>
      </div>
    </div>
  );
}

const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 1000) / 10}%` : "0%");

export default function ActivationsPage() {
  const router = useRouter();
  const {
    selected,
    urls,
    setUrl,
    saving,
    order,
    draggingId,
    toggle,
    selectAll,
    clearAll,
    applyRecommended,
    saveFeatureLinks,
    startDrag,
    endDrag,
    handleDrop,
    total,
    counts,
  } = useActivationSelection();

  // Active = selected with a link saved/entered; Draft = selected but still missing its link.
  const active = [...selected].filter((id) => urls[id]?.trim()).length;
  const draft = total - active;
  // Scheduled / Completed have no backend source yet — shown as "—" until an endpoint exists.
  const stats: Stat[] = [
    { label: "Total Activations", value: String(total), caption: "All Time" },
    { label: "Active", value: String(active), caption: `${pct(active, total)} of Total` },
    { label: "Draft", value: String(draft), caption: `${pct(draft, total)} of Total` },
    { label: "Scheduled", value: "—", caption: "All Time" },
    { label: "Completed", value: "—", caption: "This Month" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
          Activations
        </h2>
        <p className="text-base text-white/80">
          Select the fan experience and features you want to offer in your Fan Hub.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-10">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* 4-column row: 3 category cards + right rail */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        {CATEGORIES.map((cat) => {
          const ids = cat.activations.map((a) => a.id);
          const catSelected = ids.filter((id) => selected.has(id));
          const allSelected = catSelected.length === ids.length;
          return (
            <div
              key={cat.id}
              className="w-full lg:flex-1 min-w-0 rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px]"
              style={{ background: cat.color }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-2 min-w-0">
                  <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-white">{cat.description}</p>
                </div>
                <span className="w-16 h-16 rounded-[8px] bg-[rgba(0,0,0,0.4)] flex flex-col items-center justify-center shrink-0">
                  <span className="font-display font-black text-[28px] text-white leading-none">
                    {catSelected.length}
                  </span>
                  <span className="text-xs text-white leading-none">Selected</span>
                </span>
              </div>

              <div className="h-px bg-border-divider" />

              {/* Select All / Clear All */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => selectAll(ids)}
                  className="flex items-center gap-2 text-base font-normal text-white"
                >
                  <Checkbox
                    variant="white"
                    checked={allSelected}
                    indeterminate={!allSelected && catSelected.length > 0}
                  />
                  Select All ({ids.length})
                </button>
                <button
                  type="button"
                  onClick={() => clearAll(ids)}
                  className="text-base font-medium text-white hover:text-white/80 transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="h-px bg-border-divider" />

              {/* Activation list */}
              <div className="flex flex-col gap-6">
                {order[cat.id].map((id) => {
                  const activation = ACTIVATION_BY_ID[id];
                  const isSelected = selected.has(id);
                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={() => startDrag(cat.id, id)}
                      onDragEnd={endDrag}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(cat.id, id)}
                      className={cn(
                        "flex flex-col gap-2 rounded-[8px] transition-opacity",
                        draggingId === id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => toggle(id)}
                          className="flex items-start gap-3 flex-1 text-left min-w-0"
                        >
                          <span className="mt-1">
                            <Checkbox variant="white" checked={isSelected} />
                          </span>
                          <span className="flex flex-col gap-1 min-w-0">
                            <span className="text-base font-semibold text-white">{activation.title}</span>
                            <span className="text-sm text-white/40">{activation.description}</span>
                            {activation.recommended && (
                              <span className="self-start mt-1 text-xs text-white bg-[rgba(0,0,0,0.5)] px-2 py-1 rounded-[70px] backdrop-blur-[104px] leading-none">
                                Recommended
                              </span>
                            )}
                          </span>
                        </button>
                        <span className="cursor-grab active:cursor-grabbing shrink-0">
                          <Equal className="w-5 h-5 text-white opacity-60" />
                        </span>
                      </div>
                      {isSelected && (
                        <input
                          type="url"
                          inputMode="url"
                          placeholder="https://…"
                          value={urls[id] ?? ""}
                          onChange={(e) => setUrl(id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          draggable
                          onDragStart={(e) => e.preventDefault()}
                          className="ml-7 h-10 rounded-[8px] px-3 bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.2)] text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-steel-blue"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="h-px bg-border-divider" />

              {/* Footer count */}
              <p className="text-base text-white text-center">
                {catSelected.length} of {ids.length} selected
              </p>
            </div>
          );
        })}

        {/* Right rail */}
        <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-10">
          {/* Activation Summary */}
          <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
            <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">
              Activation Summary
            </h3>
            <div className="h-px bg-border-divider" />
            <div className="flex justify-center">
              <ActivationDonut counts={counts} total={total} filled />
            </div>
            <div className="flex flex-col gap-3">
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ background: cat.accent }} />
                  <span className="text-base font-semibold text-white">{cat.label}</span>
                </div>
              ))}
            </div>
            <div className="h-px bg-border-divider" />
            <div className="flex flex-col gap-1">
              <p className="text-2xl font-bold text-success leading-none">Great mix!</p>
              <p className="text-xs text-white">
                {total > 0
                  ? "You've selected a well-balanced set of activations."
                  : "Select activations to build your fan experience."}
              </p>
            </div>
          </div>

          {/* Recommended for you */}
          <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
            <div className="flex flex-col gap-2">
              <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">
                Recommended for you
              </h3>
              <p className="text-xs text-white">Based on schools like yours with similar programs.</p>
            </div>

            <div className="h-px bg-border-divider" />

            <div className="flex flex-col gap-4">
              {RECOMMENDED_FOR_YOU.map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => toggle(rec.id)}
                  className="flex items-start gap-3 text-left"
                >
                  <span className="mt-1">
                    <Checkbox variant="white" checked={selected.has(rec.id)} />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-base font-semibold text-white">{rec.title}</span>
                    <span className="text-sm text-white/40">{rec.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="h-px bg-border-divider" />

            <Button variant="ghost" label="Apply" fullWidth onClick={applyRecommended} />
          </div>
        </div>
      </div>

      {/* Footer action */}
      <div className="flex justify-end border-t border-border-divider pt-6">
        <Button
          variant="cta"
          label="Review & Publish"
          icon={<ArrowRight className="w-5 h-5" />}
          iconPosition="end"
          disabled={saving}
          onClick={async () => {
            if (await saveFeatureLinks()) router.push(routes.ui.setupWizard.reviewPublish);
          }}
        />
      </div>
    </div>
  );
}
