"use client";

import ActivationDonut from "@/components/setup/ActivationDonut";
import Checkbox from "@/components/common/Checkbox";
import StepIndicator from "@/components/common/StepIndicator";
import WizardFooter from "@/components/common/WizardFooter";
import { ACTIVATION_BY_ID, CATEGORIES, RECOMMENDED_FOR_YOU } from "@/components/activations/data";
import { useActivationSelection } from "@/components/activations/useActivationSelection";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChooseActivationsPage() {
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

  return (
    <div className="flex flex-col gap-6 pb-24">
      <StepIndicator currentStep={2} />

      <div className="flex flex-col gap-2 -mt-2">
        <h2 className="font-display font-black text-[32px] sm:text-[40px] lg:text-[56px] uppercase text-white leading-none">
          Choose Activations
        </h2>
        <p className="text-base text-white/80">
          Select the fan experience and features you want to offer in your Fan Hub.
        </p>
      </div>

      {/* 4-column row: 3 category cards + right rail */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        {CATEGORIES.map((cat) => {
          const ids = cat.activations.filter((a) => !a.dashboardOnly).map((a) => a.id);
          const catSelected = ids.filter((id) => selected.has(id));
          return (
            <div
              key={cat.id}
              className="flex-1 min-w-0 rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px]"
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
                <span className="w-16 h-16 rounded-full bg-[rgba(0,0,0,0.4)] flex flex-col items-center justify-center shrink-0">
                  <span className="font-display font-black text-[28px] text-white leading-none">
                    {catSelected.length}
                  </span>
                  <span className="text-xs text-white leading-none">Selected</span>
                </span>
              </div>

              <div className="h-px bg-border-divider" />

              {/* Select All / Clear All */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => selectAll(ids)}
                  className="flex items-center gap-2 text-base font-normal text-white"
                >
                  <Checkbox checked={catSelected.length === ids.length} />
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

              {/* Activation list */}
              <div className="flex flex-col gap-4">
                {order[cat.id].filter((id) => !ACTIVATION_BY_ID[id].dashboardOnly).map((id) => {
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggle(id)}
                          className="flex items-start gap-2 flex-1 text-left min-w-0"
                        >
                          <span className="mt-0.5">
                            <Checkbox checked={isSelected} />
                          </span>
                          <span className="flex flex-col gap-1 min-w-0">
                            <span className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-semibold text-white">{activation.title}</span>
                              {activation.recommended && (
                                <span className="text-xs text-white bg-[rgba(0,0,0,0.2)] px-2 py-1 rounded-[70px] backdrop-blur-[104px] leading-none">
                                  Recommended
                                </span>
                              )}
                            </span>
                            <span className="text-sm text-white/40">{activation.description}</span>
                          </span>
                        </button>
                        <span className="cursor-grab active:cursor-grabbing shrink-0">
                          <GripVertical className="w-6 h-6 text-white opacity-50" />
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
                          className="ml-8 h-10 rounded-[8px] px-3 bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.2)] text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-steel-blue"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer count */}
              <p className="text-base text-white">
                {catSelected.length} of {ids.length} selected
              </p>
            </div>
          );
        })}

        {/* Right rail */}
        <div className="flex-1 min-w-0 flex flex-col gap-10">
          {/* Activation Summary */}
          <div className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px] bg-surface-07">
            <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">
              Activation Summary
            </h3>
            <div className="flex justify-center">
              <ActivationDonut counts={counts} total={total} />
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Game Day", color: "#638BFE" },
                { label: "Support", color: "#65C162" },
                { label: "Engage", color: "#9D62C1" },
              ].map((legend) => (
                <div key={legend.label} className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ background: legend.color }}
                  />
                  <span className="text-base font-semibold text-white">{legend.label}</span>
                </div>
              ))}
            </div>
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
                  className="flex items-start gap-2 text-left"
                >
                  <span className="mt-0.5">
                    <Checkbox checked={selected.has(rec.id)} />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-base font-semibold text-white">{rec.title}</span>
                    <span className="text-sm text-white/40">{rec.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="h-px bg-border-divider" />

            <button
              type="button"
              onClick={applyRecommended}
              className="h-12 w-full rounded-[8px] px-3 bg-[rgba(235,235,235,0.25)] backdrop-blur-[48px] text-base font-medium text-white"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      <WizardFooter
        onBack={() => router.push(routes.ui.setupWizard.organizationDetails)}
        onSaveExit={async () => {
          if (await saveFeatureLinks()) router.push(routes.ui.indexRoute);
        }}
        primaryLabel="Next"
        primaryDisabled={saving}
        onPrimary={async () => {
          if (await saveFeatureLinks()) router.push(routes.ui.setupWizard.reviewPublish);
        }}
      />
    </div>
  );
}
