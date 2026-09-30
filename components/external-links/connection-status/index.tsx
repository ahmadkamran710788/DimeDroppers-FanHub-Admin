import { cn } from "@/utils/cn";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";

export type ConnectionState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "success"; checkedAt: Date }
  | { kind: "error"; message: string; checkedAt: Date };

interface ConnectionStatusProps {
  state: ConnectionState;
  providerName: string;
  className?: string;
}

const fmtChecked = (d: Date) => {
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const isToday = d.toDateString() === new Date().toDateString();
  return `Last checked: ${isToday ? "Today" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${time}`;
};

// Result box under a link field after "Test Connection" (success / error / checking).
export default function ConnectionStatus({ state, providerName, className }: ConnectionStatusProps) {
  if (state.kind === "idle") return null;

  const ok = state.kind === "success";
  const failed = state.kind === "error";

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-4 rounded-[8px] border px-4 py-3.5",
        ok && "border-success/50 bg-success/10",
        failed && "border-error/50 bg-error/10",
        state.kind === "checking" && "border-white/20 bg-white/5",
        className
      )}
    >
      {ok && <CircleCheck className="size-7 shrink-0 fill-success text-[#0E2A12]" strokeWidth={2.5} />}
      {failed && <CircleX className="size-7 shrink-0 fill-error text-[#2A0E0E]" strokeWidth={2.5} />}
      {state.kind === "checking" && <Loader2 className="size-6 shrink-0 text-white animate-spin" />}

      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className={cn("text-base font-medium", ok ? "text-success" : failed ? "text-error" : "text-white")}>
          {ok ? "Connection successful" : failed ? "Connection failed" : "Testing connection…"}
        </span>
        <span className="text-sm text-white/70">
          {ok
            ? `Your ${providerName} link is working and accessible.`
            : failed
              ? state.message
              : `Checking your ${providerName} link.`}
        </span>
      </div>

      {state.kind !== "checking" && (
        <span className={cn("text-xs shrink-0 hidden sm:block", ok ? "text-success" : "text-error")}>
          {fmtChecked(state.checkedAt)}
        </span>
      )}
    </div>
  );
}
