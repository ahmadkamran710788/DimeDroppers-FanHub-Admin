import { Triangle } from "lucide-react";
import { cn } from "@/utils/cn";
import type { FundraisingStat } from "@/components/fundraising/data";

// Stat card with the title on top and the value in a full-width tinted bar.
export default function StatCard({ label, value, tint, change, caption }: FundraisingStat) {
  const up = change !== undefined && change >= 0;
  return (
    <div className="rounded-[8px] p-6 flex flex-col gap-2 backdrop-blur-[24px] bg-surface-07">
      <h3 className="font-display font-extrabold text-[28px] uppercase text-white leading-normal">{label}</h3>
      <div
        className="h-16 p-4 rounded-[8px] backdrop-blur-[24px] flex items-center justify-center font-display font-extrabold text-[28px] uppercase text-white leading-normal"
        style={{ background: tint }}
      >
        {value}
      </div>
      <div className="flex items-center gap-1 text-xs leading-[19px] text-white">
        {change !== undefined && (
          <>
            <Triangle
              className={cn("size-2 fill-current", up ? "text-success" : "text-error rotate-180")}
              strokeWidth={0}
            />
            <span className={up ? "text-success" : "text-error"}>{`${change}%`}</span>
          </>
        )}
        <span>{caption}</span>
      </div>
    </div>
  );
}
