"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Settings } from "lucide-react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import StepIndicator from "@/components/common/step-indicator";
import Tabs from "@/components/common/tabs";
import CalendarCard from "@/components/organization/sponsor-ai-agent/calendar-card";
import SearchStep from "@/components/organization/sponsor-ai-agent/search-step";
import ReviewStep from "@/components/organization/sponsor-ai-agent/review-step";
import {
  AGENT_TABS,
  AGENT_TAB_LABELS,
  scopeKey,
  type AgentScope,
  type AgentTab,
} from "@/components/organization/sponsor-ai-agent/data";
import { useSponsorAiSetup } from "@/components/organization/sponsor-ai-agent/use-sponsor-ai-setup";
import { useSponsorAiRun } from "@/components/organization/sponsor-ai-agent/use-sponsor-ai-run";
import { useSponsorDrafts } from "@/components/organization/sponsor-ai-agent/use-sponsor-drafts";
import { useSponsorThreadCount } from "@/components/organization/sponsor-ai-agent/use-sponsor-thread-count";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent } from "@/context/selected-event";
import { routes } from "@/utils/routes";
import type { DraftStatusFilter, SponsorAiRun } from "@/utils/types/sponsor-ai";

type Step = "search" | "review";

const TAB_ICONS: Record<AgentTab, ReactNode> = {
  agent: <Search className="size-4" aria-hidden="true" />,
  settings: <Settings className="size-4" aria-hidden="true" />,
};

interface SponsorAiAgentPageProps {
  // From ?tab=.
  initialTab?: AgentTab;
}

