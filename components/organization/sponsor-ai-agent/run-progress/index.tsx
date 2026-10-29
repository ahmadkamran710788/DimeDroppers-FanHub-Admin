import ProgressBar from "@/components/common/progress-bar";
import StepIndicator from "@/components/common/step-indicator";
import { RUN_STAGES } from "@/components/organization/sponsor-ai-agent/data";
import type { SponsorAiRun } from "@/utils/types/sponsor-ai";

interface RunProgressProps {
  run: SponsorAiRun;
}

// A search in progress: its stage and how many businesses have made it through so far. The counts
// arrive stage by stage; the number of emails written only at the end.
export default function RunProgress({ run }: RunProgressProps) {
  // -1 while QUEUED, before the first stage.
  const stage = RUN_STAGES.findIndex((s) => s.status === run.status);
  const label = stage === -1 ? "Starting…" : `${RUN_STAGES[stage].label}…`;
  const counts = [
    [run.foundCount, "businesses found"],
    [run.candidateCount, "new good matches"],
    [run.qualifiedCount, "with a verified contact"],
    [run.noContactCount, "without an email we can use"],
  ] as const;

  return (
    <div role="status" aria-live="polite" className="w-full flex flex-col gap-4 rounded-[12px] border border-[#8b6dff]/40 bg-[#2a2148]/40 p-4 lg:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-base font-semibold text-white">{label}</span>
        <span className="text-xs text-white/60">This takes 1–4 minutes. You can leave this page; the search keeps going.</span>
      </div>
      <ProgressBar
        percent={Math.max(5, ((stage + 1) / (RUN_STAGES.length + 1)) * 100)}
        ariaLabel="Search progress"
        barClassName="bg-[#8b6dff] transition-[width] duration-500"
      />
      <StepIndicator steps={RUN_STAGES.map((s) => ({ title: s.label }))} current={Math.max(0, stage)} />
      <p className="text-sm text-white/70">
        {counts.filter(([n]) => n > 0).map(([n, what]) => `${n} ${what}`).join(" · ") || "Looking for local businesses…"}
      </p>
    </div>
  );
}
