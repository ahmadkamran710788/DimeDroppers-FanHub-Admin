import { Check } from "lucide-react";
import { EVENT, READINESS } from "@/components/command-center/data";
import { cn } from "@/utils/cn";

// Event readiness score with the checklist behind it.
export default function ReadinessCard() {
  return (
    <section className="rounded-[8px] p-6 flex flex-col gap-4 bg-surface-07 backdrop-blur-[24px]">
      <h3 className="font-display font-extrabold text-[28px] uppercase text-white leading-none">Event Readiness</h3>
      <div className="flex items-center gap-4">
        <span className="font-display font-extrabold text-[40px] text-white leading-none">{`${EVENT.readiness}%`}</span>
        <div
          role="progressbar"
          aria-valuenow={EVENT.readiness}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Event readiness"
          className="flex-1 h-2 rounded-full bg-black/40"
        >
          <div className="h-2 rounded-full" style={{ width: `${EVENT.readiness}%`, background: "var(--gradient-cta)" }} />
        </div>
      </div>
      <ul className="flex flex-col rounded-[8px] overflow-hidden border border-white/10">
        {READINESS.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-4 px-4 py-3 bg-white/5 border-b border-white/10 last:border-b-0 text-sm text-white"
          >
            {item.label}
            {item.tone === "done" ? (
              <Check className="size-4 text-success" strokeWidth={3} aria-label="Done" />
            ) : (
              <span className={cn("font-semibold", item.tone === "warning" ? "text-error" : "text-white")}>{item.value}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
