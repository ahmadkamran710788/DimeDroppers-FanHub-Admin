import { Triangle } from "lucide-react";
import { cn } from "@/utils/cn";

export interface Stat {
  label: string;
  value: string;
  // Background of the value bar.
  tint: string;
  // Change vs the previous period in percent; omitted when the caption is static.
  change?: number;
  // Arrow with no percentage; the whole caption takes the arrow colour (e.g. "▲ Curated by Dime Droppers").
  trend?: "up" | "down";
  caption: string;
}

interface StatCardProps extends Stat {
  // Figma's narrow-card title: wraps at the design's 145px title width and always takes two lines,
  // so a row of cards lines up even when some titles fit on one.
  twoLineTitle?: boolean;
}

// Stat card with the title on top and the value in a full-width tinted bar.
export default function StatCard({ label, value, tint, change, trend, caption, twoLineTitle = false }: StatCardProps) {
  const up = change !== undefined ? change >= 0 : trend === "up";
  const showArrow = change !== undefined || trend !== undefined;
  return (
    <div className="rounded-[8px] p-6 flex flex-col gap-2 backdrop-blur-[24px] bg-surface-07">
      <h3 className={cn("font-display font-extrabold text-[28px] uppercase text-white leading-normal", twoLineTitle && "min-h-[2lh] max-w-[145px]")}>
        {label}
      </h3>
      <div
        className="h-16 p-4 rounded-[8px] backdrop-blur-[24px] flex items-center justify-center font-display font-extrabold text-[28px] uppercase text-white leading-normal"
        style={{ background: tint }}
      >
        {value}
      </div>
      <div className="flex items-center gap-1 text-xs leading-[19px] text-white">
        {showArrow && (
          <>
            <Triangle
              className={cn("size-2 fill-current", up ? "text-success" : "text-error rotate-180")}
              strokeWidth={0}
            />
            {change !== undefined && <span className={up ? "text-success" : "text-error"}>{`${change}%`}</span>}
          </>
        )}
        <span className={cn(trend && (up ? "text-success" : "text-error"))}>{caption}</span>
      </div>
    </div>
  );
}
