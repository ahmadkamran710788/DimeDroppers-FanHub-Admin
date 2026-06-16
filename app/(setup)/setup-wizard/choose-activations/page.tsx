"use client";

import ActivationDonut from "@/components/setup/ActivationDonut";
import StepIndicator from "@/components/common/StepIndicator";
import WizardFooter from "@/components/common/WizardFooter";
import { cn } from "@/utils/cn";
import { useSetup } from "@/context/setup";
import { routes } from "@/utils/routes";
import type { SavedSchool } from "@/utils/types/school";
import { Check, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface Activation {
  id: string;
  title: string;
  description: string;
  recommended?: boolean;
}

interface Category {
  id: string;
  label: string;
  description: string;
  color: string;
  activations: Activation[];
}

const CATEGORIES: Category[] = [
  {
    id: "game-day",
    label: "Game Day",
    description: "Essential game information, access and live experiences.",
    color: "rgba(99,139,254,0.5)",
    activations: [
      { id: "buy-tickets", title: "Buy Tickets", description: "Sell tickets directly in your Fan Hub.", recommended: true },
      { id: "watch-game", title: "Watch Game", description: "Live stream games and events.", recommended: true },
      { id: "partner-offers", title: "Partner Offers", description: "Showcase offers from your partners." },
      { id: "highlights-stats", title: "Highlights & Stats", description: "Game highlights, stats and recaps.", recommended: true },
    ],
  },
  {
    id: "support",
    label: "Support",
    description: "Drive support and raise funds for your teams.",
    color: "rgba(101,193,98,0.4)",
    activations: [
      { id: "support-team", title: "Support a Team", description: "Accept donations and support.", recommended: true },
      { id: "shout-out-wall", title: "Shout Out Wall", description: "Fans can send messages and shout outs.", recommended: true },
      { id: "team-stores", title: "Team Stores", description: "Sell team merchandise." },
      { id: "record-game", title: "Record Game", description: "Record games for your team.", recommended: true },
      { id: "score-game", title: "Score Game", description: "Live scoring and game updates.", recommended: true },
    ],
  },
  {
    id: "engage",
    label: "Engage",
    description: "Interactive fun that keeps fans coming back.",
    color: "rgba(157,98,193,0.4)",
    activations: [
      { id: "predict", title: "Predict", description: "Make predictions and win points.", recommended: true },
      { id: "vote", title: "Vote", description: "Vote in polls and fan votes.", recommended: true },
      { id: "arcade", title: "Arcade", description: "Play fun games and earn points." },
      { id: "challenges-quests", title: "Challenges & Quests", description: "Complete challenges and earn rewards.", recommended: true },
      { id: "fan-wall", title: "Fan Wall", description: "Post photos, videos and cheers.", recommended: true },
      { id: "chat", title: "Chat", description: "Chat with other fans.", recommended: true },
    ],
  },
];

// Lookup of every activation by id, for rendering from the order arrays.
const ACTIVATION_BY_ID: Record<string, Activation> = Object.fromEntries(
  CATEGORIES.flatMap((c) => c.activations).map((a) => [a.id, a])
);

// Right-rail "Recommended for you" highlights.
const RECOMMENDED_FOR_YOU: { id: string; title: string; subtitle: string }[] = [
  { id: "watch-game", title: "Watch Game", subtitle: "High fan engagement." },
  { id: "support-team", title: "Support a Team", subtitle: "Top revenue driver." },
  { id: "highlights-stats", title: "Highlights & Stats", subtitle: "Most popular feature." },
  { id: "fan-wall", title: "Fan Wall", subtitle: "Boosts community." },
];

// Maps each activation id to its backend feature-links payload key (camelCase).
const FEATURE_LINK_KEY: Record<string, string> = {
  "buy-tickets": "buyTickets",
  "watch-game": "watchGame",
  "partner-offers": "partnerOffers",
  "highlights-stats": "highlightsStats",
  "support-team": "supportTeam",
  "shout-out-wall": "shoutOutWall",
  "team-stores": "teamStores",
  "record-game": "recordGame",
  "score-game": "scoreGame",
  predict: "predict",
  vote: "vote",
  arcade: "arcade",
  "challenges-quests": "challengesQuests",
  "fan-wall": "fanWall",
  chat: "chat",
};

// Maps each activation id to the school field the GET returns it under (for rehydrate).
// Most are `<key>Link`, but the backend remaps two: buy-tickets → `gofanSchoolPage`,
// watch-game → `nfhsNetworkLink` (verified against the live feature-links response).
const SAVED_LINK_FIELD: Record<string, keyof SavedSchool> = {
  "buy-tickets": "gofanSchoolPage",
  "watch-game": "nfhsNetworkLink",
  "partner-offers": "partnerOffersLink",
  "highlights-stats": "highlightsStatsLink",
  "support-team": "supportTeamLink",
  "shout-out-wall": "shoutOutWallLink",
  "team-stores": "teamStoresLink",
  "record-game": "recordGameLink",
  "score-game": "scoreGameLink",
  predict: "predictLink",
  vote: "voteLink",
  arcade: "arcadeLink",
  "challenges-quests": "challengesQuestsLink",
  "fan-wall": "fanWallLink",
  chat: "chatLink",
};

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "w-6 h-6 rounded shrink-0 flex items-center justify-center border-2 transition-colors",
        checked ? "bg-steel-blue border-steel-blue" : "border-[rgba(255,255,255,0.3)] bg-transparent"
      )}
    >
      {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
    </span>
  );
}

