export interface BadgeStat {
  label: string;
  value: number | string;
  caption: string;
  // Background of the value badge (e.g. a translucent brand tint).
  tint: string;
}

// Stat card with the title on the left and the value in a tinted square badge
// (Teams, Buy Tickets).
export default function BadgeStatCard({ label, value, caption, tint }: BadgeStat) {
  return (
    <div className="rounded-[8px] p-6 flex flex-col gap-4 backdrop-blur-[48px] bg-surface-07">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">{label}</h3>
        <span
          className="size-16 shrink-0 rounded-[8px] flex items-center justify-center font-display font-black text-[28px] text-white leading-none"
          style={{ background: tint }}
        >
          {value}
        </span>
      </div>
      <span className="text-xs text-white/80">{caption}</span>
    </div>
  );
}

// Shared badge tints (brand colours at low opacity).
export const STAT_TINTS = {
  blue: "rgba(99,139,254,0.5)",
  green: "rgba(101,193,98,0.4)",
  purple: "rgba(157,98,193,0.4)",
  brown: "rgba(193,127,82,0.45)",
} as const;
