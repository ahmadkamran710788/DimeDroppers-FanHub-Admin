import { cn } from "@/utils/cn";
import type { FundableNeed } from "@/utils/types/fundable-need";

interface CardFaceProps {
  need: FundableNeed;
  // Printed across the top of the card.
  orgName: string;
  // Show the full number, expiry and CVC instead of dots.
  revealed: boolean;
}

// The card itself: the organisation, the need it pays for, and its (masked) details. Greyed out while frozen.
export default function CardFace({ need, orgName, revealed }: CardFaceProps) {
  const { card } = need;
  return (
    <div
      className={cn(
        "flex min-h-[210px] max-w-[400px] flex-[1_1_320px] flex-col justify-between gap-3 rounded-[16px] p-[22px] text-white",
        card.frozen && "bg-white/15 opacity-80"
      )}
      style={card.frozen ? undefined : { background: "var(--gradient-cta)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[1.5px] opacity-90">{orgName}</span>
        <span className="shrink-0 rounded-full border border-white/60 px-2 py-0.5 text-[11px] font-bold tracking-[1px]">VIRTUAL</span>
      </div>
      <span className="text-sm font-medium">{need.title}</span>
      <span className="font-mono text-lg sm:text-xl tracking-[2px]">
        <span aria-hidden="true">{revealed ? card.number : `•••• •••• •••• ${card.last4}`}</span>
        <span className="sr-only">{revealed ? `Card number ${card.number}` : `Card ending in ${card.last4}`}</span>
      </span>
      <div className="flex items-end justify-between text-xs">
        <span className="flex gap-[18px]">
          <span>{`EXP ${revealed ? card.exp : "••/••"}`}</span>
          <span>{`CVC ${revealed ? card.cvc : "•••"}`}</span>
        </span>
        <span className="text-base font-bold italic tracking-[0.5px]">VISA</span>
      </div>
    </div>
  );
}