// Sponsor AI Agent (FANHUB_SPONSOR_AI_FRONTEND.md), in two tabs. Find Sponsors: pick the event
// (tournaments), business categories and a radius; the agent finds local businesses and drafts an email to
// each, which the organiser edits, rejects or approves. A school searches around itself, a tournament per
// event. Settings: the calendar sponsors book calls in (FANHUB_SPONSOR_AI_CALENDAR_FRONTEND.md).
export default function SponsorAiAgentPage({ initialTab = "agent" }: SponsorAiAgentPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState<AgentTab>(initialTab);
  // Settings loads the first time it opens, then stays mounted (hidden) like Find Sponsors.
  const [settingsOpened, setSettingsOpened] = useState(initialTab === "settings");
  const kind = orgKindOf(useAuth().org);
  const isTournament = kind === "tournament";
  const { event, setEvent } = useSelectedEvent();
  // Nothing loads until the org type is known.
  const scope: AgentScope | null = kind === null ? null : { isTournament, eventId: isTournament ? event?.id : undefined };
  const key = scopeKey(scope);

  const setup = useSponsorAiSetup(scope);
  const [status, setStatus] = useState<DraftStatusFilter>("PENDING");
  const [page, setPage] = useState(1);
  const drafts = useSponsorDrafts(scope, status, page);
  const threads = useSponsorThreadCount(scope);
  // null until the opening step is known (below).
  const [step, setStep] = useState<Step | null>(null);
  // The search that just failed or was blocked here, shown under Find Sponsors.
  const [failure, setFailure] = useState<SponsorAiRun | null>(null);

  const search = useSponsorAiRun(scope, (run) => {
    if (run.status !== "COMPLETED") return setFailure(run);
    setFailure(null);
    setStatus("PENDING");
    setPage(1);
    drafts.reload();
    setStep("review");
  });

  // The categories and radius picked, per organisation or event; the recommended ones and the default
  // radius until the user changes them.
  const [picked, setPicked] = useState<{ key: string; categories: string[]; radius: number } | null>(null);
  const options = setup.options;
  const mine = picked?.key === key ? picked : null;
  const categories = mine?.categories ?? options?.categories.filter((c) => c.recommended).map((c) => c.category) ?? [];
  const radius = mine?.radius ?? options?.defaultRadiusMiles ?? 10;

  // A reject can empty the last page.
  const totalPages = drafts.list?.pagination.totalPages ?? 0;
  if (totalPages > 0 && page > totalPages) setPage(totalPages);

  const pending = drafts.list?.counts.PENDING ?? 0;
  // Where the page opens, decided once: the drafts if any are waiting and no search is running. A
  // tournament without an event has none to wait for (its event picker is in Step 1).
  const opening: Step | null =
    !scope ? null : !key ? "search" : drafts.loading || search.loading ? null : pending > 0 && !search.active ? "review" : "search";
  if (step === null && opening !== null) setStep(opening);
  const shown = step ?? opening;

  async function find() {
    setFailure(null);
    const result = await search.start({ categories, radiusMiles: radius });
    // Something the readiness check didn't list has come up: show it.
    if (result === 422) setup.reload();
  }

  function openTab(next: AgentTab) {
    setTab(next);
    if (next === "settings") setSettingsOpened(true);
    // Keeps the tab on a refresh or a copied link, without a navigation.
    window.history.replaceState(null, "", `?tab=${next}`);
  }

  const steps = [
    {
      title: "Choose event, category & radius",
      subtitle: [isTournament && event?.name, `${categories.length} categories`, `${radius} mi`].filter(Boolean).join(" · "),
    },
    { title: "Review & approve follow-ups", subtitle: `${pending} ${pending === 1 ? "draft" : "drafts"} waiting` },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col gap-2 text-white max-w-[720px]">
          <h2 className="font-display font-extrabold text-[32px] sm:text-[40px] lg:text-[56px] lg:leading-[68px] uppercase leading-none">
            Sponsor AI Agent
          </h2>
          <p className="text-base leading-[26px]">
            Pick the event you need sponsors for, then the kinds of businesses you want and how far to look. The
            agent finds local matches and drafts a follow-up for each one with your sponsorship packages inside.
          </p>
        </div>
        <Button
          size="sm"
          label={
            threads === null
              ? "Agent active · Sponsor Messages"
              : `Agent active · ${threads} ${threads === 1 ? "conversation" : "conversations"} in Sponsor Messages`
          }
          icon={<span className="size-2 rounded-full bg-success" />}
          onClick={() => router.push(routes.ui.sponsorMessages)}
          className="shrink-0 h-10 px-4 text-sm border border-success/40 bg-[#1d3a1e] text-[#a3e3a5] hover:bg-[#244a26]"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <Tabs
        tabs={AGENT_TABS}
        active={tab}
        onChange={openTab}
        labels={AGENT_TAB_LABELS}
        icons={TAB_ICONS}
        className="-mb-4 flex-wrap"
      />

      <div role="tabpanel" aria-label={AGENT_TAB_LABELS.agent} hidden={tab !== "agent"}>
        <div className="flex flex-col gap-10">
          <StepIndicator steps={steps} current={shown === "review" ? 1 : 0} />

          {shown === null ? (
            <Loader />
          ) : shown === "search" ? (
            <SearchStep
              event={isTournament ? event : null}
              onEventChange={
                isTournament
                  ? (id, name) => {
                      setEvent({ id, name });
                      setPage(1);
                    }
                  : undefined
              }
              setup={setup}
              search={search}
              failure={failure && (failure.eventId ?? undefined) === scope?.eventId ? failure : null}
              categories={categories}
              onCategoriesChange={(next) => setPicked({ key, categories: next, radius })}
              radius={radius}
              onRadiusChange={(next) => setPicked({ key, categories, radius: next })}
              pendingCount={pending}
              onReview={() => setStep("review")}
              onFind={find}
            />
          ) : (
            <ReviewStep
              drafts={drafts}
              status={status}
              onStatusChange={(next) => {
                setStatus(next);
                setPage(1);
              }}
              page={page}
              onPageChange={setPage}
              eventName={isTournament ? event?.name : undefined}
              run={search.run}
              onChangeSearch={() => setStep("search")}
            />
          )}
        </div>
      </div>

      {settingsOpened && (
        <div role="tabpanel" aria-label={AGENT_TAB_LABELS.settings} hidden={tab !== "settings"}>
          <CalendarCard />
        </div>
      )}
    </div>
  );
}