export default function ChooseActivationsPage() {
  const router = useRouter();
  const { savedSchool, refreshSchool } = useSetup();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Per-activation URL entered once an activation is selected.
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Per-category display order (drag-to-reorder, purely visual).
  const [order, setOrder] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.id, c.activations.map((a) => a.id)]))
  );
  const dragRef = useRef<{ catId: string; id: string } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  // Prefill from the saved school's feature links on first mount only. The ref guard
  // prevents re-running when savedSchool updates (e.g. after refreshSchool() is called
  // on save), which would overwrite the user's in-progress local changes.
  useEffect(() => {
    if (hydratedRef.current || !savedSchool) return;
    hydratedRef.current = true;
    const restoredSelected = new Set<string>();
    const restoredUrls: Record<string, string> = {};
    for (const [id, field] of Object.entries(SAVED_LINK_FIELD)) {
      const value = savedSchool[field];
      if (typeof value === "string" && value) {
        restoredSelected.add(id);
        restoredUrls[id] = value;
      }
    }
    if (restoredSelected.size === 0) return;
    setSelected(restoredSelected);
    setUrls(restoredUrls);
  }, [savedSchool]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setUrls((u) => {
          const copy = { ...u };
          delete copy[id];
          return copy;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = (ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearAll = (ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setUrls((prev) => {
      const copy = { ...prev };
      ids.forEach((id) => delete copy[id]);
      return copy;
    });
  };

  const applyRecommended = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      RECOMMENDED_FOR_YOU.forEach((r) => next.add(r.id));
      return next;
    });
  };

  // PATCH the entered feature-link URLs for the selected activations. Returns true on
  // success so the caller can decide where to navigate. Only selected activations with a
  // non-empty URL are sent; blanks are omitted.
  const saveFeatureLinks = async (): Promise<boolean> => {
    const schoolId = sessionStorage.getItem("fanhub:schoolId");
    if (!schoolId) {
      toast.error("No school found. Please complete Step 1 first.");
      return false;
    }

    const links: Record<string, string> = {};
    for (const [id, key] of Object.entries(FEATURE_LINK_KEY)) {
      links[key] = selected.has(id) ? (urls[id]?.trim() ?? "") : "";
    }

    setSaving(true);
    try {
      const res = await fetch(routes.api.proxyFeatureLinks, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, ...links }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.message || "Couldn't save your activations. Please try again.");
        return false;
      }
      toast.success("Activations saved.");
      await refreshSchool();
      return true;
    } catch {
      toast.error("Something went wrong. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (catId: string, targetId: string) => {
    const src = dragRef.current;
    dragRef.current = null;
    setDraggingId(null);
    if (!src || src.catId !== catId || src.id === targetId) return;
    setOrder((prev) => {
      const list = [...prev[catId]];
      const from = list.indexOf(src.id);
      const to = list.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      list.splice(from, 1);
      list.splice(to, 0, src.id);
      return { ...prev, [catId]: list };
    });
  };

  const total = selected.size;
  const counts = {
    gameDay: CATEGORIES[0].activations.filter((a) => selected.has(a.id)).length,
    support: CATEGORIES[1].activations.filter((a) => selected.has(a.id)).length,
    engage: CATEGORIES[2].activations.filter((a) => selected.has(a.id)).length,
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <StepIndicator currentStep={3} />

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
          const ids = cat.activations.map((a) => a.id);
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
                {order[cat.id].map((id) => {
                  const activation = ACTIVATION_BY_ID[id];
                  const isSelected = selected.has(id);
                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={() => {
                        dragRef.current = { catId: cat.id, id };
                        setDraggingId(id);
                      }}
                      onDragEnd={() => {
                        dragRef.current = null;
                        setDraggingId(null);
                      }}
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
                          onChange={(e) => setUrls((p) => ({ ...p, [id]: e.target.value }))}
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
        onBack={() => router.push(routes.ui.setupWizard.importSchedule)}
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
