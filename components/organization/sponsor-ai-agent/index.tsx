"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import StepIndicator from "@/components/common/step-indicator";
import SearchStep from "@/components/organization/sponsor-ai-agent/search-step";
import ReviewStep from "@/components/organization/sponsor-ai-agent/review-step";
import { scopeKey, type AgentScope } from "@/components/organization/sponsor-ai-agent/data";
import { useSponsorAiSetup } from "@/components/organization/sponsor-ai-agent/use-sponsor-ai-setup";
import { useSponsorAiRun } from "@/components/organization/sponsor-ai-agent/use-sponsor-ai-run";
import { useSponsorDrafts } from "@/components/organization/sponsor-ai-agent/use-sponsor-drafts";
import { orgKindOf, useAuth } from "@/context/auth";
import { useSelectedEvent } from "@/context/selected-event";
import { routes } from "@/utils/routes";
import type { DraftStatusFilter, SponsorAiRun } from "@/utils/types/sponsor-ai";

type Step = "search" | "review";

// Sponsor AI Agent (FANHUB_SPONSOR_AI_FRONTEND.md): pick the event (tournaments), business categories and
// a radius; the agent finds local businesses and drafts an email to each, which the organiser edits or
// rejects (approving comes with its API). A school searches around itself, a tournament per event.
export default function SponsorAiAgentPage() {
  const router = useRouter();
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
  const threads = drafts.list?.counts.APPROVED ?? 0;
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
          label={`Agent active · ${threads} ${threads === 1 ? "thread" : "threads"} in Sponsor Messages`}
          icon={<span className="size-2 rounded-full bg-success" />}
          onClick={() => router.push(routes.ui.sponsorMessages)}
          className="shrink-0 h-10 px-4 text-sm border border-success/40 bg-[#1d3a1e] text-[#a3e3a5] hover:bg-[#244a26]"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

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
  );
}
